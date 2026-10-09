// Russian sport classification norms (ЕВСК) for classic powerlifting, kg.
// Source: Федерация пауэрлифтинга Санкт-Петербурга, «Нормативы по пауэрлифтингу 2026»
// (classification approved by Минспорт России order № 299 of 09.04.2026),
// https://www.powerliftingfed.spb.ru/standards
// Only the classic total (squat + bench + deadlift) and the classic bench press have norms;
// squat and deadlift alone are not separate disciplines.

// Ranks from lowest to highest
export const RANKS = ['III юн', 'II юн', 'I юн', 'III', 'II', 'I', 'КМС', 'МС', 'МСМК']
export const RANK_NAMES = {
  'III юн': 'III юношеский', 'II юн': 'II юношеский', 'I юн': 'I юношеский',
  III: 'III разряд', II: 'II разряд', I: 'I разряд', КМС: 'КМС', МС: 'МС', МСМК: 'МСМК',
}

// Each row: [category upper limit (Infinity for "+"), МСМК, МС, КМС, I, II, III, I юн, II юн, III юн]; null = no norm
const col = ['МСМК', 'МС', 'КМС', 'I', 'II', 'III', 'I юн', 'II юн', 'III юн']
// cat may be a string like '120+' for the open category
const table = (rows) => rows.map(([cat, ...v]) => ({ cat: typeof cat === 'string' ? Infinity : cat, label: String(cat), norms: Object.fromEntries(col.map((r, i) => [r, v[i]])) }))

export const STANDARDS = {
  male: {
    total: table([
      [53, null, null, 340, 300, 265, 240, 215, 200, 185],
      [59, 550, 472.5, 390, 350, 300, 275, 245, 225, 205],
      [66, 640, 545, 435, 390, 335, 305, 270, 245, 215],
      [74, 705, 600, 475, 425, 365, 325, 295, 260, 230],
      [83, 770, 665, 515, 465, 400, 350, 320, 290, 255],
      [93, 810, 710, 550, 490, 430, 385, 345, 315, 275],
      [105, 850, 740, 600, 515, 460, 415, 370, 330, 300],
      [120, 880, 775, 640, 560, 505, 455, 395, 355, 325],
      ['120+', 930, 820, 690, 590, 525, 485, 425, 370, 345],
    ]),
    bench: table([
      [59, null, 135, 115, 105, 90, 85, 75, 65, 57.5],
      [66, null, 155, 137.5, 115, 95, 90, 85, 75, 62.5],
      [74, null, 170, 140, 127.5, 110, 100, 90, 80, 70],
      [83, null, 190, 160, 140, 125, 115, 95, 85, 75],
      [93, null, 197.5, 172.5, 150, 135, 122.5, 105, 95, 80],
      [105, null, 210, 180, 160, 145, 130, 115, 105, 95],
      [120, null, 222.5, 195, 175, 155, 135, 120, 110, 100],
      ['120+', null, 230, 200, 190, 160, 140, 125, 112.5, 105],
    ]),
  },
  female: {
    total: table([
      [43, null, null, 180, 150, 125, 115, 105, 97.5, 90],
      [47, 350, 280, 220, 175, 145, 125, 115, 105, 97.5],
      [52, 385, 315, 255, 200, 170, 145, 125, 115, 105],
      [57, 410, 340, 285, 215, 185, 165, 145, 125, 115],
      [63, 440, 365, 315, 240, 200, 180, 160, 140, 125],
      [69, 460, 380, 330, 260, 222.5, 190, 170, 150, 137.5],
      [76, 480, 395, 345, 285, 242.5, 210, 190, 170, 150],
      [84, 500, 405, 355, 300, 255, 220, 200, 180, 160],
      ['84+', 550, 420, 375, 320, 285, 250, 220, 200, 180],
    ]),
    bench: table([
      [47, null, 75, 62.5, 50, 45, 40, 35, 30, 25],
      [52, null, 82.5, 67.5, 55, 50, 45, 40, 35, 30],
      [57, null, 90, 75, 60, 55, 50, 42.5, 37.5, 35],
      [63, null, 97.5, 85, 67.5, 60, 55, 50, 45, 40],
      [69, null, 105, 90, 72.5, 65, 60, 55, 50, 45],
      [76, null, 110, 95, 80, 70, 65, 60, 55, 50],
      ['84+', null, 125, 107.5, 90, 85, 80, 75, 70, 65],
    ]),
  },
}

// Weight category for a body weight: the first category whose limit is ≥ body weight
export function categoryFor(rows, bodyWeight) {
  return rows.find(r => bodyWeight <= r.cat) || rows[rows.length - 1]
}
export const categoryLabel = (row) => row.label

// Highest rank reached with `kg` in the category, and the next one
export function rankFor(row, kg) {
  let got = null
  for (const r of RANKS) if (row.norms[r] != null && kg >= row.norms[r]) got = r
  const idx = got ? RANKS.indexOf(got) : -1
  const next = RANKS.slice(idx + 1).find(r => row.norms[r] != null) || null
  return { rank: got, next, nextKg: next ? row.norms[next] : null }
}
