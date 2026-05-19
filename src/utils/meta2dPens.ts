import { CanvasLayer } from '@meta2d/core'

export interface Meta2dPensCleanupResult {
  pens: any[]
  removedIds: string[]
  changed: boolean
}

const SAFETY_GUARD_FLAG = '__bohaoMeta2dSafetyGuardInstalled'

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

function sanitizePenRefs(pen: any, validIds: Set<string>) {
  let changed = false

  if (pen.parentId && !validIds.has(String(pen.parentId))) {
    delete pen.parentId
    changed = true
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
      refsChanged = sanitizePenRefs(pen, validIds) || refsChanged
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
    seenIds.add(penId)
    normalizedPens.push(safePen)
  })

  const validIds = new Set(normalizedPens.map(getPenId).filter(Boolean))
  normalizedPens.forEach((pen) => {
    changed = sanitizePenRefs(pen, validIds) || changed
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
