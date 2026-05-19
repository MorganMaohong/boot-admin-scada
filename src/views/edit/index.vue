<template>
  <div class="editor-stage">
    <div id="meta2d" class="bg-gray-100"></div>
    <div v-if="appStore.targetPicker.active" class="pick-mask">
      <div class="pick-mask-tip">正在选择目标图元，点击图元确认，按 ESC 退出</div>
    </div>
    <n-popover
      :show="showMenu"
      :x="menuPosition.x"
      :y="menuPosition.y"
      trigger="manual"
      placement="right-start"
    >
      <n-list style="width: 160px">
        <n-list-item class="cursor-pointer" @click="top">置顶</n-list-item>
        <n-list-item class="cursor-pointer" @click="bottom">置底</n-list-item>
        <n-list-item class="cursor-pointer" @click="up">上一个图层</n-list-item>
        <n-list-item class="cursor-pointer" @click="down">下一个图层</n-list-item>
        <n-list-item class="cursor-pointer" @click="del">删除</n-list-item>
        <n-list-item class="cursor-pointer" @click="undo">撤销</n-list-item>
        <n-list-item class="cursor-pointer" @click="cut">剪切</n-list-item>
        <n-list-item class="cursor-pointer" @click="copy">复制</n-list-item>
        <n-list-item class="cursor-pointer" @click="paste">粘贴</n-list-item>
        <template
          v-if="selections.pen && selections.pen.children && selections.pen.children.length > 0"
        >
          <n-list-item
            class="cursor-pointer"
            @click="unCombine"
            v-if="selections.pen.showChild == undefined"
            >取消组合
          </n-list-item>
          <n-list-item class="cursor-pointer" @click="unCombineState" v-else
            >取消组状态
          </n-list-item>
        </template>
        <template v-else-if="selections.pens && selections.pens.length > 0">
          <n-list-item class="cursor-pointer" @click="combine">组合</n-list-item>
          <n-list-item class="cursor-pointer" @click="combineState">组合成状态</n-list-item>
        </template>
      </n-list>
    </n-popover>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { Pen } from '@meta2d/core'
import { deepClone, Meta2d, register, registerAnchors, registerCanvasDraw, LockState } from '@meta2d/core'
import { flowPens, flowAnchors } from '@meta2d/flow-diagram'
import { activityDiagram, activityDiagramByCtx } from '@meta2d/activity-diagram'
import { classPens } from '@meta2d/class-diagram'
import { sequencePens, sequencePensbyCtx } from '@meta2d/sequence-diagram'
import { register as registerEcharts } from '@meta2d/chart-diagram'
import { formPens, formPath2DPens } from '@meta2d/form-diagram'
import { chartsPens } from '@meta2d/le5le-charts'
import { ftaPens, ftaPensbyCtx, ftaAnchors } from '@meta2d/fta-diagram'
import { useSelection } from '@/services/selections'
import emitter from '@/utils/eventBus.ts'
import { useDrawStore } from '@/stores/module/draw.ts'
import { EventActionEnums } from '@/components/ElementsProps/model'
import { ProjectService } from '@/services/ProjectService.ts'
import { getUrlParams } from '@/utils'
import { useLayerStore } from '@/stores/module/layer.ts'
import { useAppStore } from '@/stores/app'
import {
  cleanupMeta2dPens,
  collectValidMeta2dPens,
  installMeta2dSafetyGuards,
  removeMeta2dPens,
  reorderMeta2dPens,
} from '@/utils/meta2dPens.ts'
import { ensureChildStateValues } from '@/utils/statefulChildren.ts'
import { normalizePenLayerUid } from '@/utils/layer.ts'

const drawStore = useDrawStore()
const layerStore = useLayerStore()
const appStore = useAppStore()
const { select, selections, selects } = useSelection()
const showMenu = ref(false)
const menuPosition = ref({
  x: 0,
  y: 0,
})
const resizeTimer = ref(0)
const cachedLocked = ref<LockState | null | undefined>(null)
const pendingPasteSourcePens = ref<any[]>([])

function resize() {
  if (resizeTimer.value) clearTimeout(resizeTimer.value)

  resizeTimer.value = window.setTimeout(() => {
    // window.$message.error('移动完成!!')
    meta2d.fitView(true, 5)
  }, 200)
}

