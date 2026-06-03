import { CanvasLayer } from '@meta2d/core'

export interface Meta2dPensCleanupResult {
  pens: any[]
  removedIds: string[]
  changed: boolean
}

const SAFETY_GUARD_FLAG = '__bohaoMeta2dSafetyGuardInstalled'
const PEN_SIZE_PROPS = ['width', 'height'] as const

/** 图元宽高不能小于 0，否则 meta2d 渲染/缩放会出现异常 */
export function clampPenSizeValue(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const num = Number(value)
  if (!Number.isFinite(num)) return undefined
  return Math.max(0, num)
}

export function sanitizePenSizePatch<T extends Record<string, any>>(patch: T): T {
  if (!patch || typeof patch !== 'object') return patch
  const next = { ...patch }
  for (const prop of PEN_SIZE_PROPS) {
    if (!(prop in next)) continue
    const clamped = clampPenSizeValue(next[prop])
    if (clamped !== undefined) next[prop] = clamped
  }
  return next
}

function sanitizePenRuntimeDimensions(pen: any): boolean {
  if (!pen || typeof pen !== 'object') return false
  let changed = false

  for (const prop of PEN_SIZE_PROPS) {
    if (!(prop in pen)) continue
    const clamped = clampPenSizeValue(pen[prop])
    if (clamped !== undefined && pen[prop] !== clamped) {
      pen[prop] = clamped
      changed = true
    }
  }

  const rects = [pen.calculative?.worldRect, pen.calculative?.initRect, pen.calculative?.rect]
  rects.forEach((rect) => {
    if (!rect || typeof rect !== 'object') return
    for (const prop of PEN_SIZE_PROPS) {
      if (!(prop in rect)) continue
      const clamped = clampPenSizeValue(rect[prop])
      if (clamped !== undefined && rect[prop] !== clamped) {
        rect[prop] = clamped
        changed = true
      }
    }
  })

  return changed
}

function getPenId(pen: any) {
  return pen?.id ? String(pen.id) : ''
}

function getRuntimePenMap() {
  return (meta2d?.store?.pens || {}) as Record<string, any>
}

function isRenderablePen(pen: any) {
  return !!pen?.id && !!pen?.calculative
}

function cleanIdList(list: any, validIds: Set<string>) {
  if (!Array.isArray(list)) return { value: list, changed: false }
  const next = list.filter((id) => validIds.has(String(id)))
  return {
    value: next,
    changed: next.length !== list.length,
  }
}

export function getCombineParentPen(pen: any) {
  if (!pen?.parentId) return null
  const parent = getRuntimePenMap()[String(pen.parentId)]
  if (parent?.name === 'combine' && Array.isArray(parent.children) && parent.children.length) {
    return parent
  }
  return null
}

/** @deprecated 使用 getCombineParentPen */
export const getPlainCombineParentPen = getCombineParentPen

export function isCombineMemberPen(pen: any) {
  return !!getCombineParentPen(pen)
}

/** @deprecated 使用 isCombineMemberPen */
export const isPlainCombineMemberPen = isCombineMemberPen

/** 组合子图元按画布绘制顺序排列（index 小 = 底层） */
export function getCombineChildPensInRenderOrder(parent: any) {
  if (!parent?.children?.length) return []
  const childIdSet = new Set(parent.children.map((id: string) => String(id)))
  return (meta2d?.data?.()?.pens || []).filter((pen: any) =>
    childIdSet.has(getPenId(pen)),
  )
}

/** @deprecated 使用 getCombineChildPensInRenderOrder */
export const getPlainCombineChildPensInRenderOrder = getCombineChildPensInRenderOrder

/** 图层树展示顺序：上面的层级更高（与外层图元 frontFirst 一致） */
export function getCombineChildPensForLayerTree(parent: any) {
  return [...getCombineChildPensInRenderOrder(parent)].reverse()
}

/** @deprecated 使用 getCombineChildPensForLayerTree */
export const getPlainCombineChildPensForLayerTree = getCombineChildPensForLayerTree

/** 图层树顺序 → 画布绘制顺序 */
export function combineTreeOrderToRenderOrder(treeOrderedPens: any[]) {
  return [...treeOrderedPens].reverse()
}

/** @deprecated 使用 combineTreeOrderToRenderOrder */
export const plainCombineTreeOrderToRenderOrder = combineTreeOrderToRenderOrder

