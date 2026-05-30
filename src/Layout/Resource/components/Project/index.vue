<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import type { Project } from '@/model/project'
import type { ProjectMonitorDraw, ProjectQuery } from '@/model/draw'
import emitter from '@/utils/eventBus.ts'
import { useDrawStore } from '@/stores/module/draw.ts'
import { getUrlParams } from '@/utils'
import { MonitorLayerService } from '@/services/MonitorLayerService.ts'
import type { ProjectMonitorLayer, ProjectMonitorLayerForm } from '@/model/layer'
import { CanvasLayer, deepClone } from '@meta2d/core'
import { cleanupMeta2dPens } from '@/utils/meta2dPens.ts'
import { hideRequestOverlay, showRequestOverlay } from '@/stores/requestOverlay'
import { useLayerStore } from '@/stores/module/layer.ts'
import { useSelection } from '@/services/selections.ts'
import type { OptionVo } from '@/model'
import { openDrawOnCanvas } from '@/utils/switchDraw.ts'
import {
  normalizeDrawPayload,
  scheduleCaptureDrawEditSnapshot,
  serializeCanvasToStableString,
  syncDrawStoreDataFromCanvas,
} from '@/utils/drawEditState.ts'

const drawStore = useDrawStore()
const layerStore = useLayerStore()
const { select, selects } = useSelection()
const targetDrawContext = ref<ProjectMonitorDraw | null>(null)
const previewDrawUid = ref('')
const currentProjectUid = ref('')
const projectData = ref<Project[]>([])
const drawData = ref<ProjectMonitorDraw[]>([])
const currentDrawHoverIndex = ref()
const projectQueryData = ref<ProjectQuery>({ keyword: '' })
const copyingDrawUid = ref('')
const showCopyConfirm = ref(false)
const showCopyTargetModal = ref(false)
const pendingSourceDraw = ref<ProjectMonitorDraw | null>(null)
const copyTargetDrawUid = ref('')
const currentProjectDrawOptions = ref<OptionVo[]>([])
const drawListRequestId = ref(0)
onMounted(() => {
  selectProjectAll()
})

watch(
  () => drawStore.draw?.uid,
  (nextUid, prevUid) => {
    if (!nextUid) {
      clearReferencePreviewState()
      return
    }
    if (previewDrawUid.value && prevUid && nextUid !== prevUid) {
      clearReferencePreviewState()
      return
    }
    if (targetDrawContext.value?.uid && targetDrawContext.value.uid !== nextUid) {
      clearReferencePreviewState()
      return
    }
    clearReferencePreviewState()
  },
)

function selectProjectAll() {
  MonitorDrawService.selectProject(projectQueryData.value, getUrlParams().projectUid).then(
    (res) => {
      projectData.value = res
    },
  )
}

function selectDrawByProjectUid() {
  if (!currentProjectUid.value) return
  const requestId = ++drawListRequestId.value
  const projectUid = currentProjectUid.value
  MonitorDrawService.selectByProjectUid(projectUid).then((res) => {
    if (requestId !== drawListRequestId.value) return
    if (projectUid !== currentProjectUid.value) return
    drawData.value = res
  })
}

function changeProject(projectUid: string) {
  if (currentProjectUid.value !== projectUid) {
    drawData.value = []
  }
  currentProjectUid.value = projectUid
  captureTargetDrawContext()
  selectDrawByProjectUid()
}

function clearReferencePreviewState() {
  targetDrawContext.value = null
  previewDrawUid.value = ''
  drawStore.referencePreviewUid = ''
  drawStore.editContextDrawData = ''
}

function captureTargetDrawContext() {
  if (targetDrawContext.value?.uid) return
  if (!drawStore.draw?.uid) return
  const canvasData = syncDrawStoreDataFromCanvas()
  targetDrawContext.value = {
    ...drawStore.draw,
    data: canvasData,
  }
  drawStore.editContextDrawData = serializeCanvasToStableString()
}

function getTargetDraw() {
  return targetDrawContext.value || drawStore.draw
}

function clearReferenceSelectionState() {
  currentDrawHoverIndex.value = null
  select()
  selects()
  meta2d?.inactive?.()
}

function syncTargetCanvasState() {
  clearReferenceSelectionState()
  emitter.emit('reloadDraw')
  emitter.emit('pensSorted')
  layerStore.layer = {}
  layerStore.getDefaultLayer()
}

