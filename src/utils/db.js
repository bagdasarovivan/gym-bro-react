// Помощники для запросов к Supabase.
/* eslint-disable no-unused-vars */

// Все строки запроса Supabase (он отдаёт максимум 1000 за раз)
// strict: throw on an error instead of returning what was loaded so far (offline → keep the cached data)
export async function fetchAllRows(buildQuery, { strict = false } = {}) {
  const PAGE = 1000, all = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await buildQuery().range(from, from + PAGE - 1)
    if (strict && (error || !data)) throw error || new Error('no data')
    if (error || !data) break
    all.push(...data)
    if (data.length < PAGE) break
  }
  return all
}