export function getSharedCombineParent(pens: any[]) {
  if (!pens?.length) return null
  const parents = pens.map(getCombineParentPen).filter(Boolean)
  if (parents.length !== pens.length) return null
  const parentId = getPenId(parents[0])
  if (!parentId || !parents.every((parent) => getPenId(parent) === parentId)) return null
  return parents[0]
}

/** @deprecated 使用 getSharedCombineParent */
export const getSharedPlainCombineParent = getSharedCombineParent

/** 在组合内部重排子图元（同步 data.pens 与 parent.children） */
export function reorderCombineChildPens(
  parent: any,
  orderedChildPens: any[],
  options: { render?: boolean } = {},
) {
  if (!parent?.children?.length || !orderedChildPens.length) {
    return { changed: false }
  }

  const childIdSet = new Set(parent.children.map((id: string) => String(id)))
  const nextIds: string[] = []
  orderedChildPens.forEach((pen) => {
    const penId = getPenId(pen)
    if (penId && childIdSet.has(penId) && !nextIds.includes(penId)) {
      nextIds.push(penId)
    }
  })
  parent.children.forEach((id: string) => {
    const penId = String(id)
    if (!nextIds.includes(penId)) nextIds.push(penId)
  })

  const store = meta2d?.store
  const pens = store?.data?.pens
  if (!Array.isArray(pens)) return { changed: false }

  const movedPens = nextIds
    .map((id) => getRuntimePenMap()[id])
    .filter((pen) => isRenderablePen(pen))
  const indices = movedPens
    .map((pen) => pens.findIndex((item: any) => getPenId(item) === getPenId(pen)))
    .filter((index) => index > -1)
  if (indices.length === 0) return { changed: false }

  const blockStart = Math.min(...indices)
  indices
    .sort((a, b) => b - a)
    .forEach((index) => {
      pens.splice(index, 1)
    })
  pens.splice(blockStart, 0, ...movedPens)
  parent.children = nextIds

  if (options.render !== false) meta2d.render()
  return { changed: true }
}

/** @deprecated 使用 reorderCombineChildPens */
export const reorderPlainCombineChildPens = reorderCombineChildPens

function sanitizePenRefs(
  pen: any,
  validIds: Set<string>,
  runtimePenMap: Record<string, any> = getRuntimePenMap(),
) {
  let changed = false

  if (pen.parentId) {
    const parentId = String(pen.parentId)
    const parentExists = validIds.has(parentId) || !!runtimePenMap[parentId]
    if (!parentExists) {
      delete pen.parentId
      changed = true
    }
  }

  const children = cleanIdList(pen.children, validIds)
  if (children.changed) {
    pen.children = children.value
    changed = true
  }

  const followers = cleanIdList(pen.followers, validIds)
  if (followers.changed) {
    pen.followers = followers.value
    changed = true
  }

  if (Array.isArray(pen.connectedLines)) {
    const connectedLines = pen.connectedLines.filter((line: any) => {
      const lineId = line?.lineId ? String(line.lineId) : ''
      return lineId && validIds.has(lineId)
    })
    if (connectedLines.length !== pen.connectedLines.length) {
      pen.connectedLines = connectedLines
      changed = true
    }
  }

  if (Array.isArray(pen.anchors)) {
    pen.anchors.forEach((anchor: any) => {
      if (anchor?.penId && !validIds.has(String(anchor.penId))) {
        delete anchor.penId
        changed = true
      }
      if (anchor?.connectTo && !validIds.has(String(anchor.connectTo))) {
        delete anchor.connectTo
        changed = true
      }
    })
  }

  return changed
}

export function getRuntimeMeta2dPen(pen: any) {
  const penId = getPenId(pen)
  if (!penId) return null
  return getRuntimePenMap()[penId] || null
}

export function collectValidMeta2dPens(
  sourcePens = meta2d?.data?.()?.pens || [],
  options: { sanitizeRefs?: boolean } = {},
) {
  const runtimePenMap = getRuntimePenMap()
  const runtimeIds = new Set(Object.keys(runtimePenMap))
  const strictRuntime = runtimeIds.size > 0
  const seenIds = new Set<string>()
  const removedIds: string[] = []
  const pens: any[] = []

  ;(sourcePens || []).forEach((pen: any) => {
    const penId = getPenId(pen)
    const runtimePen = runtimePenMap[penId]
    const validPen = runtimePen || pen
    if (!penId || seenIds.has(penId) || (strictRuntime && !runtimePen) || !isRenderablePen(validPen)) {
      removedIds.push(penId || 'unknown')
      return
    }

    seenIds.add(penId)
    pens.push(validPen)
  })

  let refsChanged = false
  if (options.sanitizeRefs) {
    const validIds = new Set(pens.map(getPenId).filter(Boolean))
    pens.forEach((pen) => {
      refsChanged = sanitizePenRefs(pen, validIds, runtimePenMap) || refsChanged
    })
  }

  return {
    pens,
    removedIds,
    changed: removedIds.length > 0 || refsChanged,
  }
}