onMounted(() => {
  drawStore.setTitle()
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', handleKeydown)
  emitter.on('draw', init)
})

watch(
  () => appStore.targetPicker.active,
  (active) => {
    if (!meta2d?.store?.data) return
    if (active) {
      cachedLocked.value = meta2d.store.data.locked
      meta2d.store.data.locked = LockState.DisableEdit
      showMenu.value = false
      meta2d.inactive()
      meta2d.render()
      return
    }
    if (cachedLocked.value !== null) {
      meta2d.store.data.locked = cachedLocked.value
      cachedLocked.value = null
      meta2d.render()
    }
  },
)

function init() {
  // 创建实例
  new Meta2d('meta2d')
  installMeta2dSafetyGuards()
  // 按需注册图形库
  // 以下为自带基础图形库
  register(flowPens())
  registerAnchors(flowAnchors())
  register(activityDiagram())
  registerCanvasDraw(activityDiagramByCtx())
  register(classPens())
  register(sequencePens())
  registerCanvasDraw(sequencePensbyCtx())
  registerEcharts()
  registerCanvasDraw(formPens())
  register(formPath2DPens()) //版本>=1.0.9
  registerCanvasDraw(chartsPens())
  register(ftaPens())
  registerCanvasDraw(ftaPensbyCtx())
  registerAnchors(ftaAnchors())
  // 注册其他自定义图形库
  // ...

  const draw = drawStore.draw
  if (!draw) {
    window.$message.error('图纸异常')
    return
  }
  let data = JSON.parse(draw.data)
  // data.bkImage = ''
  meta2d.open(data)
  cleanupMeta2dPens({ render: false })
  installMeta2dAddPenLayerGuard()

  // 参数设置
  meta2d.store.data.disableScale = false
  meta2d.store.options.autoAnchor = false
  meta2d.store.options.strictScope = true

  meta2d.fitView(true, 5)

  document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
      meta2d.fitView(true, 5)
    }, 200)
  })

  meta2d.on('active', active)

  meta2d.on('inactive', inactive)
  // 右键菜单
  meta2d.on('contextmenu', showContextMenu)
  // 点击画布
  meta2d.on('click', handleCanvasClick)

  emitter.emit('meta2d-ready')
  meta2d.on('paste', processPaste as any)
}

function installMeta2dAddPenLayerGuard() {
  if (!meta2d?.addPen || (meta2d as any).__layerGuardInstalled) return

  const originalAddPen = meta2d.addPen.bind(meta2d)
  ;(meta2d as any).addPen = (...args: any[]) => {
    normalizePenLayerUid(args[0], layerStore.layer?.uid)
    return originalAddPen(...args)
  }
  ;(meta2d as any).__layerGuardInstalled = true
}

function processPaste(pens: Pen[]) {
  normalizePenLayerUid(pens as any[], layerStore.layer?.uid)
  remapPastedPenRefs(pens as any[])
  meta2d.setValue(pens as any, { render: true })
  emitter.emit('pensSorted')
}

function remapPastedPenRefs(pastedPens: any[]) {
  const sourcePens = pendingPasteSourcePens.value || []
  pendingPasteSourcePens.value = []
  if (!Array.isArray(sourcePens) || sourcePens.length === 0) return

  const idMap = new Map<string, string>()
  const pairCount = Math.min(sourcePens.length, pastedPens.length)
  for (let index = 0; index < pairCount; index += 1) {
    const sourceId = getPenId(sourcePens[index])
    const pastedId = getPenId(pastedPens[index])
    if (sourceId && pastedId) idMap.set(sourceId, pastedId)
  }

  if (idMap.size === 0) return

  pastedPens.forEach((pen: any) => {
    if (!Array.isArray(pen?.events)) return
    pen.events = pen.events.map((event: any) => remapPastedEvent(event, idMap))
  })
}

function remapPastedEvent(event: any, idMap: Map<string, string>) {
  if (!event || typeof event !== 'object') return event

  const nextEvent = { ...event }
  if (nextEvent.action === EventActionEnums.SetProps) {
    nextEvent.params = remapMaybePenId(nextEvent.params, idMap)
  }
  if (
    nextEvent.action === EventActionEnums.StartAnimate ||
    nextEvent.action === EventActionEnums.PauseAnimate ||
    nextEvent.action === EventActionEnums.StopAnimate
  ) {
    nextEvent.value = remapMaybePenId(nextEvent.value, idMap)
  }
  return nextEvent
}

