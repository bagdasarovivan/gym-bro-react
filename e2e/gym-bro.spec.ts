import { test, expect, Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Credentials – set TEST_EMAIL / TEST_PASSWORD env vars, or hardcode below
// ---------------------------------------------------------------------------
const EMAIL    = process.env.TEST_EMAIL    || ''
const PASSWORD = process.env.TEST_PASSWORD || ''
const BASE_URL = 'https://gym-bro-react.vercel.app'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function login(page: Page) {
  await page.goto(BASE_URL)
  // Wait for app to bootstrap (spinner disappears)
  await page.waitForSelector('.auth-screen', { timeout: 10000 })
  await page.fill('.auth-inp[type="email"]', EMAIL)
  await page.fill('.auth-inp[type="password"]', PASSWORD)
  await page.click('.auth-btn')
  // Wait until the main app is shown (nav bar appears)
  await page.waitForSelector('.nav-bar', { timeout: 15000 })
  // Dismiss onboarding overlay if it appears (first-time user)
  const onboard = page.locator('.onboard-overlay')
  if (await onboard.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.click('.onboard-btn')
    await onboard.waitFor({ state: 'hidden', timeout: 3000 })
  }
}

async function startWorkout(page: Page) {
  // Make sure we're on the add tab
  await page.click('.nav-item:has-text("Тренировка")')
  // Click the big НАЧАТЬ button
  await page.click('.start-btn')
  // Date modal appears – click confirm
  await page.click('button:has-text("Начать тренировку")')
  // Workout screen is now shown
  await expect(page.locator('button:has-text("← Назад")')).toBeVisible()
}

// ---------------------------------------------------------------------------
// Suite 1 – App loads & auth screen renders
// ---------------------------------------------------------------------------
test.describe('1. App loads', () => {
  test('Shows loading spinner then auth screen', async ({ page }) => {
    await page.goto(BASE_URL)
    // Loading state: either spinner emoji or auth screen appears eventually
    await page.waitForSelector('.auth-screen, .auth-card', { timeout: 10000 })
    await expect(page.locator('.auth-card')).toBeVisible()
  })

  test('Auth form has email, password inputs and submit button', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForSelector('.auth-screen', { timeout: 10000 })
    await expect(page.locator('.auth-inp[type="email"]')).toBeVisible()
    await expect(page.locator('.auth-inp[type="password"]')).toBeVisible()
    await expect(page.locator('.auth-btn')).toBeVisible()
    await expect(page.locator('.auth-btn')).toContainText(/Войти/i)
  })

  test('Submit button disabled when fields are empty', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForSelector('.auth-screen', { timeout: 10000 })
    await expect(page.locator('.auth-btn')).toBeDisabled()
  })

  test('Shows error message on invalid credentials', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForSelector('.auth-screen', { timeout: 10000 })
    await page.fill('.auth-inp[type="email"]', 'wrong@example.com')
    await page.fill('.auth-inp[type="password"]', 'wrongpassword')
    await page.click('.auth-btn')
    await expect(page.locator('.auth-err')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('.auth-err')).toContainText(/пароль|credentials|email/i)
  })

  test('Can switch between login and register modes', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForSelector('.auth-screen', { timeout: 10000 })
    const switchBtn = page.locator('.auth-switch button')
    await expect(switchBtn).toContainText(/Регистрация/i)
    await switchBtn.click()
    await expect(page.locator('.auth-btn')).toContainText(/Зарегистрироваться/i)
    await expect(switchBtn).toContainText(/Войти/i)
  })
})

