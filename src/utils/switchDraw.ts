import emitter from '@/utils/eventBus.ts'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { hideRequestOverlay, showRequestOverlay } from '@/stores/requestOverlay'
import {
  markDrawEditSaved,
  normalizeDrawPayload,
  resetDrawEditSnapshot,
  scheduleCaptureDrawEditSnapshot,
  serializeCanvasToStableString,
  syncDrawStoreDataFromCanvas,
} from '@/utils/drawEditState.ts'
import type { ProjectMonitorDraw } from '@/model/draw'
import type { useDrawStore } from '@/stores/module/draw.ts'
import type { useLayerStore } from '@/stores/module/layer.ts'

type DrawStore = ReturnType<typeof useDrawStore>
type LayerStore = ReturnType<typeof useLayerStore>

export async function openDrawOnCanvas(
  draw: ProjectMonitorDraw,
  drawStore: DrawStore,
  layerStore: LayerStore,
) {
  resetDrawEditSnapshot(draw.uid)
  drawStore.draw = draw
  drawStore.referencePreviewUid = ''
  drawStore.editContextDrawData = ''
  await layerStore.ensureDefaultLayer(draw.uid, draw.projectUid)
  meta2d.open(normalizeDrawPayload(JSON.parse(draw.data)))
  meta2d.fitView(true, 5)
  meta2d.render()
  emitter.emit('reloadDraw')
  scheduleCaptureDrawEditSnapshot(draw.uid)
}

export async function switchDrawByUid(
  uid: string,
  drawStore: DrawStore,
  layerStore: LayerStore,
) {
  showRequestOverlay('正在切换图纸，请稍候...')
  try {
    const res = await MonitorDrawService.selectByUid(uid)
    await openDrawOnCanvas(res, drawStore, layerStore)
  } finally {
    hideRequestOverlay()
  }
}

export async function saveCurrentDraw(drawStore: DrawStore) {
  const data = syncDrawStoreDataFromCanvas()
  if (!data || !drawStore.draw?.uid) return
  drawStore.draw.data = data
  await MonitorDrawService.save(data, drawStore.draw.uid)
  markDrawEditSaved(drawStore.draw.uid)
}
