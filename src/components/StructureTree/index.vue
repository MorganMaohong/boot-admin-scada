<script lang="ts" setup>
import { computed, h, ref, watch } from 'vue'
import type { TreeDropInfo } from 'naive-ui'
import { NButton, NIcon, NTag, NTooltip } from 'naive-ui'
import { Copy, Edit, Renew, Star, Add } from '@vicons/carbon'
import { Eye, EyeOff, Lock, LockOff, LockOpen, Menu2 } from '@vicons/tabler'
import { MdTrash } from '@vicons/ionicons4'
import { LockState, deepClone } from '@meta2d/core'
import { MonitorLayerService } from '@/services/MonitorLayerService.ts'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import type { ProjectMonitorLayer, ProjectMonitorLayerForm } from '@/model/layer'
import { useLayerStore } from '@/stores/module/layer.ts'
import { useDrawStore } from '@/stores/module/draw.ts'

interface StructureTreeNode {
  key: string
  label: string
  type: 'layer' | 'pen'
  isLeaf: boolean
  layer?: ProjectMonitorLayer
  pen?: any
  children?: StructureTreeNode[]
}

const UNASSIGNED_LAYER_UID = '__unassigned__'

const props = defineProps<{
  drawUid?: string
  pens?: any[]
  currentPenId?: string
}>()

const emit = defineEmits<{
  (e: 'select-pen', pen: any): void
  (e: 'change-visible', pen: any): void
  (e: 'change-locked', pen: any): void
  (e: 'remove-pen', pen: any): void
  (e: 'sorted'): void
}>()

const drawStore = useDrawStore()
const layerStore = useLayerStore()
const layers = ref<ProjectMonitorLayer[]>([])
const loading = ref(false)
const draggingNode = ref<StructureTreeNode | null>(null)
const expandedKeys = ref<Array<string | number>>([])
const currentLayerUid = ref('')
const showLayerModal = ref(false)
const showCopyModal = ref(false)
const layerForm = ref<ProjectMonitorLayerForm>({})

watch(
  () => props.drawUid,
  async (drawUid) => {
    if (!drawUid) {
      layers.value = []
      expandedKeys.value = []
      currentLayerUid.value = ''
      return
    }
    await loadLayers(drawUid)
  },
  { immediate: true },
)

function createEmptyLayerForm(): ProjectMonitorLayerForm {
  return {
    name: '',
    drawUid: props.drawUid || drawStore.draw.uid,
    projectUid: drawStore.draw.projectUid,
    locked: false,
    visible: true,
    pens: '',
    defaultLayer: false,
    sort: layers.value.length + 1,
  } as ProjectMonitorLayerForm
}

async function loadLayers(drawUid = props.drawUid) {
  if (!drawUid) return
  loading.value = true
  try {
    layers.value = await MonitorLayerService.select(drawUid)
    syncCurrentLayer()
  } finally {
    loading.value = false
  }
}

function syncCurrentLayer() {
  const selected =
    layers.value.find((item) => item.uid === currentLayerUid.value) ||
    layers.value.find((item) => item.defaultLayer) ||
    layers.value[0]

  if (!selected) {
    currentLayerUid.value = ''
    return
  }

  currentLayerUid.value = selected.uid
  layerStore.layer = selected
}

function setCurrentLayer(layer?: ProjectMonitorLayer) {
  if (!layer?.uid || layer.uid === UNASSIGNED_LAYER_UID) return
  currentLayerUid.value = layer.uid
  layerStore.layer = layer
}

function getPenLabel(pen: any) {
  return pen?.nickname || pen?.name || pen?.id || '未命名图元'
}

function isPenVisible(pen: any) {
  if (pen?.visible === false || pen?.visible === true) return pen.visible
  return false
}

function getPenLayerUid(pen: any) {
  return pen?.layerUid || UNASSIGNED_LAYER_UID
}

function buildPenNode(pen: any): StructureTreeNode {
  return {
    key: `pen-${pen.id}`,
    label: getPenLabel(pen),
    type: 'pen',
    isLeaf: true,
    pen,
  }
}

function buildLayerPensMap(pens: any[], frontFirst = true) {
  const map = new Map<string, any[]>()
  pens.forEach((pen) => {
    const layerUid = getPenLayerUid(pen)
    if (!map.has(layerUid)) {
      map.set(layerUid, [])
    }
    map.get(layerUid)?.push(pen)
  })

  if (frontFirst) {
    map.forEach((layerPens, layerUid) => {
      map.set(layerUid, [...layerPens].reverse())
    })
  }

  return map
}