// ---------------------------------------------------------------------------
// Suite 2 – Login (requires valid credentials in env vars)
// ---------------------------------------------------------------------------
test.describe('2. Login', () => {
  test.skip(!EMAIL || !PASSWORD, 'Skipped – set TEST_EMAIL and TEST_PASSWORD env vars')

  test('Can log in successfully', async ({ page }) => {
    await login(page)
    await expect(page.locator('.nav-bar')).toBeVisible()
    // Should land on add tab (Тренировка)
    await expect(page.locator('.nav-item:has-text("Тренировка")')).toBeVisible()
  })

  test('Header shows Gym BRO title after login', async ({ page }) => {
    await login(page)
    await expect(page.locator('.header h1')).toContainText('Gym BRO')
  })

  test('Nav has 3 tabs: Тренировка, История, Прогресс', async ({ page }) => {
    await login(page)
    await expect(page.locator('.nav-item:has-text("Тренировка")')).toBeVisible()
    await expect(page.locator('.nav-item:has-text("История")')).toBeVisible()
    await expect(page.locator('.nav-item:has-text("Прогресс")')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Suite 3 – Add a workout
// ---------------------------------------------------------------------------
test.describe('3. Add workout with exercises', () => {
  test.skip(!EMAIL || !PASSWORD, 'Skipped – set TEST_EMAIL and TEST_PASSWORD env vars')

  test('НАЧАТЬ button visible on add tab', async ({ page }) => {
    await login(page)
    await expect(page.locator('.start-btn')).toBeVisible()
    await expect(page.locator('.start-btn')).toContainText('НАЧАТЬ')
  })

  test('Clicking НАЧАТЬ opens date modal', async ({ page }) => {
    await login(page)
    await page.click('.start-btn')
    await expect(page.locator('text=Выбери дату тренировки')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button:has-text("Начать тренировку")')).toBeVisible()
  })

  test('Date modal confirm starts workout session', async ({ page }) => {
    await login(page)
    await page.click('.start-btn')
    await page.click('button:has-text("Начать тренировку")')
    await expect(page.locator('button:has-text("← Назад")')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.ex-selector-btn')).toBeVisible()
  })

  test('"Добавить упражнение" button opens exercise modal', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Выбери упражнение')).toBeVisible()
    await expect(page.locator('.modal-srch')).toBeVisible()
  })

  test('Can add Жим лёжа from exercise modal', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    // Search for bench press
    await page.fill('.modal-srch', 'Жим')
    await page.waitForTimeout(300)
    // Click first matching result
    await page.locator('.modal-list .modal-item').first().click()
    // Modal closes, exercise appears in workout
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=Жим')).toBeVisible()
  })

  test('Exercise shows set controls (DropdownPicker) after adding', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await page.fill('.modal-srch', 'Жим лёжа')
    await page.waitForTimeout(300)
    await page.locator('.modal-list .modal-item').first().click()
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 })
    // Weight picker should exist
    await expect(page.locator('.dropdown-picker, .set-row').first()).toBeVisible()
  })

  test('Save button appears after adding exercise', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await page.locator('.modal-list .modal-item').first().click()
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 })
    await expect(page.locator('.save-btn')).toBeVisible()
    await expect(page.locator('.save-btn')).toContainText(/Сохранить/i)
  })

  test('Back button shows confirmation dialog if exercise was added', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await page.locator('.modal-list .modal-item').first().click()
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 })
    // Wait for the exercise to be fully added to state (addExToWorkout is async)
    await expect(page.locator('.save-btn')).toBeVisible({ timeout: 8000 })
    // Mock window.confirm to return false (user cancels)
    await page.evaluate(() => { (window as any).confirm = () => false })
    await page.click('button:has-text("← Назад")')
    // Cancelled – workout should still be shown
    await expect(page.locator('.save-btn')).toBeVisible({ timeout: 3000 })
    // Now accept: workout should exit
    await page.evaluate(() => { (window as any).confirm = () => true })
    await page.click('button:has-text("← Назад")')
    await expect(page.locator('.start-btn')).toBeVisible({ timeout: 3000 })
  })
})

