<script lang="ts" setup>
import { computed, h, nextTick, ref, watch } from 'vue'
import type { TreeDropInfo } from 'naive-ui'
import { NButton, NCheckbox, NIcon, NTag, NTooltip } from 'naive-ui'
import { Copy, Edit, Star, Add } from '@vicons/carbon'
import { Eye, EyeOff, Lock, LockOff, LockOpen, Menu2 } from '@vicons/tabler'
import { MdTrash } from '@vicons/ionicons4'
import { LockState, deepClone } from '@meta2d/core'
import { MonitorLayerService } from '@/services/MonitorLayerService.ts'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import type { ProjectMonitorLayer, ProjectMonitorLayerForm } from '@/model/layer'
import { useLayerStore } from '@/stores/module/layer.ts'
import { useDrawStore } from '@/stores/module/draw.ts'
import { useSelection } from '@/services/selections.ts'
import {
  cleanupMeta2dPens,
  collectValidMeta2dPens,
  countInvalidMeta2dPens,
  getRuntimeMeta2dPen,
  getCombineChildPensForLayerTree,
  getCombineParentPen,
  isCombineMemberPen,
  combineTreeOrderToRenderOrder,
  removeMeta2dPens,
  reorderMeta2dPens,
  reorderCombineChildPens,
} from '@/utils/meta2dPens.ts'
import { markDrawEditSaved } from '@/utils/drawEditState.ts'
import FormModal from '@/components/FormModal/index.vue'

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
  scrollToSelectionVersion?: number
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
const { select, selections, selects } = useSelection()
const layers = ref<ProjectMonitorLayer[]>([])
const loading = ref(false)
const draggingNode = ref<StructureTreeNode | null>(null)
const expandedKeys = ref<Array<string | number>>([])
const currentLayerUid = ref('')
const showLayerModal = ref(false)
const showCopyModal = ref(false)
const layerForm = ref<ProjectMonitorLayerForm>({} as ProjectMonitorLayerForm)
const checkedPenIds = ref<string[]>([])
const structureTreeRef = ref<HTMLElement | null>(null)
const pendingScrollToSelected = ref(false)
const knownLayerUidSet = computed(
  () => new Set(layers.value.map((layer) => layer.uid).filter(Boolean)),
)

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
  } as unknown as ProjectMonitorLayerForm
}