function getLayerPens(layerUid: string) {
  return (meta2d.data().pens || []).filter((pen: any) => getPenLayerUid(pen) === layerUid)
}

const treeData = computed<StructureTreeNode[]>(() => {
  const penList = (props.pens || []).filter(Boolean)
  const layerPensMap = buildLayerPensMap(penList)

  const nodes: StructureTreeNode[] = layers.value.map((layer) => ({
    key: `layer-${layer.uid}`,
    label: layer.name || '未命名图层',
    type: 'layer',
    isLeaf: false,
    layer,
    children: (layerPensMap.get(layer.uid) || []).map(buildPenNode),
  }))

  const unassignedPens = layerPensMap.get(UNASSIGNED_LAYER_UID) || []
  if (unassignedPens.length > 0) {
    nodes.push({
      key: `layer-${UNASSIGNED_LAYER_UID}`,
      label: '未分配图层',
      type: 'layer',
      isLeaf: false,
      children: unassignedPens.map(buildPenNode),
    })
  }

  return nodes
})

watch(
  treeData,
  (nodes) => {
    expandedKeys.value = nodes.map((item) => item.key)
  },
  { immediate: true },
)

const selectedKeys = computed(() => {
  if (props.currentPenId) return [`pen-${props.currentPenId}`]
  if (currentLayerUid.value) return [`layer-${currentLayerUid.value}`]
  return []
})

function renderLabel({ option }: { option: StructureTreeNode }) {
  if (option.type === 'layer') {
    return h('div', { class: 'structure-tree__layer-label' }, [
      h('div', { class: 'structure-tree__layer-prefix' }, [
        h(NIcon, { class: 'structure-tree__drag-icon' }, { default: () => h(Menu2) }),
        h(
          'span',
          {
            class: [
              'structure-tree__label-text',
              option.layer?.uid === currentLayerUid.value && 'structure-tree__label-text--active',
            ],
          },
          option.label,
        ),
      ]),
      h(
        'div',
        { class: 'structure-tree__layer-meta' },
        [
          option.layer?.defaultLayer
            ? h(
                NTag,
                { size: 'small', bordered: false, type: 'warning', class: 'structure-tree__default-tag' },
                { default: () => '默认' },
              )
            : null,
          h(
            NTag,
            { size: 'small', bordered: false, type: 'default', class: 'structure-tree__count' },
            { default: () => String(option.children?.length || 0) },
          ),
        ].filter(Boolean),
      ),
    ])
  }

  return h('div', { class: 'structure-tree__pen-label-wrap' }, [
    h(NIcon, { class: 'structure-tree__drag-icon' }, { default: () => h(Menu2) }),
    h(
      'span',
      {
        class: [
          'structure-tree__pen-label',
          option.pen?.id === props.currentPenId && 'structure-tree__pen-label--active',
        ],
      },
      option.label,
    ),
  ])
}

function buildIconButton(
  icon: any,
  onClick: (e: MouseEvent) => void,
  className = 'structure-tree__action-btn',
  tooltip = '',
) {
  const button = h(
    NButton,
    {
      text: true,
      size: 'small',
      class: className,
      onClick,
    },
    {
      icon: () => h(NIcon, null, { default: () => h(icon) }),
    },
  )

  if (!tooltip) return button

  return h(
    NTooltip,
    { delay: 300 },
    {
      trigger: () => button,
      default: () => tooltip,
    },
  )
}

function renderLayerSuffix(option: StructureTreeNode) {
  const layer = option.layer
  if (!layer) return null

  const lockIcon = layer.locked ? Lock : LockOpen
  const visibleIcon = layer.visible === false ? EyeOff : Eye

  return h('div', { class: 'structure-tree__actions' }, [
    buildIconButton(Star, (e) => {
      e.stopPropagation()
      changeDefaultLayer(layer.uid)
    }, layer.defaultLayer ? 'structure-tree__action-btn structure-tree__action-btn--active' : 'structure-tree__action-btn', '设为默认图层'),
    buildIconButton(lockIcon, (e) => {
      e.stopPropagation()
      updateLayerLock(layer, !layer.locked)
    }, '锁定图层'),
    buildIconButton(visibleIcon, (e) => {
      e.stopPropagation()
      updateLayerVisible(layer, layer.visible === false)
    }, '显示/隐藏图层'),
    buildIconButton(Edit, (e) => {
      e.stopPropagation()
      openUpdateLayerModal(layer)
    }, '编辑图层'),
    buildIconButton(Copy, (e) => {
      e.stopPropagation()
      openCopyLayerModal(layer)
    }, '复制图层'),
    buildIconButton(MdTrash, (e) => {
      e.stopPropagation()
      deleteLayer(layer)
    }, '删除图层'),
  ])
}