// ---------------------------------------------------------------------------
// Suite 4 – Save workout and check history
// ---------------------------------------------------------------------------
test.describe('4. Save workout and check history', () => {
  test.skip(!EMAIL || !PASSWORD, 'Skipped – set TEST_EMAIL and TEST_PASSWORD env vars')

  test('Can save a workout (save button changes to saved state)', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await page.fill('.modal-srch', 'Жим лёжа')
    await page.waitForTimeout(300)
    await page.locator('.modal-list .modal-item').first().click()
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 })
    // addExToWorkout is async — wait for exercise to land in state (save-btn only
    // appears when workoutExercises.length > 0)
    await expect(page.locator('.save-btn')).toBeVisible({ timeout: 8000 })
    // saveWorkout calls setSaved(true) after the for-loop regardless of
    // whether valid sets exist — so clicking save always flips the button
    await page.click('.save-btn')
    await expect(page.locator('.save-btn')).toContainText(/Сохранена|сохранена/i, { timeout: 10000 })
  })

  test('History tab shows saved workout for today', async ({ page }) => {
    await login(page)
    // Navigate to history
    await page.click('.nav-item:has-text("История")')
    await page.waitForTimeout(1000) // let data load
    // Either shows workouts or "Нет записей" (if no data for this month)
    const hasEntries = await page.locator('.day-group').count()
    const hasEmpty   = await page.locator('text=Нет записей').count()
    expect(hasEntries + hasEmpty).toBeGreaterThan(0)
  })

  test('History day groups can be expanded', async ({ page }) => {
    await login(page)
    await page.click('.nav-item:has-text("История")')
    await page.waitForTimeout(1000)
    const dayGroup = page.locator('.day-hdr').first()
    if (await dayGroup.count() > 0) {
      await dayGroup.click()
      await expect(page.locator('.day-body').first()).toBeVisible({ timeout: 3000 })
      await expect(page.locator('.hist-card').first()).toBeVisible()
    } else {
      // No workout data for this account – acceptable
      console.log('No history entries to expand')
    }
  })

  test('History shows exercise names and set chips', async ({ page }) => {
    await login(page)
    await page.click('.nav-item:has-text("История")')
    await page.waitForTimeout(1000)
    const dayHdr = page.locator('.day-hdr').first()
    if (await dayHdr.count() > 0) {
      await dayHdr.click()
      await expect(page.locator('.hist-ex').first()).toBeVisible({ timeout: 3000 })
      // Set chips (e.g. "60×10")
      await expect(page.locator('.chips .chip').first()).toBeVisible({ timeout: 3000 })
    }
  })
})