function remapMaybePenId(value: any, idMap: Map<string, string>) {
  if (typeof value !== 'string') return value
  return idMap.get(value) || value
}

const active = (pens?: Pen[]) => {
  if (appStore.targetPicker.active) {
    const targetPen = pens?.[0]
    if (!targetPen?.id) {
      window.$message.info('请选择一个图元作为目标')
      return
    }
    appStore.completeTargetPick(targetPen.id)
    return
  }
  if (drawStore.isPenDrawLine || drawStore.isPencilDrawLine) return
  const activePens = getActivePens(pens)
  select(activePens)
  selects(activePens)
}

function getActivePens(pens?: Pen[]) {
  const activePens = Array.isArray(meta2d?.store?.active) ? meta2d.store.active : []
  const sourcePens = (activePens.length > 0 ? activePens : pens || []) as Pen[]
  const uniquePens = new Map<string, Pen>()

  sourcePens.forEach((pen) => {
    if (!pen?.id) return
    uniquePens.set(pen.id, pen)
  })

  return [...uniquePens.values()]
}

const inactive = () => {
  if (appStore.targetPicker.active) return
  if (drawStore.isPenDrawLine || drawStore.isPencilDrawLine) return
  select()
}

const showContextMenu = (e: any) => {
  if (appStore.targetPicker.active) return
  if (!selections.pens) return
  showMenu.value = true
  menuPosition.value.x = e.e.clientX
  menuPosition.value.y = e.e.clientY
}

function handleCanvasClick(pen?: Pen) {
  showMenu.value = false
  if (!appStore.targetPicker.active) return
  const targetPen = pen?.id ? pen : selections.pen
  if (!targetPen?.id) return
  appStore.completeTargetPick(targetPen.id)
}

function getPenLayerUid(pen?: Pen) {
  return (pen as any)?.layerUid || '__unassigned__'
}

function getPenId(pen: any) {
  return pen?.id ? String(pen.id) : ''
}

function buildLayerGroups(pens: any[]) {
  const layerOrder: string[] = []
  const layerMap = new Map<string, any[]>()

  pens.forEach((pen) => {
    const layerUid = getPenLayerUid(pen)
    if (!layerMap.has(layerUid)) {
      layerMap.set(layerUid, [])
      layerOrder.push(layerUid)
    }
    layerMap.get(layerUid)?.push(pen)
  })

  return { layerOrder, layerMap }
}

function moveSelectedToLayerTop(layerPens: Pen[], selectedIds: Set<string>) {
  const selectedPens = layerPens.filter((pen) => selectedIds.has(getPenId(pen)))
  if (selectedPens.length === 0) return layerPens
  return [...layerPens.filter((pen) => !selectedIds.has(getPenId(pen))), ...selectedPens]
}

function moveSelectedToLayerBottom(layerPens: Pen[], selectedIds: Set<string>) {
  const selectedPens = layerPens.filter((pen) => selectedIds.has(getPenId(pen)))
  if (selectedPens.length === 0) return layerPens
  return [...selectedPens, ...layerPens.filter((pen) => !selectedIds.has(getPenId(pen)))]
}

function moveSelectedOneStepUp(layerPens: Pen[], selectedIds: Set<string>) {
  const nextPens = [...layerPens]
  for (let index = nextPens.length - 2; index >= 0; index -= 1) {
    const currentPen = nextPens[index]
    const nextPen = nextPens[index + 1]
    if (!selectedIds.has(getPenId(currentPen)) || selectedIds.has(getPenId(nextPen))) continue
    nextPens[index] = nextPen
    nextPens[index + 1] = currentPen
  }
  return nextPens
}

function moveSelectedOneStepDown(layerPens: Pen[], selectedIds: Set<string>) {
  const nextPens = [...layerPens]
  for (let index = 1; index < nextPens.length; index += 1) {
    const currentPen = nextPens[index]
    const prevPen = nextPens[index - 1]
    if (!selectedIds.has(getPenId(currentPen)) || selectedIds.has(getPenId(prevPen))) continue
    nextPens[index] = prevPen
    nextPens[index - 1] = currentPen
  }
  return nextPens
}