function renderPenSuffix(option: StructureTreeNode) {
  if (option.type !== 'pen' || !option.pen) return null
  const pen = option.pen

  const lockIcon =
    pen.locked === LockState.None
      ? LockOpen
      : pen.locked === LockState.DisableEdit
        ? Lock
        : LockOff

  return h('div', { class: 'structure-tree__actions' }, [
    buildIconButton(lockIcon, (e) => {
      e.stopPropagation()
      emit('change-locked', pen)
    }, '锁定图元'),
    buildIconButton(isPenVisible(pen) ? Eye : EyeOff, (e) => {
      e.stopPropagation()
      emit('change-visible', pen)
    }, '显示/隐藏图元'),
    buildIconButton(MdTrash, (e) => {
      e.stopPropagation()
      emit('remove-pen', pen)
    }, '删除图元'),
  ])
}

function renderSuffix({ option }: { option: StructureTreeNode }) {
  if (option.type === 'layer') return renderLayerSuffix(option)
  return renderPenSuffix(option)
}

function handleUpdateSelectedKeys(_keys: Array<string | number>, options: Array<any>) {
  const selected = options?.[0] as StructureTreeNode | undefined
  if (!selected) return

  if (selected.type === 'layer') {
    setCurrentLayer(selected.layer)
    return
  }

  if (selected.type === 'pen' && selected.pen) {
    emit('select-pen', selected.pen)
  }
}

function moveItem<T>(list: T[], fromIndex: number, toIndex: number) {
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return list
  const item = list.splice(fromIndex, 1)[0]
  list.splice(toIndex, 0, item)
  return list
}

function saveDraw() {
  if (!props.drawUid) return Promise.resolve()
  return MonitorDrawService.save(JSON.stringify(meta2d.data()), props.drawUid)
}

function replacePens(nextPens: any[]) {
  const layerPensMap = buildLayerPensMap(nextPens, false)
  const layerUids = layers.value.map((layer) => layer.uid)

  layerUids.push(UNASSIGNED_LAYER_UID)
  layerPensMap.forEach((_pens, layerUid) => {
    if (!layerUids.includes(layerUid)) layerUids.push(layerUid)
  })

  for (let layerIndex = layerUids.length - 1; layerIndex >= 0; layerIndex -= 1) {
    const pens = layerPensMap.get(layerUids[layerIndex]) || []
    for (let penIndex = pens.length - 1; penIndex >= 0; penIndex -= 1) {
      meta2d.top(pens[penIndex])
    }
  }
  meta2d.render()
  emit('sorted')
}

function rebuildPensFromLayerMap(layerPensMap: Map<string, any[]>) {
  const orderedPens: any[] = []

  layers.value.forEach((layer) => {
    orderedPens.push(...(layerPensMap.get(layer.uid) || []))
    layerPensMap.delete(layer.uid)
  })

  orderedPens.push(...(layerPensMap.get(UNASSIGNED_LAYER_UID) || []))
  layerPensMap.delete(UNASSIGNED_LAYER_UID)

  layerPensMap.forEach((pens) => {
    orderedPens.push(...pens)
  })

  return orderedPens
}

function rebuildPensByLayerOrder(sourcePens: any[]) {
  return rebuildPensFromLayerMap(buildLayerPensMap(sourcePens))
}

async function reorderLayers(dragLayerUid: string, targetLayerUid: string, dropPosition: 'before' | 'after') {
  const fromIndex = layers.value.findIndex((item) => item.uid === dragLayerUid)
  const targetIndex = layers.value.findIndex((item) => item.uid === targetLayerUid)
  if (fromIndex < 0 || targetIndex < 0) return

  const nextLayers = [...layers.value]
  const toIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1
  moveItem(nextLayers, fromIndex, fromIndex < toIndex ? toIndex - 1 : toIndex)
  layers.value = nextLayers.map((item, index) => ({ ...item, sort: index + 1 }))
  syncCurrentLayer()

  const nextPens = rebuildPensByLayerOrder([...(meta2d.data().pens || [])])
  replacePens(nextPens)

  await Promise.all([
    MonitorLayerService.sort(
      props.drawUid!,
      layers.value.map((item) => item.uid),
    ),
    saveDraw(),
  ])
}