function changeDraw(v: string) {
  if (previewDrawUid.value === v) return
  captureTargetDrawContext()
  clearReferenceSelectionState()
  showRequestOverlay('正在加载参考图纸，请稍候...')
  MonitorDrawService.selectByUid(v)
    .then((res) => {
      previewDrawUid.value = res.uid
      drawStore.referencePreviewUid = res.uid
      meta2d.open(normalizeDrawPayload(JSON.parse(res.data)))
      meta2d.fitView(true, 5)
      meta2d.render()
      syncTargetCanvasState()
    })
    .finally(() => {
      hideRequestOverlay()
    })
}

function restoreTargetDraw() {
  const targetDraw = getTargetDraw()
  if (!targetDraw?.uid) return false
  drawStore.draw = { ...targetDraw }
  meta2d.open(normalizeDrawPayload(JSON.parse(drawStore.draw.data)))
  meta2d.fitView(true, 5)
  meta2d.render()
  clearReferencePreviewState()
  syncTargetCanvasState()
  scheduleCaptureDrawEditSnapshot(drawStore.draw.uid)
  return true
}

function getPenLayerUid(pen: any) {
  return pen?.layerUid || ''
}

function parseDrawData(draw: ProjectMonitorDraw) {
  try {
    return draw?.data ? JSON.parse(draw.data) : { pens: [] }
  } catch (error) {
    window.$message.error('图纸数据解析失败')
    return { pens: [] }
  }
}

async function buildLayerUidMap(sourceDrawUid: string, targetDraw: ProjectMonitorDraw) {
  const [sourceLayers, targetLayers] = await Promise.all([
    MonitorLayerService.select(sourceDrawUid),
    MonitorLayerService.select(targetDraw.uid),
  ])

  const orderedSourceLayers = [...sourceLayers]
    .filter((layer) => layer?.uid)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  const sourceDefaultLayer =
    orderedSourceLayers.find((layer) => layer.defaultLayer) || orderedSourceLayers[0] || null

  const targetDefaultLayer =
    targetLayers.find((layer) => layer.defaultLayer) || targetLayers[0] || null

  for (const layer of targetLayers) {
    if (!layer?.uid || (targetDefaultLayer?.uid && layer.uid === targetDefaultLayer.uid)) continue
    await MonitorLayerService.delete(layer.uid)
  }

  const layerUidMap = new Map<string, string>()
  const nextTargetLayers: ProjectMonitorLayer[] = []

  if (sourceDefaultLayer) {
    const defaultLayerForm = {
      ...(targetDefaultLayer || {}),
      name: sourceDefaultLayer.name || '默认图层',
      drawUid: targetDraw.uid,
      projectUid: targetDraw.projectUid,
      locked: sourceDefaultLayer.locked ?? false,
      visible: sourceDefaultLayer.visible ?? true,
      pens: '',
      defaultLayer: true,
      sort: 1,
    } as ProjectMonitorLayerForm
    const syncedDefaultLayer = await MonitorLayerService.addOrUpdate(defaultLayerForm)
    if (syncedDefaultLayer?.uid) {
      layerUidMap.set(sourceDefaultLayer.uid, syncedDefaultLayer.uid)
      nextTargetLayers.push(syncedDefaultLayer)
    }
  }

  const nonDefaultSourceLayers = orderedSourceLayers.filter(
    (layer) => layer.uid !== sourceDefaultLayer?.uid,
  )

  for (const [index, sourceLayer] of nonDefaultSourceLayers.entries()) {
    const layerForm = {
      name: sourceLayer.name || `图层${index + 2}`,
      drawUid: targetDraw.uid,
      projectUid: targetDraw.projectUid,
      locked: sourceLayer.locked ?? false,
      visible: sourceLayer.visible ?? true,
      pens: '',
      defaultLayer: false,
      sort: index + 2,
    } as ProjectMonitorLayerForm
    const createdLayer = await MonitorLayerService.addOrUpdate(layerForm)
    if (createdLayer?.uid) {
      layerUidMap.set(sourceLayer.uid, createdLayer.uid)
      nextTargetLayers.push(createdLayer)
    }
  }

  return { layerUidMap, targetLayers: nextTargetLayers }
}

function getFallbackLayerUid(layers: ProjectMonitorLayer[]) {
  return layers.find((layer) => layer.defaultLayer)?.uid || layers[0]?.uid || undefined
}

function createCopyPens(
  sourcePens: any[],
  layerUidMap: Map<string, string>,
  fallbackLayerUid?: string,
) {
  return sourcePens.map((pen: any) => {
    const copyPen = deepClone(pen) as any
    delete copyPen.calculative
    if (copyPen.image && copyPen.name !== 'gif') copyPen.canvasLayer = CanvasLayer.CanvasMain
    const targetLayerUid = layerUidMap.get(getPenLayerUid(copyPen)) || fallbackLayerUid
    if (targetLayerUid) copyPen.layerUid = targetLayerUid
    else delete copyPen.layerUid
    return copyPen
  })
}

