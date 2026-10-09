// Tiny i18n + units layer.
// Source strings stay in Russian; t('Русский текст') returns the English text when the language is EN.
// Language and units are module-level and set by App on every render (setPrefs), so any function
// called during render — components, formatters, data `fmt` helpers — sees the current choice.
import { CONTENT_EN } from './en/content'
import { ANATOMY_LABELS_EN, CATALOG_MISC_EN, EX_INFO_EN, EX_NAMES_EN, MUSCLE_FILTER_LABELS_EN, MUSCLE_LABELS_EN, VARIANTS_EN } from './en/exercises'
import { UI_EN } from './en/ui'

const EN = { ...CONTENT_EN, ...CATALOG_MISC_EN, ...MUSCLE_FILTER_LABELS_EN, ...UI_EN }

let LANG = 'ru'
let UNITS = 'kg'
export function setPrefs({ language, units } = {}) {
  LANG = language === 'en' ? 'en' : 'ru'
  UNITS = units === 'lbs' ? 'lbs' : 'kg'
}
export const getLang = () => LANG
export const isEn = () => LANG === 'en'
export const locale = () => (LANG === 'en' ? 'en-US' : 'ru-RU')

// Translate a Russian source string; {name} placeholders are filled from vars
export function t(ru, vars) {
  let s = LANG === 'en' && EN[ru] !== undefined ? EN[ru] : ru
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
  return s
}

// Plural: plural(5, ['тренировка', 'тренировки', 'тренировок'], ['workout', 'workouts'])
export function plural(n, ru, en) {
  if (LANG === 'en') return Math.abs(n) === 1 ? en[0] : en[1]
  const a = Math.abs(n) % 100, b = a % 10
  if (a > 10 && a < 20) return ru[2]
  if (b > 1 && b < 5) return ru[1]
  if (b === 1) return ru[0]
  return ru[2]
}

// ── Exercise names ──────────────────────────────────────────────────────────
// Names are stored in Russian in the database; only the display changes.
export function exName(name) {
  if (!name || LANG !== 'en') return name
  if (EX_NAMES_EN[name]) return EX_NAMES_EN[name]
  const m = name.match(/^(.*?)\s*\(([^)]*)\)\s*$/) // «Жим лёжа (Узкий)»
  if (m) return `${EX_NAMES_EN[m[1]] || m[1]} (${VARIANTS_EN[m[2]] || m[2]})`
  return name
}
export const variantName = (v) => (LANG === 'en' ? VARIANTS_EN[v] || v : v)
export const exInfo = (name, info) => (LANG === 'en' && EX_INFO_EN[name]) || info
export const muscleLabel = (key, ru) => (LANG === 'en' ? MUSCLE_LABELS_EN[key] || ANATOMY_LABELS_EN[key] || ru : ru)
export const anatomyLabel = (key, ru) => (LANG === 'en' ? ANATOMY_LABELS_EN[key] || ru : ru)

// ── Units ───────────────────────────────────────────────────────────────────
// Everything is stored in kg. In lbs mode weights are shown in pounds and entered in pounds,
// then converted back to kg (2 decimals) for saving.
export const KG_TO_LB = 2.20462
export const isLbs = () => UNITS === 'lbs'
export const toLbs = (kg) => Math.round((kg || 0) * KG_TO_LB * 2) / 2     // nearest 0.5 lb
export const lbsToKg = (lb) => Math.round(((lb || 0) / KG_TO_LB) * 100) / 100
export const dispW = (kg) => (isLbs() ? toLbs(kg) : Math.round((kg || 0) * 100) / 100) // number in the display unit
export const toKg = (v) => (isLbs() ? lbsToKg(v) : v)                      // display unit → kg
export const wUnit = () => (isLbs() ? 'lbs' : t('кг'))
export const num = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10)).replace('.', LANG === 'en' ? '.' : ',')
export const fmtW = (kg) => `${num(dispW(kg))} ${wUnit()}`
// Big totals (volume): "12,4 т" or "27.3k lbs"
export function fmtVolume(kg) {
  if (isLbs()) { const lb = (kg || 0) * KG_TO_LB; return lb >= 1000 ? `${(Math.round(lb / 100) / 10).toLocaleString('en-US')}k lbs` : `${Math.round(lb)} lbs` }
  return kg >= 1000 ? `${(Math.round(kg / 100) / 10).toLocaleString(locale())} ${t('т')}` : `${Math.round(kg || 0)} ${t('кг')}`
}

// Weight picker options in the display unit
const range = (from, to, step) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => Math.round((from + i * step) * 100) / 100)
export function weightOptions(kgOptions) {
  if (!isLbs()) return kgOptions
  const maxKg = kgOptions[kgOptions.length - 1] || 0
  const maxLb = Math.ceil((maxKg * KG_TO_LB) / 5) * 5
  // light lists (dumbbells) get 2.5 lb steps up to 100 lb
  const fine = kgOptions.some(v => v % 5 !== 0)
  return fine ? [...new Set([...range(0, Math.min(100, maxLb), 2.5), ...range(100, maxLb, 5)])] : range(0, maxLb, 5)
}
