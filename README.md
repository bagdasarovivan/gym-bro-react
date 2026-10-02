# Gym BRO

Дневник тренировок: планы, подходы, личные рекорды, график роста и карта нагрузки на мышцы.
React (Create React App) + Supabase, деплой на Vercel.

## Запуск

```bash
npm install
npm start          # http://localhost:3000
npm run build      # сборка в build/
npm run test:e2e   # Playwright-тесты из e2e/
```

Адрес и публичный ключ Supabase берутся из `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY`
(по умолчанию — значения в `src/supabase.js`).

## Структура `src/`

| Файл | Что внутри |
|---|---|
| `App.js` | Состояние приложения, загрузка данных, экраны (тренировка, история, прогресс, упражнения, настройки) |
| `supabase.js` | Клиент Supabase |
| `data/exerciseCatalog.js` | Упражнения: тип (вес / время / повторения), картинки, группы мышц, хваты и вариации, описания, разминочные подходы, старые и английские названия (`normalizeName`) |
| `data/plans.js` | Планы тренировок по дням |
| `data/muscleLoad.js` | Нагрузка на мышцы: группы (фильтры) и детальная анатомия — 29 мышц, разметка каждого упражнения |
| `data/muscleZones.js` | Зоны мышц на манекене в координатах `public/images/muscle_map.png` |
| `data/motivation.js` | Мотивационные фразы, ранги, цитаты |
| `utils/records.js` | Чем меряется прогресс упражнения и выбор лучшего подхода — общие для рекордов и графика |
| `utils/db.js` | `fetchAllRows` — постраничная загрузка (Supabase отдаёт максимум 1000 строк за запрос) |
| `utils/format.js` | Даты по местному времени и форматирование |
| `styles/appCss.js` | Стили, тёмная и светлая темы |
| `components/` | `LineChart`, `MuscleMap`, `DropdownPicker`, `ModalItem`, `EditModal` |

## Как добавить упражнение

1. Картинка — `public/images/<name>.webp` (высота 360 px).
2. В `data/exerciseCatalog.js`: `EXERCISE_TYPE` (если не обычное с весом), `EXERCISE_IMAGES`, `EXERCISE_MUSCLES`, `EXERCISE_INFO`; вариации — в `GRIP_MUSCLES` и `VARIANT_EXERCISES`.
3. В `data/muscleLoad.js`: строка в `EXERCISE_ANATOMY_SRC` (`'основные / вспомогательные'`), вариации — в `GRIP_ANATOMY_SRC`.
