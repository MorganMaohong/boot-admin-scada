import { deepClone } from '@meta2d/core'
import { cleanupMeta2dPens } from '@/utils/meta2dPens.ts'

let savedCanvasData = ''
let savedDrawUid = ''
let captureTimer = 0

const RUNTIME_PEN_KEYS = new Set(['calculative'])

function normalizePen(pen: any) {
  if (!pen || typeof pen !== 'object') return pen
  const next: Record<string, any> = {}
  Object.keys(pen)
    .sort()
    .forEach((key) => {
      if (RUNTIME_PEN_KEYS.has(key)) return
      next[key] = pen[key]
    })
  return next
}

/**
 * 用于脏比较的稳定结构：图元内容按 id 归集，绘制顺序单独用 penOrder 保留
 */
function normalizeDrawDataForCompare(data: any) {
  if (!data || typeof data !== 'object') return null
  const cloned = deepClone(data)
  const penOrder: string[] = []
  const pensById: Record<string, any> = {}

  if (Array.isArray(cloned.pens)) {
    cloned.pens.forEach((pen: any) => {
      if (!pen?.id) return
      const penId = String(pen.id)
      penOrder.push(penId)
      pensById[penId] = normalizePen(pen)
    })
  }
  delete cloned.pens

  return {
    ...cloned,
    penOrder,
    pensById,
  }
}

function getStableDrawDataSignature() {
  if (typeof meta2d === 'undefined' || !meta2d?.data) return ''
  cleanupMeta2dPens({ render: false })
  return JSON.stringify(normalizeDrawDataForCompare(meta2d.data()))
}

function getStableDrawDataSignatureFromStored(storedDrawData?: string) {
  if (!storedDrawData) return ''
  try {
    const parsed =
      typeof storedDrawData === 'string' ? JSON.parse(storedDrawData) : storedDrawData
    return JSON.stringify(normalizeDrawDataForCompare(parsed))
  } catch {
    return ''
  }
}

/** 导出：捕获当前画布稳定序列（参考项目暂存等场景） */
export function serializeCanvasToStableString() {
  return getStableDrawDataSignature()
}

/** 切换图纸前清空旧快照，避免 A/B 图纸快照串用 */
export function resetDrawEditSnapshot(nextDrawUid = '') {
  cancelScheduledCapture()
  savedCanvasData = ''
  savedDrawUid = nextDrawUid
}

/** 图纸加载、切换后延迟捕获，避免 reloadDraw / 图层初始化尚未完成 */
export function scheduleCaptureDrawEditSnapshot(drawUid = '', delay = 280) {
  if (captureTimer) window.clearTimeout(captureTimer)
  captureTimer = window.setTimeout(() => {
    captureTimer = 0
    captureDrawEditSnapshot(drawUid)
  }, delay)
}

export function cancelScheduledCapture() {
  if (!captureTimer) return
  window.clearTimeout(captureTimer)
  captureTimer = 0
}

/** 记录当前画布快照，用于判断是否有未保存修改 */
export function captureDrawEditSnapshot(drawUid = '') {
  cancelScheduledCapture()
  savedCanvasData = getStableDrawDataSignature()
  savedDrawUid = drawUid
}

export type DrawEditDirtyOptions = {
  /** 正在预览参考图纸时，画布内容不是当前编辑图纸，需用进入预览前暂存的数据判断 */
  referencePreviewUid?: string
  editContextDrawData?: string
}

export function isDrawEditDirty(
  storedDrawData?: string,
  currentDrawUid?: string,
  options?: DrawEditDirtyOptions,
) {
  if (!currentDrawUid) return false

  // 参考预览：仅判断「工作图纸」相对服务端是否有未保存修改，不拿参考图画布比对
  if (options?.referencePreviewUid && options.editContextDrawData) {
    const serverSig = getStableDrawDataSignatureFromStored(storedDrawData)
    const contextSig = getStableDrawDataSignatureFromStored(options.editContextDrawData)
    if (!serverSig || !contextSig) return false
    return contextSig !== serverSig
  }

  const current = getStableDrawDataSignature()
  if (!current) return false

  if (savedCanvasData && savedDrawUid && savedDrawUid === currentDrawUid) {
    return current !== savedCanvasData
  }

  const baseline = getStableDrawDataSignatureFromStored(storedDrawData)
  if (!baseline) return false
  return current !== baseline
}

export function markDrawEditSaved(drawUid = '') {
  captureDrawEditSnapshot(drawUid)
}

/** 规范化图纸 JSON，确保 pens 为数组（兼容误写入的快照结构） */
export function normalizeDrawPayload(data: any) {
  if (!data || typeof data !== 'object') {
    return { pens: [] }
  }
  if (Array.isArray(data.pens)) {
    return data
  }
  if (Array.isArray(data.penOrder) && data.pensById) {
    return {
      ...data,
      pens: data.penOrder
        .map((id: string) => data.pensById[String(id)])
        .filter(Boolean),
    }
  }
  return { ...data, pens: [] }
}

/** 同步画布数据用于持久化（保留 pens 数组顺序 = 层级顺序） */
export function syncDrawStoreDataFromCanvas() {
  if (typeof meta2d === 'undefined' || !meta2d?.data) return ''
  cleanupMeta2dPens({ render: false })
  return JSON.stringify(normalizeDrawPayload(meta2d.data()))
}