export function cleanupMeta2dPens(options: { render?: boolean } = {}) {
  const result = collectValidMeta2dPens(meta2d?.data?.()?.pens || [], { sanitizeRefs: true })
  let imageLayerChanged = false
  result.pens.forEach((pen) => {
    imageLayerChanged = normalizeImagePenLayer(pen) || imageLayerChanged
  })

  if (!result.changed && !imageLayerChanged) return result

  const data = meta2d.data()
  const currentPens = data.pens || []
  currentPens.splice(0, currentPens.length, ...result.pens)
  data.pens = currentPens
  if (meta2d.store?.data) meta2d.store.data.pens = currentPens

  if (Array.isArray(meta2d.store?.active)) {
    const validIds = new Set(result.pens.map(getPenId).filter(Boolean))
    meta2d.store.active = meta2d.store.active.filter((pen: any) => validIds.has(getPenId(pen)))
  }

  if (options.render !== false) meta2d.render()
  return {
    ...result,
    changed: true,
  }
}

export function countInvalidMeta2dPens(sourcePens = meta2d?.data?.()?.pens || []) {
  return collectValidMeta2dPens(sourcePens).removedIds.length
}

function normalizeImagePenLayer(pen: any) {
  if (!pen || !pen.image || pen.name === 'gif' || pen.canvasLayer === CanvasLayer.CanvasTemplate) {
    return false
  }

  const changed = pen.canvasLayer !== CanvasLayer.CanvasMain
  pen.canvasLayer = CanvasLayer.CanvasMain
  return changed
}

function normalizeRuntimePens(meta2dInstance = meta2d, options: { normalizeImageLayer?: boolean } = {}) {
  const store = meta2dInstance?.store
  const pens = store?.data?.pens
  if (!Array.isArray(pens)) return false

  const runtimePenMap = (store.pens || {}) as Record<string, any>
  const seenIds = new Set<string>()
  const normalizedPens: any[] = []
  let changed = false

  pens.forEach((pen: any) => {
    const penId = getPenId(pen)
    const runtimePen = runtimePenMap[penId]
    const safePen = runtimePen?.calculative ? runtimePen : pen

    if (!penId || seenIds.has(penId) || !safePen?.calculative) {
      changed = true
      return
    }

    if (safePen !== pen) changed = true
    if (options.normalizeImageLayer) {
      changed = normalizeImagePenLayer(safePen) || changed
    }
    changed = sanitizePenRuntimeDimensions(safePen) || changed
    seenIds.add(penId)
    normalizedPens.push(safePen)
  })

  const validIds = new Set(normalizedPens.map(getPenId).filter(Boolean))
  normalizedPens.forEach((pen) => {
    changed = sanitizePenRefs(pen, validIds, runtimePenMap) || changed
  })

  if (!changed) return false

  pens.splice(0, pens.length, ...normalizedPens)
  store.data.pens = pens
  return true
}

export function reorderMeta2dPens(nextPens: any[]) {
  const cleanupResult = cleanupMeta2dPens({ render: false })
  const currentPens = meta2d.data().pens || []
  const currentPenMap = new Map(currentPens.map((pen: any) => [getPenId(pen), pen]))
  const usedIds = new Set<string>()
  const orderedPens: any[] = []

  nextPens.forEach((pen) => {
    const penId = getPenId(pen)
    const runtimePen = currentPenMap.get(penId)
    if (!penId || !runtimePen || usedIds.has(penId)) return
    usedIds.add(penId)
    orderedPens.push(runtimePen)
  })

  currentPens.forEach((pen: any) => {
    const penId = getPenId(pen)
    if (!penId || usedIds.has(penId)) return
    usedIds.add(penId)
    orderedPens.push(pen)
  })

  orderedPens.forEach(normalizeImagePenLayer)
  currentPens.splice(0, currentPens.length, ...orderedPens)
  if (meta2d.store?.data?.pens && meta2d.store.data.pens !== currentPens) {
    meta2d.store.data.pens = currentPens
  }
  meta2d.render()

  return {
    changed: cleanupResult.changed || orderedPens.length > 0,
    pens: orderedPens,
  }
}

