// Помощники для запросов к Supabase.
/* eslint-disable no-unused-vars */

// Все строки запроса Supabase (он отдаёт максимум 1000 за раз)
export async function fetchAllRows(buildQuery) {
  const PAGE = 1000, all = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await buildQuery().range(from, from + PAGE - 1)
    if (error || !data) break
    all.push(...data)
    if (data.length < PAGE) break
  }
  return all
}
