import { getUrlParams } from '@/utils'
import { getAuthToken } from '@/utils/auth'

/** 大屏 iframe 嵌入（URL 带 embedMode=screen） */
export function isScreenEmbedMode() {
  const mode = getUrlParams().embedMode
  return mode === 'screen' || mode === '1'
}

/**
 * 大屏嵌入场景（API 走 scadaPreview 聚合接口）。
 * 仅用于请求头 / 接口路由，不要用来禁用 openModal 等只读交互。
 */
export function isScreenPreviewMode() {
  return isScreenEmbedMode()
}

/**
 * display 页入口：iotweb 带 token 可进；大屏 embedMode=screen 免 token。
 */
export function canAccessDisplay() {
  if (getAuthToken()) return true
  if (isScreenEmbedMode()) return true
  return Boolean(getUrlParams().projectUid && getUrlParams().accessToken)
}

/** 大屏预览请求走 projectScreen/scadaPreview 聚合接口 */
export function useScreenApiClient() {
  return isScreenPreviewMode()
}