function collectDescendantPenIds(rootIds: string[], penMap: Map<string, any>) {
  const collectedIds = new Set<string>()
  const queue = [...rootIds]

  while (queue.length > 0) {
    const currentId = queue.shift()
    if (!currentId || collectedIds.has(currentId)) continue
    collectedIds.add(currentId)

    const currentPen = penMap.get(currentId)
    if (!Array.isArray(currentPen?.children)) continue
    currentPen.children.forEach((childId: any) => {
      const normalizedChildId = childId ? String(childId) : ''
      if (normalizedChildId && !collectedIds.has(normalizedChildId)) {
        queue.push(normalizedChildId)
      }
    })
  }

  return collectedIds
}

export function removeMeta2dPens(targetPens: any[], options: { render?: boolean } = {}) {
  if (!Array.isArray(targetPens) || targetPens.length === 0) {
    return { removedIds: [], changed: false }
  }

  const data = meta2d.data()
  const currentPens = Array.isArray(data?.pens) ? data.pens : []
  const penMap = new Map<string, any>()
  currentPens.forEach((pen: any) => {
    const penId = getPenId(pen)
    if (penId) penMap.set(penId, pen)
  })

  const rootIds = targetPens.map(getPenId).filter(Boolean)
  const removedIdSet = collectDescendantPenIds(rootIds, penMap)
  if (removedIdSet.size === 0) {
    return { removedIds: [], changed: false }
  }

  rootIds.forEach((penId) => {
    const pen = penMap.get(penId)
    const parent = getCombineParentPen(pen)
    if (!parent?.children || !penId) return
    const index = parent.children.indexOf(penId)
    if (index !== -1) parent.children.splice(index, 1)
  })

  const nextPens = currentPens.filter((pen: any) => !removedIdSet.has(getPenId(pen)))
  const changed = nextPens.length !== currentPens.length

  if (!changed) {
    return { removedIds: [...removedIdSet], changed: false }
  }

  currentPens.splice(0, currentPens.length, ...nextPens)
  data.pens = currentPens
  if (meta2d.store?.data) meta2d.store.data.pens = currentPens

  if (meta2d.store?.pens) {
    removedIdSet.forEach((penId) => {
      delete meta2d.store.pens[penId]
    })
  }

  if (Array.isArray(meta2d.store?.active)) {
    meta2d.store.active = meta2d.store.active.filter((pen: any) => !removedIdSet.has(getPenId(pen)))
  }

  cleanupMeta2dPens({ render: options.render })

  return {
    removedIds: [...removedIdSet],
    changed: true,
  }
}

export function installMeta2dSafetyGuards(meta2dInstance = meta2d) {
  const target = meta2dInstance as any
  if (!target?.canvas || target[SAFETY_GUARD_FLAG]) return
  target[SAFETY_GUARD_FLAG] = true

  const originalSetValue = target.setValue?.bind(target)
  if (originalSetValue) {
    target.setValue = (value: any, ...args: any[]) => {
      if (Array.isArray(value)) {
        return originalSetValue(value.map((item) => sanitizePenSizePatch(item)), ...args)
      }
      return originalSetValue(sanitizePenSizePatch(value), ...args)
    }
  }

  const originalOpen = target.open?.bind(target)
  if (originalOpen) {
    target.open = (data: any, ...args: any[]) => {
      if (data?.pens && Array.isArray(data.pens)) {
        data = {
          ...data,
          pens: data.pens.map((pen: any) => sanitizePenSizePatch(pen)),
        }
      }
      return originalOpen(data, ...args)
    }
  }

  const canvas = target.canvas
  const originalRender = canvas.render?.bind(canvas)
  if (originalRender) {
    canvas.render = (...args: any[]) => {
      normalizeRuntimePens(target, { normalizeImageLayer: true })
      return originalRender(...args)
    }
  }

  const originalRenderPens = canvas.renderPens?.bind(canvas)
  if (originalRenderPens) {
    canvas.renderPens = (...args: any[]) => {
      normalizeRuntimePens(target, { normalizeImageLayer: true })
      return originalRenderPens(...args)
    }
  }

  const originalMeta2dRender = target.render?.bind(target)
  if (originalMeta2dRender) {
    target.render = (...args: any[]) => {
      normalizeRuntimePens(target, { normalizeImageLayer: true })
      return originalMeta2dRender(...args)
    }
  }
}
