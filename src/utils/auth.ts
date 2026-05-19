export const TOKEN_NAME = 'x-token'
const TOKEN_KEY = 'scada-x-token'
const TOKEN_QUERY_KEYS = ['accessToken', 'token', TOKEN_NAME]
const LEGACY_TOKEN_KEYS = [TOKEN_NAME]

function normalizeToken(token?: string | null) {
  if (!token) return ''
  const value = token.trim()
  return value && value !== 'undefined' && value !== 'null' ? value : ''
}

function clearLegacyStorage() {
  LEGACY_TOKEN_KEYS.forEach((key) => {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  })
}

export function getAuthToken() {
  return normalizeToken(localStorage.getItem(TOKEN_KEY)) || normalizeToken(sessionStorage.getItem(TOKEN_KEY))
}

export function setAuthToken(token: string) {
  const value = normalizeToken(token)
  if (!value) return

  localStorage.setItem(TOKEN_KEY, value)
  sessionStorage.setItem(TOKEN_KEY, value)
  clearLegacyStorage()
}

export function clearAuthToken() {
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  clearLegacyStorage()
}

export function bootstrapAuthFromUrl(cleanUrl = true) {
  const token = getTokenFromUrl()
  if (token) {
    setAuthToken(token)
    if (cleanUrl) removeTokenFromUrl()
  }

  return getAuthToken()
}

function getTokenFromUrl() {
  const searchParams = new URLSearchParams(window.location.search)
  for (const key of TOKEN_QUERY_KEYS) {
    const token = normalizeToken(searchParams.get(key))
    if (token) return token
  }

  const hashQueryIndex = window.location.hash.indexOf('?')
  if (hashQueryIndex === -1) return ''

  const hashParams = new URLSearchParams(window.location.hash.substring(hashQueryIndex + 1))
  for (const key of TOKEN_QUERY_KEYS) {
    const token = normalizeToken(hashParams.get(key))
    if (token) return token
  }

  return ''
}

function removeTokenFromUrl() {
  const url = new URL(window.location.href)
  let changed = false

  TOKEN_QUERY_KEYS.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key)
      changed = true
    }
  })

  const hashQueryIndex = url.hash.indexOf('?')
  if (hashQueryIndex !== -1) {
    const hashPath = url.hash.substring(0, hashQueryIndex)
    const hashParams = new URLSearchParams(url.hash.substring(hashQueryIndex + 1))

    TOKEN_QUERY_KEYS.forEach((key) => {
      if (hashParams.has(key)) {
        hashParams.delete(key)
        changed = true
      }
    })
    const nextHashQuery = hashParams.toString()
    url.hash = nextHashQuery ? `${hashPath}?${nextHashQuery}` : hashPath
  }

  if (changed) {
    window.history.replaceState(window.history.state, document.title, url.toString())
  }
}