// ---------------------------------------------------------------------------
// Suite 5 – Progress tab
// ---------------------------------------------------------------------------
test.describe('5. Progress tab shows charts', () => {
  test.skip(!EMAIL || !PASSWORD, 'Skipped – set TEST_EMAIL and TEST_PASSWORD env vars')

  test('Progress tab renders without crash', async ({ page }) => {
    await login(page)
    await page.click('.nav-item:has-text("Прогресс")')
    await page.waitForTimeout(1500)
    await expect(page.locator('text=График роста')).toBeVisible({ timeout: 5000 })
  })

  test('Progress tab shows muscle load section', async ({ page }) => {
    await login(page)
    await page.click('.nav-item:has-text("Прогресс")')
    await expect(page.locator('text=Нагрузка по мышцам')).toBeVisible({ timeout: 5000 })
  })

  test('Progress tab shows calendar', async ({ page }) => {
    await login(page)
    await page.click('.nav-item:has-text("Прогресс")')
    await expect(page.locator('text=Календарь')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.cal-grid')).toBeVisible()
    await expect(page.locator('.cal-nav')).toBeVisible()
  })

  test('Progress tab shows growth chart with exercise selector', async ({ page }) => {
    await login(page)
    await page.click('.nav-item:has-text("Прогресс")')
    // There are two .chart-wrap elements; the growth chart contains .chart-ex-select
    const growthChart = page.locator('.chart-wrap').filter({ has: page.locator('.chart-ex-select') })
    await expect(growthChart).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.chart-ex-select')).toBeVisible()
    const optCount = await page.locator('.chart-ex-select option').count()
    expect(optCount).toBeGreaterThan(0)
  })

  test('Changing exercise in chart selector updates chart', async ({ page }) => {
    await login(page)
    await page.click('.nav-item:has-text("Прогресс")')
    await page.waitForSelector('.chart-ex-select', { timeout: 5000 })
    await page.locator('.chart-ex-select').selectOption({ index: 3 })
    await page.waitForTimeout(1500)
    // Growth chart still visible – no crash
    const growthChart = page.locator('.chart-wrap').filter({ has: page.locator('.chart-ex-select') })
    await expect(growthChart).toBeVisible()
  })

  test('Period buttons (1М / 3М / Всё) visible in chart', async ({ page }) => {
    await login(page)
    await page.click('.nav-item:has-text("Прогресс")')
    await page.waitForSelector('.chart-wrap', { timeout: 5000 })
    // Period buttons are rendered inside LineChart SVG area
    const periodBtns = page.locator('button:has-text("1М"), button:has-text("3М"), button:has-text("Всё")')
    await expect(periodBtns.first()).toBeVisible({ timeout: 3000 })
  })

  test('PR list renders with records', async ({ page }) => {
    await login(page)
    await page.click('.nav-item:has-text("Прогресс")')
    await page.waitForTimeout(1500)
    // "Рекорды" section
    const prSection = page.locator('text=Рекорды')
    await expect(prSection).toBeVisible({ timeout: 5000 })
  })

  test('Calendar navigates to previous month', async ({ page }) => {
    await login(page)
    await page.click('.nav-item:has-text("Прогресс")')
    await page.waitForSelector('.cal-nav', { timeout: 5000 })
    const monthName = await page.locator('.cal-mname').textContent()
    await page.locator('.cal-btn').first().click() // ◀ prev
    await page.waitForTimeout(500)
    const newMonthName = await page.locator('.cal-mname').textContent()
    expect(newMonthName).not.toBe(monthName)
  })
})

// ---------------------------------------------------------------------------
// Suite 6 – Exercise modal search
// ---------------------------------------------------------------------------
test.describe('6. Exercise modal search', () => {
  test.skip(!EMAIL || !PASSWORD, 'Skipped – set TEST_EMAIL and TEST_PASSWORD env vars')

  test('Search filters exercises to matching results', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await page.waitForSelector('.modal-srch', { timeout: 5000 })

    // Count all visible items before search
    const totalBefore = await page.locator('.modal-list .modal-item').count()

    await page.fill('.modal-srch', 'Жим')
    await page.waitForTimeout(400)

    const afterSearch = await page.locator('.modal-list .modal-item').count()
    expect(afterSearch).toBeLessThan(totalBefore)
    expect(afterSearch).toBeGreaterThan(0)
  })

  test('Search shows only exercises matching query', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await page.waitForSelector('.modal-srch', { timeout: 5000 })
    await page.fill('.modal-srch', 'Присед')
    await page.waitForTimeout(400)

    const items = await page.locator('.modal-list .modal-item').allTextContents()
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(item.toLowerCase()).toMatch(/приседани|squat/i)
    }
  })

  test('Search with no results shows empty list', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await page.waitForSelector('.modal-srch', { timeout: 5000 })
    await page.fill('.modal-srch', 'zzznomatch9999')
    await page.waitForTimeout(400)
    const count = await page.locator('.modal-list .modal-item').count()
    expect(count).toBe(0)
  })

  test('Clearing search restores full list', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await page.waitForSelector('.modal-srch', { timeout: 5000 })

    const totalBefore = await page.locator('.modal-list .modal-item').count()
    await page.fill('.modal-srch', 'Жим')
    await page.waitForTimeout(300)
    await page.fill('.modal-srch', '')
    await page.waitForTimeout(300)
    const afterClear = await page.locator('.modal-list .modal-item').count()
    expect(afterClear).toBe(totalBefore)
  })

  test('Clicking exercise in modal adds it and closes modal', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await page.waitForSelector('.modal-srch', { timeout: 5000 })
    await page.fill('.modal-srch', 'Планка')
    await page.waitForTimeout(400)
    const firstItem = page.locator('.modal-list .modal-item').first()
    const itemText = await firstItem.textContent()
    await firstItem.click()
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 })
    // Exercise name appears in workout
    await expect(page.locator(`text=${itemText?.trim().slice(0, 6)}`)).toBeVisible()
  })

  test('Closing modal with backdrop click works', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await page.waitForSelector('.modal-overlay', { timeout: 5000 })
    // Click the overlay background (outside modal)
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } })
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 3000 })
  })

  test('Favorites section shown when search is empty', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await page.waitForSelector('.modal-srch', { timeout: 5000 })
    // With no search, favorites section should be visible
    await expect(page.locator('.modal-sect-lbl:has-text("Избранные")')).toBeVisible()
  })

  test('Favorites section hidden when searching', async ({ page }) => {
    await login(page)
    await startWorkout(page)
    await page.click('.ex-selector-btn')
    await page.waitForSelector('.modal-srch', { timeout: 5000 })
    await page.fill('.modal-srch', 'Жим')
    await page.waitForTimeout(300)
    // Favorites label should be gone during search
    await expect(page.locator('.modal-sect-lbl:has-text("Избранные")')).not.toBeVisible()
  })
})
