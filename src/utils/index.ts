import { useRouter } from 'vue-router'

export function extractFunctionBody(fn: Function): string {
  const fullStr = fn.toString()
  const match = fullStr.match(/{([\s\S]*)}$/)
  return match ? match[1].trim() : ''
}

/**
 * 获取浏览器地址栏中的查询参数，返回一个对象
 * 如 ?a=1&b=2 返回 { a: "1", b: "2" }
 */
export function getUrlParams(): Record<string, string> {
  let queryString = window.location.search

  // Hash 模式下，参数在 hash 里面
  if (!queryString || queryString === '') {
    const hash = window.location.hash
    const index = hash.indexOf('?')
    if (index !== -1) {
      queryString = hash.substring(index)
    }
  }

  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}

  for (const [key, value] of params.entries()) {
    result[key] = value
  }

  return result
}