async function loadLayers(drawUid = props.drawUid) {
  if (!drawUid) return
  loading.value = true
  try {
    await layerStore.ensureDefaultLayer(drawUid, drawStore.draw.projectUid)
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
  if (pen?.name === 'combine') {
    if (pen.showChild !== undefined) {
      return pen?.nickname || '状态组合'
    }
    return pen?.nickname || '组合'
  }
  return pen?.nickname || pen?.name || pen?.id || '未命名图元'
}

function isPenVisible(pen: any) {
  if (pen?.visible === false || pen?.visible === true) return pen.visible
  return false
}

function getPenLayerUid(pen: any) {
  const layerUid = pen?.layerUid
  if (!layerUid || !knownLayerUidSet.value.has(layerUid)) return UNASSIGNED_LAYER_UID
  return layerUid
}

function buildPenNode(pen: any): StructureTreeNode {
  const runtimePen = getRuntimeMeta2dPen(pen) || pen
  const childNodes =
    runtimePen?.name === 'combine' &&
    Array.isArray(runtimePen.children) &&
    runtimePen.children.length > 0
      ? getCombineChildPensForLayerTree(runtimePen)
          .map(buildPenNode)
      : undefined

  return {
    key: `pen-${runtimePen.id}`,
    label: getPenLabel(runtimePen),
    type: 'pen',
    isLeaf: !childNodes?.length,
    pen: runtimePen,
    children: childNodes,
  }
}

function buildLayerPensMap(pens: any[], frontFirst = true) {
  const map = new Map<string, any[]>()
  pens.forEach((pen) => {
    if (isCombineMemberPen(pen)) return
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
  if (!layerUid || layerUid === UNASSIGNED_LAYER_UID) return []
  return collectValidMeta2dPens(meta2d.data().pens || []).pens.filter(
    (pen: any) => pen?.layerUid === layerUid,
  )
}

const treeData = computed<StructureTreeNode[]>(() => {
  const penList = collectValidMeta2dPens(props.pens || []).pens
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

function collectTreePenIds(nodes: StructureTreeNode[]) {
  const ids: string[] = []
  const walk = (node?: StructureTreeNode) => {
    if (!node) return
    const penId = getPenId(node.pen)
    if (penId) ids.push(penId)
    node.children?.forEach(walk)
  }
  nodes.forEach((layerNode) => layerNode.children?.forEach(walk))
  return ids
}

watch(
  treeData,
  (nodes) => {
    expandedKeys.value = nodes.map((item) => item.key)
    const validPenIds = new Set(collectTreePenIds(nodes))
    checkedPenIds.value = checkedPenIds.value.filter((id) => validPenIds.has(id))
    if (pendingScrollToSelected.value) {
      nextTick(() => {
        scrollSelectedIntoView()
      })
    }
  },
  { immediate: true },
)

watch(
  () => props.scrollToSelectionVersion,
  () => {
    queueScrollSelectedIntoView()
  },
)

watch(
  () => props.currentPenId,
  () => {
    if (!pendingScrollToSelected.value) return
    nextTick(() => {
      scrollSelectedIntoView()
    })
  },
)

const selectedKeys = computed(() => {
  if (props.currentPenId) return [`pen-${props.currentPenId}`]
  if (currentLayerUid.value) return [`layer-${currentLayerUid.value}`]
  return []
})

const selectedPenIds = computed(() => {
  return new Set([
    ...(selections.pens || []).map((pen: any) => pen?.id).filter(Boolean),
    ...checkedPenIds.value,
  ])
})

const selectedPensCount = computed(() => selectedPenIds.value.size)
const checkedPensCount = computed(() => checkedPenIds.value.length)
const invalidPensCount = computed(() => countInvalidMeta2dPens(props.pens || []))

function getLayerPenIds(option: StructureTreeNode) {
  return (option.children || []).map((item) => getPenId(item.pen)).filter(Boolean)
}

function isLayerChecked(option: StructureTreeNode) {
  const penIds = getLayerPenIds(option)
  return penIds.length > 0 && penIds.every((id) => checkedPenIds.value.includes(id))
}

function isLayerIndeterminate(option: StructureTreeNode) {
  const penIds = getLayerPenIds(option)
  const checkedCount = penIds.filter((id) => checkedPenIds.value.includes(id)).length
  return checkedCount > 0 && checkedCount < penIds.length
}

function setCheckedPenIds(ids: string[]) {
  checkedPenIds.value = [...new Set(ids.filter(Boolean))]
}

function togglePenChecked(pen: any, checked: boolean) {
  const penId = getPenId(pen)
  if (!penId) return
  if (checked) {
    setCheckedPenIds([...checkedPenIds.value, penId])
    return
  }
  setCheckedPenIds(checkedPenIds.value.filter((id) => id !== penId))
}

function toggleLayerChecked(option: StructureTreeNode, checked: boolean) {
  const penIds = getLayerPenIds(option)
  if (penIds.length === 0) return
  if (checked) {
    setCheckedPenIds([...checkedPenIds.value, ...penIds])
    return
  }
  const removeIds = new Set(penIds)
  setCheckedPenIds(checkedPenIds.value.filter((id) => !removeIds.has(id)))
}

function clearCheckedPens() {
  checkedPenIds.value = []
}

function renderLabel({ option }: { option: StructureTreeNode }) {
  if (option.type === 'layer') {
    return h('div', { class: 'structure-tree__layer-label' }, [
      h('div', { class: 'structure-tree__layer-prefix' }, [
        h(NCheckbox, {
          checked: isLayerChecked(option),
          indeterminate: isLayerIndeterminate(option),
          disabled: !option.children?.length,
          onClick: (e: MouseEvent) => e.stopPropagation(),
          'onUpdate:checked': (checked: boolean) => toggleLayerChecked(option, checked),
        }),
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
                {
                  size: 'small',
                  bordered: false,
                  type: 'warning',
                  class: 'structure-tree__default-tag',
                },
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
    h(NCheckbox, {
      checked: checkedPenIds.value.includes(getPenId(option.pen)),
      onClick: (e: MouseEvent) => e.stopPropagation(),
      'onUpdate:checked': (checked: boolean) => togglePenChecked(option.pen, checked),
    }),
    h(NIcon, { class: 'structure-tree__drag-icon' }, { default: () => h(Menu2) }),
    h(
      'span',
      {
        class: [
          'structure-tree__pen-label',
          (option.pen?.id === props.currentPenId || selectedPenIds.value.has(option.pen?.id)) &&
            'structure-tree__pen-label--active',
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
    selectedPensCount.value > 0
      ? h(
          NTooltip,
          { delay: 300 },
          {
            trigger: () =>
              h(
                NButton,
                {
                  text: true,
                  size: 'tiny',
                  class: 'structure-tree__migrate-btn',
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation()
                    migrateSelectedPensToLayer(layer)
                  },
                },
                { default: () => '迁入' },
              ),
            default: () => `迁移 ${selectedPensCount.value} 个已选图元到此图层`,
          },
        )
      : null,
    buildIconButton(
      Star,
      (e) => {
        e.stopPropagation()
        changeDefaultLayer(layer.uid)
      },
      layer.defaultLayer
        ? 'structure-tree__action-btn structure-tree__action-btn--active'
        : 'structure-tree__action-btn',
      '设为默认图层',
    ),
    buildIconButton(
      lockIcon,
      (e) => {
        e.stopPropagation()
        updateLayerLock(layer, !layer.locked)
      },
      undefined,
      '锁定图层',
    ),
    buildIconButton(
      visibleIcon,
      (e) => {
        e.stopPropagation()
        updateLayerVisible(layer, layer.visible === false)
      },
      undefined,
      '显示/隐藏图层',
    ),
    buildIconButton(
      Edit,
      (e) => {
        e.stopPropagation()
        openUpdateLayerModal(layer)
      },
      undefined,
      '编辑图层',
    ),
    buildIconButton(
      Copy,
      (e) => {
        e.stopPropagation()
        openCopyLayerModal(layer)
      },
      undefined,
      '复制图层',
    ),
    buildIconButton(
      MdTrash,
      (e) => {
        e.stopPropagation()
        deleteLayer(layer)
      },
      undefined,
      '删除图层',
    ),
  ])
}

function renderPenSuffix(option: StructureTreeNode) {
  if (option.type !== 'pen' || !option.pen) return null
  const pen = option.pen
  if (isCombineMemberPen(pen)) return null

  const lockIcon =
    pen.locked === LockState.None ? LockOpen : pen.locked === LockState.DisableEdit ? Lock : LockOff

  return h('div', { class: 'structure-tree__actions' }, [
    buildIconButton(
      lockIcon,
      (e) => {
        e.stopPropagation()
        emit('change-locked', pen)
      },
      undefined,
      '锁定图元',
    ),
    buildIconButton(
      isPenVisible(pen) ? Eye : EyeOff,
      (e) => {
        e.stopPropagation()
        emit('change-visible', pen)
      },
      undefined,
      '显示/隐藏图元',
    ),
    buildIconButton(
      MdTrash,
      (e) => {
        e.stopPropagation()
        emit('remove-pen', pen)
      },
      undefined,
      '删除图元',
    ),
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

function queueScrollSelectedIntoView() {
  pendingScrollToSelected.value = true
  nextTick(() => {
    scrollSelectedIntoView()
  })
}

function scrollSelectedIntoView() {
  const root = structureTreeRef.value
  const selectedNode = root?.querySelector('.n-tree-node-wrapper--selected') as HTMLElement | null
  if (!selectedNode) return
  pendingScrollToSelected.value = false
  selectedNode.scrollIntoView({
    block: 'center',
    inline: 'nearest',
    behavior: 'smooth',
  })
}

function moveItem<T>(list: T[], fromIndex: number, toIndex: number) {
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return list
  const item = list.splice(fromIndex, 1)[0]
  list.splice(toIndex, 0, item)
  return list
}

function saveDraw() {
  if (!props.drawUid) return Promise.resolve()
  cleanupMeta2dPens({ render: false })
  const data = JSON.stringify(meta2d.data())
  if (drawStore.draw?.uid === props.drawUid) {
    drawStore.draw.data = data
  }
  return MonitorDrawService.save(data, props.drawUid).then(() => {
    markDrawEditSaved(props.drawUid)
  })
}

function replacePens(nextPens: any[]) {
  const layerPensMap = buildLayerPensMap(nextPens, false)
  const layerUids = layers.value.map((layer) => layer.uid)

  layerUids.push(UNASSIGNED_LAYER_UID)
  layerPensMap.forEach((_pens, layerUid) => {
    if (!layerUids.includes(layerUid)) layerUids.push(layerUid)
  })

  const orderedPens: any[] = []
  for (let layerIndex = layerUids.length - 1; layerIndex >= 0; layerIndex -= 1) {
    const pens = layerPensMap.get(layerUids[layerIndex]) || []
    for (let penIndex = pens.length - 1; penIndex >= 0; penIndex -= 1) {
      orderedPens.push(pens[penIndex])
    }
  }
  reorderMeta2dPens(orderedPens)
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

function getPenId(pen: any) {
  return pen?.id ? String(pen.id) : ''
}

function getRuntimePen(pen: any) {
  return getRuntimeMeta2dPen(pen)
}

function isSameCombineGroup(penA: any, penB: any) {
  const parentA = getCombineParentPen(penA)
  const parentB = getCombineParentPen(penB)
  if (!parentA || !parentB) return false
  return getPenId(parentA) === getPenId(parentB)
}

async function reorderCombineChildren(
  parent: any,
  dragPens: any[],
  targetPen: any,
  dropPosition: 'before' | 'after',
) {
  const orderedChildren = getCombineChildPensForLayerTree(parent)
  const dragPenIds = new Set(dragPens.map(getPenId).filter(Boolean))
  const movingPens = orderedChildren.filter((pen) => dragPenIds.has(getPenId(pen)))
  const remainChildren = orderedChildren.filter((pen) => !dragPenIds.has(getPenId(pen)))

  const targetIndex = remainChildren.findIndex((pen) => getPenId(pen) === getPenId(targetPen))
  if (targetIndex < 0) {
    remainChildren.push(...movingPens)
  } else {
    const insertIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1
    remainChildren.splice(insertIndex, 0, ...movingPens)
  }

  reorderCombineChildPens(
    parent,
    combineTreeOrderToRenderOrder(remainChildren),
    { render: false },
  )
  meta2d.render()
  syncMovedSelection(movingPens)
  await saveDraw()
}

function getUniqueRuntimePens(pens: any[]) {
  const penMap = new Map<string, any>()
  pens.forEach((pen) => {
    const runtimePen = getRuntimePen(pen)
    const penId = getPenId(runtimePen)
    if (!penId) return
    penMap.set(penId, runtimePen)
  })
  return [...penMap.values()]
}

function getSelectedRuntimePens() {
  const checkedPens = checkedPenIds.value
    .map((penId) => getRuntimeMeta2dPen({ id: penId }))
    .filter(Boolean)
  return getUniqueRuntimePens([...(selections.pens || []), ...checkedPens])
}

function getDragPens(dragPen: any) {
  const dragPenId = getPenId(dragPen)
  const selectedPens = getSelectedRuntimePens()
  if (selectedPens.some((pen) => getPenId(pen) === dragPenId)) return selectedPens
  return getUniqueRuntimePens([dragPen])
}

function syncMovedSelection(pens: any[]) {
  const movedPens = getUniqueRuntimePens(pens)
  if (movedPens.length === 0) return
  select(movedPens)
  selects(movedPens)
  meta2d.active(movedPens)
}

async function reorderLayers(
  dragLayerUid: string,
  targetLayerUid: string,
  dropPosition: 'before' | 'after',
) {
  const fromIndex = layers.value.findIndex((item) => item.uid === dragLayerUid)
  const targetIndex = layers.value.findIndex((item) => item.uid === targetLayerUid)
  if (fromIndex < 0 || targetIndex < 0) return

  const nextLayers = [...layers.value]
  const toIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1
  moveItem(nextLayers, fromIndex, fromIndex < toIndex ? toIndex - 1 : toIndex)
  layers.value = nextLayers.map((item, index) => ({ ...item, sort: index + 1 }))
  syncCurrentLayer()

  const nextPens = rebuildPensByLayerOrder(collectValidMeta2dPens(meta2d.data().pens || []).pens)
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
  dragPens: any[],
  targetNode: StructureTreeNode,
  dropPosition: 'before' | 'inside' | 'after',
) {
  const movingPens = getUniqueRuntimePens(dragPens)
  if (movingPens.length === 0) return

  const sourcePens = collectValidMeta2dPens(meta2d.data().pens || []).pens
  const layerPensMap = buildLayerPensMap(sourcePens)
  const dragPenIds = new Set(movingPens.map(getPenId).filter(Boolean))
  const sourceLayerUids = new Set(movingPens.map(getPenLayerUid))

  layerPensMap.forEach((pens, key) => {
    layerPensMap.set(
      key,
      pens.filter((item) => !dragPenIds.has(getPenId(item))),
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
    targetPens.push(...movingPens)
  } else {
    const targetIndex = targetPens.findIndex((item) => item.id === targetNode.pen?.id)
    const insertIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1
    targetPens.splice(insertIndex, 0, ...movingPens)
  }

  const nextLayerUid = targetLayerUid === UNASSIGNED_LAYER_UID ? undefined : targetLayerUid
  movingPens.forEach((pen) => {
    pen.layerUid = nextLayerUid
    meta2d.setValue(
      {
        id: pen.id,
        layerUid: nextLayerUid,
      },
      { render: false, history: false, doEvent: false },
    )
  })

  layerPensMap.set(targetLayerUid, targetPens)
  sourceLayerUids.forEach((layerUid) => {
    if (!layerPensMap.has(layerUid)) layerPensMap.set(layerUid, [])
  })

  const orderedPens = rebuildPensFromLayerMap(layerPensMap)
  replacePens(orderedPens)
  syncMovedSelection(movingPens)
  clearCheckedPens()
  await saveDraw()
}

async function migrateSelectedPensToLayer(layer: ProjectMonitorLayer) {
  if (!layer?.uid) return
  const movingPens = getSelectedRuntimePens()
  if (movingPens.length === 0) {
    window.$message.warning('请先在画布或图层树中选择要迁移的图元')
    return
  }

  await reorderPens(
    movingPens,
    {
      key: `layer-${layer.uid}`,
      label: layer.name || '未命名图层',
      type: 'layer',
      isLeaf: false,
      layer,
    },
    'inside',
  )
  setCurrentLayer(layer)
  window.$message.success(`已迁移 ${movingPens.length} 个图元到「${layer.name || '未命名图层'}」`)
}

async function cleanInvalidPens() {
  const result = cleanupMeta2dPens()
  if (!result.changed) {
    window.$message.info('当前图层没有需要清理的无效图元')
    return
  }

  clearCheckedPens()
  emit('sorted')
  await saveDraw()
  const removedCount = result.removedIds.length
  window.$message.success(removedCount > 0 ? `已清理 ${removedCount} 个无效图元` : '已清理无效图元引用')
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
      targetNode.layer?.uid !== dragNode.layer?.uid
    )
  }

  if (dragNode.type === 'pen') {
    const dragPens = getDragPens(dragNode.pen)
    const dragPenIds = new Set(dragPens.map(getPenId).filter(Boolean))
    if (targetNode.type === 'layer') {
      return !dragPens.some((pen) => isCombineMemberPen(pen))
    }
    if (targetNode.type === 'pen' && dropPosition !== 'inside') {
      if (dragPenIds.has(getPenId(targetNode.pen))) return false
      if (isSameCombineGroup(dragNode.pen, targetNode.pen)) return true
      return !isCombineMemberPen(dragNode.pen)
    }
  }

  return false
}

async function handleDrop(info: TreeDropInfo) {
  const dragNode = info.dragNode as unknown as StructureTreeNode
  const targetNode = info.node as unknown as StructureTreeNode

  try {
    if (dragNode.type === 'layer' && targetNode.type === 'layer' && targetNode.layer?.uid) {
      const dropPosition = info.dropPosition === 'before' ? 'before' : 'after'
      await reorderLayers(dragNode.layer!.uid, targetNode.layer.uid, dropPosition)
      window.$message.success('图层顺序已更新')
      return
    }

    if (dragNode.type === 'pen' && dragNode.pen) {
      const dragPens = getDragPens(dragNode.pen)
      if (
        targetNode.type === 'pen' &&
        targetNode.pen &&
        isSameCombineGroup(dragNode.pen, targetNode.pen)
      ) {
        const parent = getCombineParentPen(dragNode.pen)
        const dropPosition = info.dropPosition === 'before' ? 'before' : 'after'
        await reorderCombineChildren(parent, dragPens, targetNode.pen, dropPosition)
        emit('sorted')
        window.$message.success('组合内图元顺序已更新')
        return
      }
      await reorderPens(dragPens, targetNode, info.dropPosition)
      if (targetNode.type === 'layer') {
        window.$message.success(`已迁移 ${dragPens.length} 个图元`)
      }
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
  } as unknown as ProjectMonitorLayerForm
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
    const copyPen = deepClone(pen) as any
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
    meta2d.setValue(
      { id: pen.id, locked: locked ? LockState.Disable : LockState.None },
      { render: false },
    )
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

  const layerUid = layer.uid
  const layerName = layer.name || '未命名图层'
  const layerPens = getLayerPens(layerUid)
  const layerPenIds = new Set(layerPens.map(getPenId).filter(Boolean))

  await MonitorLayerService.delete(layerUid)

  if (layerPens.length) {
    removeMeta2dPens(layerPens, { render: true })
    checkedPenIds.value = checkedPenIds.value.filter((id) => !layerPenIds.has(id))
    const selectedDeleted =
      (selections.pen?.id && layerPenIds.has(String(selections.pen.id))) ||
      (selections.pens || []).some((pen: any) => layerPenIds.has(getPenId(pen)))
    if (selectedDeleted) {
      meta2d.inactive()
      select()
      selects()
    }
    await saveDraw()
  }
  await loadLayers()
  layerStore.getDefaultLayer()
  emit('sorted')
  window.$message.success(
    layerPens.length
      ? `已删除图层「${layerName}」及 ${layerPens.length} 个图元`
      : `已删除图层「${layerName}」`,
  )
}
</script>

<template>
  <div ref="structureTreeRef" class="structure-tree">
    <div class="structure-tree__header">
      <div>
        <div class="structure-tree__header-title">图层</div>
        <div v-if="checkedPensCount > 0" class="structure-tree__header-desc">
          已勾选 {{ checkedPensCount }} 个图元，可点击目标图层“迁入”
        </div>
      </div>
      <div class="structure-tree__header-actions">
        <n-button
          size="small"
          quaternary
          :type="invalidPensCount > 0 ? 'warning' : 'default'"
          @click="cleanInvalidPens"
        >
          {{ invalidPensCount > 0 ? `清理 ${invalidPensCount}` : '清理' }}
        </n-button>
        <n-button v-if="checkedPensCount > 0" size="small" quaternary @click="clearCheckedPens">
          清空
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
      block-node
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

  <FormModal v-model:show="showLayerModal" title="图层信息" size="sm" height-mode="auto">
    <n-form label-placement="top">
      <n-form-item label="图层名称">
        <n-input v-model:value="layerForm.name" placeholder="请输入图层名称" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-button type="primary" @click="submitLayerForm">确定</n-button>
    </template>
  </FormModal>

  <FormModal v-model:show="showCopyModal" title="复制图层" size="sm" height-mode="auto">
    <n-form label-placement="top">
      <n-form-item label="新图层名称">
        <n-input v-model:value="layerForm.name" placeholder="请输入新图层名称" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-button type="primary" @click="onCopyLayer">确定</n-button>
    </template>
  </FormModal>
</template>

<style scoped lang="scss">
.structure-tree {
  --n-font-size: 13px;
  --n-node-font-size: 13px;
  user-select: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
}

.structure-tree__header {
  padding: 8px 9px;
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

.structure-tree__header-desc {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.45;
  color: #64748b;
}

.structure-tree__header-actions {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.structure-tree__header-actions :deep(.n-button) {
  height: 24px;
  padding: 0 7px;
  font-size: 12px;
}

:deep(.n-tree) {
  --n-font-size: 13px;
  font-size: 13px;
}

:deep(.n-tree-node-wrapper) {
  margin: 2px 0;
  border-radius: 8px;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

:deep(.n-tree-node-wrapper:hover) {
  background: #f7f9fc;
}

:deep(.n-tree-node-wrapper--selected) {
  background: rgba(32, 128, 240, 0.14);
  box-shadow: inset 0 0 0 1px rgba(32, 128, 240, 0.28);
}

:deep(.n-tree-node-content) {
  min-height: 32px;
  padding-right: 4px;
  font-size: 13px;
}

:deep(.n-tree-node-content__text) {
  min-width: 0;
  flex: 1;
}

:deep(.n-tree-node-indent) {
  width: 14px;
}

:deep(.n-tree-node-switcher) {
  width: 20px;
  color: #94a3b8;
  font-size: 13px;
}

:deep(.n-tree-node-drop-indicator) {
  height: 3px;
  border-radius: 999px;
  background-color: #2080f0;
  box-shadow: 0 0 0 2px rgba(32, 128, 240, 0.12);
}

:deep(.n-tree-node-drag-image) {
  border-radius: 8px;
}

:deep(.n-checkbox) {
  --n-size: 14px;
  --n-label-font-size: 13px;
  flex-shrink: 0;
}

:deep(.n-checkbox-box) {
  width: 14px;
  height: 14px;
}

:deep(.n-checkbox-icon) {
  font-size: 11px;
}

.structure-tree__layer-label {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 7px;
  border-radius: 6px;
  background: linear-gradient(180deg, #f9fafc 0%, #f3f6fb 100%);
}

.structure-tree__layer-prefix,
.structure-tree__pen-label-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex: 1;
}

.structure-tree__layer-meta {
  display: flex;
  align-items: center;
  gap: 5px;
}

.structure-tree__drag-icon {
  display: inline-flex;
  align-items: center;
  color: #94a3b8;
  flex-shrink: 0;
  font-size: 13px;
}

.structure-tree__label-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
}

.structure-tree__label-text--active {
  color: #1668d9;
}

.structure-tree__default-tag,
.structure-tree__count {
  flex-shrink: 0;
}

.structure-tree__default-tag :deep(.n-tag__content),
.structure-tree__count :deep(.n-tag__content) {
  font-size: 11px;
  line-height: 18px;
}

.structure-tree__pen-label-wrap {
  padding: 4px 7px;
}

.structure-tree__pen-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
  font-size: 13px;
}

.structure-tree__pen-label--active {
  color: #1668d9;
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
  width: 22px;
  height: 22px;
  padding: 0;
}

.structure-tree__action-btn :deep(.n-button__icon) {
  font-size: 13px;
}

.structure-tree__action-btn:hover {
  color: #2080f0;
}

.structure-tree__action-btn--active {
  color: #d97706;
}

.structure-tree__migrate-btn {
  height: 22px;
  padding: 0 5px;
  font-size: 12px;
}
</style>
