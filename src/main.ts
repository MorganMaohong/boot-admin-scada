function isDisplayRoute() {
  const hash = window.location.hash || ''
  const path = window.location.pathname || ''
  return hash.startsWith('#/display') || path.endsWith('/display')
}

if (isDisplayRoute()) {
  void import('./entry-display')
} else {
  void import('./entry-editor')
}