function reorderSelectedInOwnLayers(
  reorderLayerPens: (layerPens: Pen[], selectedIds: Set<string>) => Pen[],
) {
  const selectedPens = (selections.pens || []) as any[]
  const selectedIds = new Set(selectedPens.map(getPenId).filter(Boolean))
  if (selectedIds.size === 0) return

  const allPens = collectValidMeta2dPens(meta2d.data().pens || []).pens as any[]
  const { layerOrder, layerMap } = buildLayerGroups(allPens)

  layerOrder.forEach((layerUid) => {
    const layerPens = layerMap.get(layerUid) || []
    layerMap.set(layerUid, reorderLayerPens(layerPens, selectedIds))
  })

  const nextPens = layerOrder.flatMap((layerUid) => layerMap.get(layerUid) || [])
  reorderMeta2dPens(nextPens)
  emitter.emit('pensSorted')
  selects(selectedPens)
  select(selectedPens)
}

function syncPensAfterChange() {
  cleanupMeta2dPens({ render: false })
  emitter.emit('pensSorted')
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
    pendingPasteSourcePens.value = deepClone(meta2d.store.clipboard?.pens || [])
  }
  if (e.key !== 'Escape') return
  if (!appStore.targetPicker.active) return
  appStore.cancelTargetPick()
  window.$message.info('已退出目标图元选择')
}

function top() {
  if (!selections.pens) return
  reorderSelectedInOwnLayers(moveSelectedToLayerTop)
  showMenu.value = false
}

function bottom() {
  if (!selections.pens) return
  reorderSelectedInOwnLayers(moveSelectedToLayerBottom)
  showMenu.value = false
}

function up() {
  if (!selections.pens) return
  reorderSelectedInOwnLayers(moveSelectedOneStepUp)
  showMenu.value = false
}

function down() {
  if (!selections.pens) return
  reorderSelectedInOwnLayers(moveSelectedOneStepDown)
  showMenu.value = false
}

function del() {
  if (!selections.pens) return
  removeMeta2dPens(selections.pens as any, { render: true })
  syncPensAfterChange()
  showMenu.value = false
}

function cut() {
  if (!selections.pens) return
  meta2d.cut(selections.pens as any)
  meta2d.render()
  syncPensAfterChange()
  showMenu.value = false
}

function copy() {
  if (!selections.pens) return
  meta2d.copy(selections.pens as any)
  meta2d.render()
  showMenu.value = false
}

function paste() {
  pendingPasteSourcePens.value = deepClone(meta2d.store.clipboard?.pens || [])
  meta2d.paste()
  meta2d.render()
  syncPensAfterChange()
  showMenu.value = false
}

function undo() {
  meta2d.undo()
  meta2d.render()
  syncPensAfterChange()
  showMenu.value = false
}

function combine() {
  if (!selections.pens) return
  meta2d.combine(selections.pens as any)
  meta2d.render()
  syncPensAfterChange()
  showMenu.value = false
}

function combineState() {
  if (!selections.pens) return
  meta2d.combine(selections.pens as any, 0)
  const statePen = meta2d.store.active?.[0]
  if (statePen?.id) {
    const { values, changed } = ensureChildStateValues(statePen)
    if (changed) {
      meta2d.setValue(
        {
          id: statePen.id,
          childStateValues: values,
        },
        { render: false, history: false },
      )
    }
  }
  meta2d.render()
  syncPensAfterChange()
  showMenu.value = false
}

function unCombine() {
  if (!selections.pen) return
  meta2d.uncombine(selections.pen as any)
  meta2d.render()
  syncPensAfterChange()
  showMenu.value = false
}

function unCombineState() {
  if (!selections.pen) return
  meta2d.uncombine(selections.pen as any)
  meta2d.render()
  syncPensAfterChange()
  showMenu.value = false
}

const hideContextMenu = () => {
  showMenu.value = false
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  meta2d.destroy()
})
</script>
<style lang="postcss" scoped>
.editor-stage {
  position: relative;
  height: 100%;
}

#meta2d {
  height: calc(100vh - 80px);
  z-index: 1;
}

.pick-mask {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: rgba(24, 144, 255, 0.08);
  border: 1px dashed rgba(24, 144, 255, 0.35);
}

.pick-mask-tip {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 14px;
  color: #fff;
  background: rgba(15, 23, 42, 0.82);
  border-radius: 999px;
  font-size: 12px;
  line-height: 1;
}
</style>
