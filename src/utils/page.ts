const MAX_PAGE_SIZE = 200

/** 自动翻页加载完整列表 */
export async function getAllPageItems<T>(
  requestPage: (pageNo: number, pageSize: number) => Promise<PageResult<T[]>>
) {
  const result: T[] = []
  let pageNo = 1
  let total = 0
  do {
    const page = await requestPage(pageNo, MAX_PAGE_SIZE)
    result.push(...page.list)
    total = page.total
    if (page.list.length === 0) {
      break
    }
    pageNo++
  } while (result.length < total)
  return result
}