async function reorderPens(
  dragPen: any,
  targetNode: StructureTreeNode,
  dropPosition: 'before' | 'inside' | 'after',
) {
  const sourcePens = [...(meta2d.data().pens || [])]
  const layerPensMap = buildLayerPensMap(sourcePens)
  const dragPenId = dragPen.id
  const sourceLayerUid = getPenLayerUid(dragPen)

  layerPensMap.forEach((pens, key) => {
    layerPensMap.set(
      key,
      pens.filter((item) => item.id !== dragPenId),
    )
  })

  let targetLayerUid = UNASSIGNED_LAYER_UID
  if (targetNode.type === 'layer') {
    targetLayerUid = targetNode.layer?.uid || UNASSIGNED_LAYER_UID
  } else if (targetNode.type === 'pen') {
    targetLayerUid = getPenLayerUid(targetNode.pen)
  }

  const targetPens = [...(layerPensMap.get(targetLayerUid) || [])]

  if (targetNode.type === 'layer' || dropPosition === 'inside') {
    targetPens.push(dragPen)
  } else {
    const targetIndex = targetPens.findIndex((item) => item.id === targetNode.pen?.id)
    const insertIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1
    targetPens.splice(insertIndex, 0, dragPen)
  }

  const nextLayerUid = targetLayerUid === UNASSIGNED_LAYER_UID ? undefined : targetLayerUid
  dragPen.layerUid = nextLayerUid
  meta2d.setValue(
    {
      id: dragPen.id,
      layerUid: nextLayerUid,
    },
    { render: false, history: false, doEvent: false },
  )

  layerPensMap.set(targetLayerUid, targetPens)
  if (!layerPensMap.has(sourceLayerUid)) {
    layerPensMap.set(sourceLayerUid, [])
  }

  const orderedPens = rebuildPensFromLayerMap(layerPensMap)
  replacePens(orderedPens)
  await saveDraw()
}

function handleDragStart(info: { node: any; event?: DragEvent }) {
  const node = info.node as StructureTreeNode
  draggingNode.value = node
  if (info.event?.dataTransfer) {
    info.event.dataTransfer.effectAllowed = 'move'
    info.event.dataTransfer.setData('text/plain', node.key)
  }
}

function handleDragEnd() {
  draggingNode.value = null
}

function allowDrop({
  node,
  dropPosition,
}: {
  node: any
  dropPosition: 'before' | 'inside' | 'after'
}) {
  const dragNode = draggingNode.value
  const targetNode = node as StructureTreeNode
  if (!dragNode) return false

  if (dragNode.type === 'layer') {
    return (
      targetNode.type === 'layer' &&
      targetNode.layer?.uid !== UNASSIGNED_LAYER_UID &&
      targetNode.layer?.uid !== undefined &&
      dropPosition !== 'inside'
    )
  }

  if (dragNode.type === 'pen') {
    if (targetNode.type === 'layer') {
      return dropPosition === 'inside'
    }
    return targetNode.type === 'pen' && dropPosition !== 'inside' && dragNode.pen?.id !== targetNode.pen?.id
  }

  return false
}

async function handleDrop(info: TreeDropInfo) {
  const dragNode = info.dragNode as StructureTreeNode
  const targetNode = info.node as StructureTreeNode

  try {
    if (dragNode.type === 'layer' && targetNode.type === 'layer' && targetNode.layer?.uid) {
      await reorderLayers(dragNode.layer!.uid, targetNode.layer.uid, info.dropPosition)
      window.$message.success('图层顺序已更新')
      return
    }

    if (dragNode.type === 'pen' && dragNode.pen) {
      await reorderPens(dragNode.pen, targetNode, info.dropPosition)
      window.$message.success('图元层级已更新')
    }
  } catch (error) {
    window.$message.error('排序失败')
  } finally {
    draggingNode.value = null
  }
}

function openCreateLayerModal() {
  layerForm.value = createEmptyLayerForm()
  showLayerModal.value = true
}

function openUpdateLayerModal(layer: ProjectMonitorLayer) {
  setCurrentLayer(layer)
  layerForm.value = { ...layer }
  showLayerModal.value = true
}

