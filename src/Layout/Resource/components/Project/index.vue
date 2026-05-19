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

const drawStore = useDrawStore()
const targetDrawContext = ref<ProjectMonitorDraw | null>(null)
const previewDrawUid = ref('')
const currentProjectUid = ref('')
const projectData = ref<Project[]>([])
const drawData = ref<ProjectMonitorDraw[]>([])
const currentDrawHoverIndex = ref()
const projectQueryData = ref<ProjectQuery>({ keyword: '' })
const copyingDrawUid = ref('')
const showCopyConfirm = ref(false)
const pendingSourceDraw = ref<ProjectMonitorDraw | null>(null)
onMounted(() => {
  selectProjectAll()
})

watch(
  () => drawStore.draw?.uid,
  () => {
    if (previewDrawUid.value) return
    targetDrawContext.value = null
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
  MonitorDrawService.selectByProjectUid(currentProjectUid.value).then((res) => {
    drawData.value = res
  })
}

function changeProject(projectUid: string) {
  currentProjectUid.value = projectUid
  captureTargetDrawContext()
  selectDrawByProjectUid()
}

function captureTargetDrawContext() {
  if (targetDrawContext.value?.uid) return
  if (!drawStore.draw?.uid) return
  cleanupMeta2dPens({ render: false })
  targetDrawContext.value = {
    ...drawStore.draw,
    data: JSON.stringify(meta2d.data()),
  }
}

function getTargetDraw() {
  return targetDrawContext.value || drawStore.draw
}

function changeDraw(v: string) {
  if (previewDrawUid.value === v) return
  captureTargetDrawContext()
  showRequestOverlay('正在加载参考图纸，请稍候...')
  MonitorDrawService.selectByUid(v).then((res) => {
    previewDrawUid.value = res.uid
    meta2d.open(JSON.parse(res.data))
    meta2d.fitView(true, 5)
    meta2d.render()
    emitter.emit('reloadDraw')
  }).finally(() => {
    hideRequestOverlay()
  })
}

function restoreTargetDraw() {
  const targetDraw = getTargetDraw()
  if (!targetDraw?.uid) return false
  drawStore.draw = { ...targetDraw }
  meta2d.open(JSON.parse(drawStore.draw.data))
  meta2d.fitView(true, 5)
  meta2d.render()
  previewDrawUid.value = ''
  emitter.emit('reloadDraw')
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

function openMergedDrawData(drawData: any) {
  meta2d.open(deepClone(drawData))
  meta2d.render()
}

function getPenId(pen: any) {
  return pen?.id ? String(pen.id) : ''
}

async function copyDrawToCurrentDraw(sourceDraw: ProjectMonitorDraw) {
  const targetDraw = getTargetDraw()
  if (!targetDraw?.uid) {
    window.$message.error('请先打开要导入的目标图纸')
    return
  }
  if (!sourceDraw?.uid) {
    window.$message.error('来源图纸无效，无法复制')
    return
  }
  if (sourceDraw.uid === targetDraw.uid) {
    window.$message.warning('来源图纸和目标图纸相同，不能复制')
    return
  }

  copyingDrawUid.value = sourceDraw.uid
  try {
    if (!restoreTargetDraw()) return
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

    openMergedDrawData(nextDrawData)
    cleanupMeta2dPens({ render: false })
    drawStore.draw.data = JSON.stringify(nextDrawData)
    await MonitorDrawService.save(drawStore.draw.data, drawStore.draw.uid)
    targetDrawContext.value = { ...drawStore.draw }
    emitter.emit('pensSorted')
    window.$message.success(`已复制 ${sourcePens.length} 个图元，并同步图层`)
  } catch (error) {
    console.error(error)
    window.$message.error('复制失败，请查看控制台或接口返回')
  } finally {
    copyingDrawUid.value = ''
  }
}

function handleCopyClick(event: MouseEvent, item: ProjectMonitorDraw) {
  event.preventDefault()
  event.stopPropagation()
  pendingSourceDraw.value = item
  showCopyConfirm.value = true
}

function confirmCopyDraw() {
  const sourceDraw = pendingSourceDraw.value
  showCopyConfirm.value = false
  pendingSourceDraw.value = null
  if (!sourceDraw) return
  copyDrawToCurrentDraw(sourceDraw)
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
                  :disabled="getTargetDraw()?.uid === item.uid"
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
    v-model:show="showCopyConfirm"
    preset="dialog"
    type="warning"
    title="警告"
    content="复制将清空当前目标图纸的旧图层和全部图元，再导入参考图纸内容，是否继续？"
    positive-text="确定复制"
    negative-text="取消"
    @positive-click="confirmCopyDraw"
  />
</template>

<style lang="scss" scoped>
.reference-project {
  padding: 8px;
}

.reference-project__search {
  margin-bottom: 8px;
}

.reference-project__collapse {
  border-radius: 10px;
  background: #fff;
}

::v-deep(.n-list) {
  padding: 4px 0 4px 18px;
}

::v-deep(.n-collapse) {
  ::v-deep(.n-collapse-item .n-collapse-item) {
    margin-left: 12px !important;
  }
}

.reference-draw-list-item {
  margin: 3px 0;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.reference-draw-list-item--hover {
  background: #f6f8fb;
}

.reference-draw-list-item--active {
  background: rgba(32, 128, 240, 0.08);
  box-shadow: inset 0 0 0 1px rgba(32, 128, 240, 0.14);
}

.reference-draw-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 30px;
}

.reference-draw-item__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1f2937;
  font-size: 13px;
}
</style>