function buildReplacedDrawData(sourceDrawData: any, copyPens: any[]) {
  const nextDrawData = deepClone(sourceDrawData) as any
  nextDrawData.pens = copyPens
  return nextDrawData
}

function flattenCurrentProjectDrawOptions(vo: { categoryVoList?: Array<{ name?: string; drawList?: ProjectMonitorDraw[] }> }) {
  const options: OptionVo[] = []
  vo.categoryVoList?.forEach((category) => {
    category.drawList?.forEach((draw) => {
      if (!draw?.uid) return
      const categoryName = category.name ? `${category.name} / ` : ''
      options.push({
        label: `${categoryName}${draw.name || draw.uid}`,
        value: draw.uid,
      })
    })
  })
  return options
}

async function loadCurrentProjectDrawOptions() {
  const res = await MonitorDrawService.select(getUrlParams().projectUid)
  const options = flattenCurrentProjectDrawOptions(res)
  currentProjectDrawOptions.value = options
  const preferredUid = getTargetDraw()?.uid || drawStore.draw?.uid || ''
  copyTargetDrawUid.value =
    options.find((item) => item.value === preferredUid)?.value || options[0]?.value || ''
}

async function copyDrawToTarget(sourceDraw: ProjectMonitorDraw, targetDrawUid: string) {
  if (!targetDrawUid) {
    window.$message.error('请选择要导入的目标图纸')
    return
  }
  if (!sourceDraw?.uid) {
    window.$message.error('来源图纸无效，无法复制')
    return
  }
  if (sourceDraw.uid === targetDrawUid) {
    window.$message.warning('来源图纸和目标图纸相同，不能复制')
    return
  }

  copyingDrawUid.value = sourceDraw.uid
  try {
    if (previewDrawUid.value) {
      restoreTargetDraw()
    }
    const targetDraw = await MonitorDrawService.selectByUid(targetDrawUid)
    const sourceDrawDetail = await MonitorDrawService.selectByUid(sourceDraw.uid)
    const sourceData = parseDrawData(sourceDrawDetail)
    const sourcePens = (sourceData.pens || []).filter(Boolean)
    if (sourcePens.length === 0) {
      window.$message.warning('源图纸没有可复制的图元')
      return
    }

    const { layerUidMap, targetLayers } = await buildLayerUidMap(sourceDraw.uid, targetDraw)
    const fallbackLayerUid = getFallbackLayerUid(targetLayers)
    const copyPens = createCopyPens(sourcePens, layerUidMap, fallbackLayerUid)
    const nextDrawData = buildReplacedDrawData(sourceData, copyPens)

    const savedDraw: ProjectMonitorDraw = {
      ...targetDraw,
      data: JSON.stringify(nextDrawData),
    }
    await MonitorDrawService.save(savedDraw.data, savedDraw.uid)
    clearReferencePreviewState()
    await openDrawOnCanvas(savedDraw, drawStore, layerStore)
    syncTargetCanvasState()
    emitter.emit('updateDraw')
    window.$message.success(`已复制 ${sourcePens.length} 个图元到「${targetDraw.name || targetDraw.uid}」`)
  } catch (error) {
    console.error(error)
    window.$message.error('复制失败，请查看控制台或接口返回')
  } finally {
    copyingDrawUid.value = ''
  }
}

async function handleCopyClick(event: MouseEvent, item: ProjectMonitorDraw) {
  event.preventDefault()
  event.stopPropagation()
  pendingSourceDraw.value = item
  try {
    await loadCurrentProjectDrawOptions()
    if (!currentProjectDrawOptions.value.length) {
      window.$message.error('当前项目没有可导入的图纸')
      pendingSourceDraw.value = null
      return
    }
    showCopyTargetModal.value = true
  } catch (error) {
    console.error(error)
    window.$message.error('加载当前项目图纸失败')
    pendingSourceDraw.value = null
  }
}

function cancelCopyFlow() {
  showCopyTargetModal.value = false
  showCopyConfirm.value = false
  pendingSourceDraw.value = null
}

function confirmCopyTarget() {
  if (!copyTargetDrawUid.value) {
    window.$message.warning('请选择目标图纸')
    return
  }
  showCopyTargetModal.value = false
  showCopyConfirm.value = true
}

function confirmCopyDraw() {
  const sourceDraw = pendingSourceDraw.value
  const targetUid = copyTargetDrawUid.value
  showCopyConfirm.value = false
  pendingSourceDraw.value = null
  if (!sourceDraw || !targetUid) return
  void copyDrawToTarget(sourceDraw, targetUid)
}
</script>

