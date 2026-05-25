import type { ProjectMonitorLayer, ProjectMonitorLayerForm } from '@/model/layer'
import { LockState } from '@meta2d/core'

export const DEFAULT_LAYER_NAME = '默认图层'

export function createDefaultLayerForm(drawUid: string, projectUid: string): ProjectMonitorLayerForm {
  return {
    name: DEFAULT_LAYER_NAME,
    drawUid,
    projectUid,
    locked: false,
    visible: true,
    pens: '',
    defaultLayer: true,
    sort: 1,
  } as ProjectMonitorLayerForm
}

export function sortLayers(layers: ProjectMonitorLayer[]) {
  return [...layers].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

export function normalizePenLayerUid(target: any, layerUid?: string) {
  if (!target || !layerUid) return false

  let changed = false
  const pens = Array.isArray(target) ? target : [target]

  pens.forEach((pen) => {
    if (!pen || typeof pen !== 'object') return
    if (!pen.layerUid) {
      pen.layerUid = layerUid
      changed = true
    }
  })

  return changed
}

export function syncPenStateWithLayer(target: any, layer?: ProjectMonitorLayer | null) {
  if (!target || !layer?.uid) return false

  let changed = false
  const pens = Array.isArray(target) ? target : [target]

  pens.forEach((pen) => {
    if (!pen || typeof pen !== 'object') return
    if (pen.layerUid !== layer.uid) return

    if (pen.visible !== layer.visible) {
      pen.visible = layer.visible
      changed = true
    }

    const nextLocked = layer.locked ? LockState.Disable : LockState.None
    if (pen.locked !== nextLocked) {
      pen.locked = nextLocked
      changed = true
    }
  })

  return changed
}