function openCopyLayerModal(layer: ProjectMonitorLayer) {
  if (!layer?.uid) return
  setCurrentLayer(layer)
  layerForm.value = {
    ...layer,
    id: null,
    uid: null,
    name: `${layer.name || '未命名图层'}-副本`,
    defaultLayer: false,
  } as ProjectMonitorLayerForm
  showCopyModal.value = true
}

async function submitLayerForm() {
  if (!layerForm.value.name?.trim()) {
    window.$message.error('请输入图层名称')
    return
  }

  layerForm.value.drawUid = props.drawUid || drawStore.draw.uid
  layerForm.value.projectUid = drawStore.draw.projectUid
  if (layerForm.value.visible === undefined) layerForm.value.visible = true
  if (layerForm.value.locked === undefined) layerForm.value.locked = false

  await MonitorLayerService.addOrUpdate(layerForm.value)
  showLayerModal.value = false
  await loadLayers()
  window.$message.success(layerForm.value.uid ? '图层已更新' : '图层已新增')
}

async function onCopyLayer() {
  if (!layerForm.value.name?.trim()) {
    window.$message.error('请输入图层名称')
    return
  }
  const sourceLayerUid = currentLayerUid.value
  if (!sourceLayerUid) {
    window.$message.error('请先选择要复制的图层')
    return
  }

  layerForm.value.drawUid = props.drawUid || drawStore.draw.uid
  layerForm.value.projectUid = drawStore.draw.projectUid
  const copyLayer = await MonitorLayerService.copy(layerForm.value)
  const pens = getLayerPens(sourceLayerUid)
  pens.forEach((pen) => {
    const copyPen = deepClone(pen)
    copyPen.id = null
    copyPen.layerUid = copyLayer.uid
    meta2d.addPen(copyPen, false, false, true)
  })
  meta2d.render()
  await saveDraw()
  showCopyModal.value = false
  await loadLayers()
  currentLayerUid.value = copyLayer.uid
  layerStore.layer = copyLayer
  window.$message.success('图层已复制')
}

async function changeDefaultLayer(layerUid: string) {
  if (!props.drawUid) return
  await MonitorLayerService.changeDefaultLayer(props.drawUid, layerUid)
  await loadLayers()
  const targetLayer = layers.value.find((item) => item.uid === layerUid)
  setCurrentLayer(targetLayer)
  window.$message.success('默认图层已更新')
}

async function updateLayerVisible(layer: ProjectMonitorLayer, visible: boolean) {
  const nextLayer = { ...layer, visible }
  await MonitorLayerService.addOrUpdate(nextLayer)
  const layerPens = getLayerPens(layer.uid)
  layerPens.forEach((pen) => {
    meta2d.setValue({ id: pen.id, visible }, { render: false })
  })
  meta2d.render()
  await saveDraw()
  await loadLayers()
}

async function updateLayerLock(layer: ProjectMonitorLayer, locked: boolean) {
  const nextLayer = { ...layer, locked }
  await MonitorLayerService.addOrUpdate(nextLayer)
  const layerPens = getLayerPens(layer.uid)
  layerPens.forEach((pen) => {
    meta2d.setValue({ id: pen.id, locked: locked ? LockState.Disable : LockState.None }, { render: false })
  })
  meta2d.render()
  await saveDraw()
  await loadLayers()
}

async function deleteLayer(layer: ProjectMonitorLayer) {
  if (!layer?.uid) {
    window.$message.error('请先选择图层')
    return
  }
  if (layer.defaultLayer) {
    window.$message.error('默认图层不能删除')
    return
  }

  await MonitorLayerService.delete(layer.uid)
  const layerPens = getLayerPens(layer.uid)
  if (layerPens.length) {
    meta2d.delete(layerPens)
    meta2d.render()
    await saveDraw()
  }
  await loadLayers()
  layerStore.getDefaultLayer()
  window.$message.success('图层已删除')
}
</script>

