import Cookies from 'js-cookie'

const TOKEN_KEY = 'x-token'
const TOKEN_QUERY_KEY = 'accessToken'
const TOKEN_COOKIE_EXPIRES = 7

export function isValidToken(token?: string | null) {
  if (!token) return false
  const value = token.trim()
  return Boolean(value && value !== 'undefined' && value !== 'null')
}

export function setAuthToken(token: string) {
  if (!isValidToken(token)) return

  const value = token.trim()
  Cookies.set(TOKEN_KEY, value, { expires: TOKEN_COOKIE_EXPIRES })
  localStorage.setItem(TOKEN_KEY, value)
  sessionStorage.setItem(TOKEN_KEY, value)
}

export function getAuthToken() {
  const token =
    Cookies.get(TOKEN_KEY) ||
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY) ||
    getTokenFromUrl()

  return isValidToken(token) ? token!.trim() : ''
}

export function clearAuthToken() {
  Cookies.remove(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export function bootstrapAuthFromUrl(cleanUrl = true) {
  const token = getTokenFromUrl()
  if (isValidToken(token)) {
    setAuthToken(token)
    if (cleanUrl) removeTokenFromUrl()
  }

  return getAuthToken()
}

function getTokenFromUrl() {
  const searchToken = new URLSearchParams(window.location.search).get(TOKEN_QUERY_KEY)
  if (isValidToken(searchToken)) return searchToken

  const hashQueryIndex = window.location.hash.indexOf('?')
  if (hashQueryIndex === -1) return ''

  return new URLSearchParams(window.location.hash.substring(hashQueryIndex + 1)).get(
    TOKEN_QUERY_KEY,
  )
}

function removeTokenFromUrl() {
  const url = new URL(window.location.href)
  let changed = false

  if (url.searchParams.has(TOKEN_QUERY_KEY)) {
    url.searchParams.delete(TOKEN_QUERY_KEY)
    changed = true
  }

  const hashQueryIndex = url.hash.indexOf('?')
  if (hashQueryIndex !== -1) {
    const hashPath = url.hash.substring(0, hashQueryIndex)
    const hashParams = new URLSearchParams(url.hash.substring(hashQueryIndex + 1))

    if (hashParams.has(TOKEN_QUERY_KEY)) {
      hashParams.delete(TOKEN_QUERY_KEY)
      const nextHashQuery = hashParams.toString()
      url.hash = nextHashQuery ? `${hashPath}?${nextHashQuery}` : hashPath
      changed = true
    }
  }

  if (changed) {
    window.history.replaceState(window.history.state, document.title, url.toString())
  }
}