<template>
  <div class="reference-project">
    <n-input-group class="reference-project__search">
      <n-input v-model:value="projectQueryData.keyword" placeholder="搜索参考项目" clearable />
      <n-button type="primary" ghost @click="selectProjectAll">搜索</n-button>
    </n-input-group>
    <n-collapse accordion class="reference-project__collapse">
      <n-collapse-item
        v-for="(item, index) in projectData"
        :title="item.name"
        :name="item.uid"
        @click="changeProject(item.uid)"
      >
        <n-list v-if="drawData.length > 0">
          <n-list-item
            v-for="(item, index) in drawData"
            class="reference-draw-list-item"
            :class="{
              'reference-draw-list-item--active': previewDrawUid === item.uid,
              'reference-draw-list-item--hover': currentDrawHoverIndex === index,
            }"
            @mousemove="currentDrawHoverIndex = index"
            @mouseleave="currentDrawHoverIndex = null"
            @click="changeDraw(item.uid)"
          >
            <div class="reference-draw-item">
              <span class="reference-draw-item__name">{{ item.name }}</span>
              <span @click.stop @mousedown.stop>
                <n-button
                  size="tiny"
                  type="primary"
                  ghost
                  :loading="copyingDrawUid === item.uid"
                  :disabled="drawStore.draw?.uid === item.uid"
                  @click="handleCopyClick($event, item)"
                >
                  复制
                </n-button>
              </span>
            </div>
          </n-list-item>
        </n-list>
        <n-empty v-else />
      </n-collapse-item>
    </n-collapse>
  </div>
  <n-modal
    v-model:show="showCopyTargetModal"
    preset="card"
    title="选择目标图纸"
    style="width: 480px"
    :mask-closable="false"
  >
    <p class="copy-target-tip">将参考图纸内容复制到当前项目的指定图纸（会覆盖目标图纸图层与图元）。</p>
    <n-form-item label="目标图纸">
      <n-select
        v-model:value="copyTargetDrawUid"
        :options="currentProjectDrawOptions"
        placeholder="请选择当前项目图纸"
      />
    </n-form-item>
    <template #footer>
      <div class="copy-target-actions">
        <n-button @click="cancelCopyFlow">取消</n-button>
        <n-button type="primary" @click="confirmCopyTarget">下一步</n-button>
      </div>
    </template>
  </n-modal>
  <n-modal
    v-model:show="showCopyConfirm"
    preset="dialog"
    type="warning"
    title="警告"
    content="复制将清空目标图纸的旧图层和全部图元，再导入参考图纸内容，是否继续？"
    positive-text="确定复制"
    negative-text="取消"
    @positive-click="confirmCopyDraw"
    @negative-click="cancelCopyFlow"
  />
</template>

<style lang="scss" scoped>
.copy-target-tip {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}

.copy-target-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.reference-project {
  --reference-project-align-left: 44px;
  padding: 4px 0 2px;
}

.reference-project__search {
  margin-bottom: 10px;
  padding: 0 0 0 var(--reference-project-align-left);
}

.reference-project__collapse {
  background: #fff;
}

::v-deep(.reference-project__search .n-input) {
  --n-border-radius: 8px 0 0 8px;
}

::v-deep(.reference-project__search .n-button) {
  --n-border-radius: 0 8px 8px 0;
  min-width: 72px;
}

::v-deep(.reference-project__collapse > .n-collapse-item > .n-collapse-item__header) {
  min-height: 42px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

::v-deep(.reference-project__collapse > .n-collapse-item > .n-collapse-item__content-wrapper) {
  border-top: 0;
}

::v-deep(.reference-project__collapse > .n-collapse-item > .n-collapse-item__content-wrapper > .n-collapse-item__content-inner) {
  padding: 0 0 0 12px;
}

::v-deep(.reference-project__collapse .n-list) {
  padding: 2px 0 6px 18px;
}

::v-deep(.reference-project__collapse .n-list-item) {
  padding: 0;
}

::v-deep(.n-collapse) {
  ::v-deep(.n-collapse-item .n-collapse-item) {
    margin-left: 0 !important;
  }
}

.reference-draw-list-item {
  margin: 2px 0;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.reference-draw-list-item--hover {
  background: #f8fafc;
}

.reference-draw-list-item--active {
  background: rgba(34, 197, 94, 0.1);
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.16);
}

.reference-draw-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 34px;
  padding: 0 10px 0 12px;
}

.reference-draw-item__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
  font-size: 13px;
}
</style>