<template>
  <div class="structure-tree">
    <div class="structure-tree__header">
      <div>
        <div class="structure-tree__header-title">图层</div>
      </div>
      <div class="structure-tree__header-actions">
        <n-button quaternary size="small" @click="loadLayers">
          <template #icon>
            <n-icon><Renew /></n-icon>
          </template>
          刷新
        </n-button>
        <n-button type="primary" size="small" @click="openCreateLayerModal">
          <template #icon>
            <n-icon><Add /></n-icon>
          </template>
          新增图层
        </n-button>
      </div>
    </div>
    <n-tree
      block-line
      selectable
      draggable
      :data="treeData"
      :loading="loading"
      :expanded-keys="expandedKeys"
      :selected-keys="selectedKeys"
      :render-label="renderLabel"
      :render-suffix="renderSuffix"
      :allow-drop="allowDrop"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @drop="handleDrop"
      @update:selected-keys="handleUpdateSelectedKeys"
      @update:expanded-keys="expandedKeys = $event"
    />
  </div>

  <n-modal v-model:show="showLayerModal" preset="card" title="图层信息" style="width: 360px">
    <n-form label-placement="top">
      <n-form-item label="图层名称">
        <n-input v-model:value="layerForm.name" placeholder="请输入图层名称" />
      </n-form-item>
    </n-form>
    <template #footer>
      <div class="flex justify-end">
        <n-button type="primary" @click="submitLayerForm">确定</n-button>
      </div>
    </template>
  </n-modal>

  <n-modal v-model:show="showCopyModal" preset="card" title="复制图层" style="width: 360px">
    <n-form label-placement="top">
      <n-form-item label="新图层名称">
        <n-input v-model:value="layerForm.name" placeholder="请输入新图层名称" />
      </n-form-item>
    </n-form>
    <template #footer>
      <div class="flex justify-end">
        <n-button type="primary" @click="onCopyLayer">确定</n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
.structure-tree {
  user-select: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.structure-tree__header {
  padding: 8px;
  border: 1px solid #e7ebf3;
  border-radius: 8px;
  background: linear-gradient(180deg, #fbfcfe 0%, #f5f7fb 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.structure-tree__header-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.structure-tree__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.structure-tree__header-actions :deep(.n-button) {
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
}

:deep(.n-tree-node-wrapper) {
  margin: 2px 0;
  border-radius: 10px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.n-tree-node-wrapper:hover) {
  background: #f7f9fc;
}

:deep(.n-tree-node-wrapper--selected) {
  background: rgba(32, 128, 240, 0.08);
  box-shadow: inset 0 0 0 1px rgba(32, 128, 240, 0.16);
}

:deep(.n-tree-node-content) {
  min-height: 34px;
  padding-right: 4px;
}

:deep(.n-tree-node-content__text) {
  min-width: 0;
  flex: 1;
}

:deep(.n-tree-node-indent) {
  width: 16px;
}

:deep(.n-tree-node-switcher) {
  width: 24px;
  color: #94a3b8;
}

:deep(.n-tree-node-drop-indicator) {
  height: 4px;
  border-radius: 999px;
  background-color: #2080f0;
  box-shadow: 0 0 0 2px rgba(32, 128, 240, 0.12);
}

:deep(.n-tree-node-drag-image) {
  border-radius: 10px;
}

.structure-tree__layer-label {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 6px;
  background: linear-gradient(180deg, #f9fafc 0%, #f3f6fb 100%);
}

.structure-tree__layer-prefix,
.structure-tree__pen-label-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.structure-tree__layer-meta {
  display: flex;
  align-items: center;
  gap: 4px;
}

.structure-tree__drag-icon {
  display: inline-flex;
  align-items: center;
  color: #94a3b8;
  flex-shrink: 0;
  font-size: 14px;
}

.structure-tree__label-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #0f172a;
  font-weight: 600;
}

.structure-tree__label-text--active {
  color: #2080f0;
}

.structure-tree__default-tag,
.structure-tree__count {
  flex-shrink: 0;
}

.structure-tree__pen-label-wrap {
  padding: 4px 6px;
}

.structure-tree__pen-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
}

.structure-tree__pen-label--active {
  color: #2080f0;
  font-weight: 600;
}

.structure-tree__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  padding-left: 4px;
}

:deep(.n-tree-node-wrapper:hover) .structure-tree__actions,
:deep(.n-tree-node-wrapper--selected) .structure-tree__actions {
  opacity: 1;
}

.structure-tree__action-btn {
  color: #64748b;
  width: 24px;
  height: 24px;
  padding: 0;
}

.structure-tree__action-btn :deep(.n-button__icon) {
  font-size: 14px;
}

.structure-tree__action-btn:hover {
  color: #2080f0;
}

.structure-tree__action-btn--active {
  color: #d97706;
}
</style>
