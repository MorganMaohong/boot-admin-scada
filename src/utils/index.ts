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


export const resetRef = (value: any): any => {
  if (Array.isArray(value)) {
    // 如果是数组，返回一个清空的数组
    return []
  } else if (typeof value === "object" && value !== null) {
    // 如果是对象，返回一个新的对象，递归清空每个属性
    const newObj: Record<string, any> = {}
    Object.keys(value).forEach((key) => {
      newObj[key] = resetRef(value[key]) // 递归清空每个属性
    })
    return newObj
  } else if (typeof value === "string") {
    // 如果是字符串，返回空字符串
    return null
  } else if (typeof value === "number") {
    // 如果是数字，返回 0
    return 0
  } else if (typeof value === "boolean") {
    // 如果是布尔值，返回 false
    return false
  } else {
    // 如果是其他类型，返回 null
    return null
  }
}
