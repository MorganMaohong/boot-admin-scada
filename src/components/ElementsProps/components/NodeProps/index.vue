<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, toRaw, watch } from 'vue'
import { useSelection } from '@/services/selections'
import EventProps from '@/components/ElementsProps/components/EventProps/index.vue'
import DataProps from '@/components/ElementsProps/components/DataProps/index.vue'
import DataFormProps from '@/components/ElementsProps/components/DataFormProps/index.vue'
import EventFormProps from '@/components/ElementsProps/components/EventFormProps/index.vue'
import GatewayVarSelect from '@/components/ElementsProps/components/GatewayVarSelect/index.vue'
import { MdTrash } from '@vicons/ionicons4'
import { Copy, Edit } from '@vicons/carbon'
import { cloneDeep } from 'lodash'
import {
  AnimationFramesOptions,
  type DataForm,
  type EventForm,
  type NodeAnimationForm,
  PenLockedOptions,
  PresetJsKeyEnums,
  PropEnums,
  type Tags,
  TextAlignOptions,
  TextBaselineEnumOptions,
  TriggerEnum,
  ValueTypeEnum,
} from '@/components/ElementsProps/model'
import { LockState, s8 } from '@meta2d/core'
import { ColorPicker } from 'vue3-colorpicker'
import { useAppStore } from '@/stores/app'
import StructureTree from '@/components/StructureTree/index.vue'
import { useDrawStore } from '@/stores/module/draw.ts'
import {
  elementsPropsActiveTab,
  resetElementsPropsActiveTab,
} from '@/components/ElementsProps/state.ts'
import emitter from '@/utils/eventBus.ts'
import { removeMeta2dPens } from '@/utils/meta2dPens.ts'
import {
  ensureChildStateValues,
  getChildStateValues,
  getShowChildStateValue,
  resolveShowChildIndex,
} from '@/utils/statefulChildren.ts'

const { select, selections, selects } = useSelection()
const appStore = useAppStore()
const drawStore = useDrawStore()
const activeTab = elementsPropsActiveTab
const KEY = ref('')
const pen = ref<any>(null)
// 位置数据。当前版本位置需要动态计算获取
const rect = ref<any>(null)
const tabPaneRef = ref()
const maxTabPaneHeightRef = ref()
const lineDashs = [undefined, [5, 5]]
const events = ref<EventForm[]>([])
const eventFormData = ref<EventForm>({})
const datas = ref<DataForm[]>([])
const dataFormData = ref<DataForm>({})
const showUpdateData = ref(false)
const showUpdateEvent = ref(false)
const animationFormData = ref<NodeAnimationForm>({
  animateCycle: 0,
  animateInterval: 0,
  frames: [],
  keepAnimateState: false,
})
const pens = ref<any[]>([])
const AUTO_SYNC_DATA_NAME = '默认值同步'
const showChildStateValue = ref<string | number | undefined>('')
const structureTreeScrollVersion = ref(0)

onMounted(() => {
  pens.value = meta2d.data().pens || []
  emitter.on('pensSorted', handleSorted)
  getPen()
  console.log(tabPaneRef.value)
  maxTabPaneHeightRef.value = tabPaneRef.value.$el.clientHeight - 20
})

const eventNames = computed(() => {
  return events.value.map((item) => item.id)
})

const dataNames = computed(() => {
  return displayDatas.value.map((item) => item.id)
})

const displayDatas = computed(() => {
  return datas.value.filter((item: any) => isValidDataItem(item))
})

const propsContextKey = computed(() => {
  const modalUid = drawStore.globalModal?.show ? drawStore.globalModal?.draw?.uid : ''
  if (modalUid) return `modal:${modalUid}`
  return `draw:${drawStore.draw?.uid || ''}`
})

// 监听选中不同图元
const watcher = watch(() => selections.pen?.id, getPen)
const propsContextWatcher = watch(propsContextKey, (next, prev) => {
  if (!prev || next === prev) return
  resetElementsPropsActiveTab()
})

watch(
  () => appStore.targetPicker.pickedPenId,
  (pickedPenId) => {
    if (!pickedPenId) return
    if (appStore.targetPicker.sourcePenId !== pen.value.id) return
    if (!appStore.targetPicker.targetField) return
    eventFormData.value[appStore.targetPicker.targetField] = pickedPenId
    showUpdateEvent.value = true
    appStore.consumeTargetPick()
  },
)

watch(
  () => appStore.targetPicker.active,
  (active) => {
    if (active) return
    if (appStore.targetPicker.pickedPenId) return
    if (appStore.targetPicker.sourcePenId !== pen.value?.id) return
    if (!appStore.targetPicker.targetField) return
    showUpdateEvent.value = true
    appStore.consumeTargetPick()
  },
)

function getPen() {
  pen.value = selections.pen || {}
  pens.value = [...(meta2d.data().pens || [])]
  rect.value = pen.value?.id ? meta2d.getPenRect(pen.value) : null

  if (!pen.value?.id) {
    events.value = []
    datas.value = []
    showChildStateValue.value = ''
    KEY.value = s8()
    return
  }

  if (pen.value.globalAlpha == undefined) {
    pen.value.globalAlpha = 1
  }
  if (!pen.value.nickname) {
    pen.value.nickname = pen.value.name
    changePen(pen.value.nickname, 'nickname')
  }
  if (pen.value.locked === undefined || pen.value.locked === null) {
    pen.value.locked = LockState.None
    changePen(LockState.None, 'locked')
  }
  if (pen.value.defVisible === undefined || pen.value.defVisible === null) {
    pen.value.defVisible = true
    changePen(true, 'defVisible')
  }

  events.value = pen.value.events || []
  datas.value = pen.value.datas || []
  normalizeDatas()
  syncStatefulChildrenConfig(false)

  for (const key in pen.value) {
    if (animationFormData.value.hasOwnProperty(key)) {
      animationFormData.value[key] = pen.value[key]
    }
  }
  KEY.value = s8()
}

function changePen(value: any, prop: string) {
  // debugger
  const v: any = { id: pen.value.id }
  if (prop === 'dash') {
    v.lineDash = lineDashs[value]
  } else if (prop === 'showChild') {
    const resolved = resolveShowChildIndex(pen.value, value)
    if (!resolved.matched || resolved.index === undefined) {
      window.$message.error('状态值未匹配到任何子图元')
      return
    }
    v[prop] = resolved.index
    showChildStateValue.value = value
  } else {
    v[prop] = value
  }
  meta2d.setValue(v, { render: true })
}

function syncStatefulChildrenConfig(render = true) {
  if (!pen.value?.id || pen.value.showChild === undefined) {
    showChildStateValue.value = ''
    return
  }

  const { values, changed } = ensureChildStateValues(pen.value)
  pen.value.childStateValues = values
  showChildStateValue.value = getShowChildStateValue({
    ...pen.value,
    childStateValues: values,
  })

  if (!changed) return

  meta2d.setValue(
    {
      id: pen.value.id,
      childStateValues: values,
    },
    { render, history: false },
  )
}

const penStateChildren = computed(() => {
  if (!pen.value?.children || pen.value.showChild === undefined) return null
  return getChildStateValues(pen.value).map((item, index) => {
    const childPen = meta2d.findOne(item.childId)
    return {
      childId: item.childId,
      label: childPen?.title || childPen?.nickname || childPen?.name || `状态 ${index}`,
      value: item.value,
    }
  })
})

function updateChildStateValue(childId: string, value: string) {
  const nextChildStateValues = getChildStateValues(pen.value).map((item) =>
    item.childId === childId ? { ...item, value } : item,
  )

  const normalizedValue = String(value ?? '').trim()
  const duplicatedItem = nextChildStateValues.find(
    (item) => item.childId !== childId && String(item.value ?? '').trim() === normalizedValue,
  )
  if (duplicatedItem) {
    window.$message.error('子状态值不能重复，请设置不同的值')
    return
  }

  pen.value.childStateValues = nextChildStateValues

  const nextPenState = {
    ...pen.value,
    childStateValues: nextChildStateValues,
  }
  const resolved = resolveShowChildIndex(nextPenState, showChildStateValue.value)
  const patch: any = {
    id: pen.value.id,
    childStateValues: nextChildStateValues,
  }
  if (resolved.matched && resolved.index !== undefined) {
    patch.showChild = resolved.index
  }

  meta2d.setValue(patch, { render: true })
  showChildStateValue.value = getShowChildStateValue({
    ...nextPenState,
    showChild: patch.showChild ?? pen.value.showChild,
  })
}

function syncDatasToPen() {
  meta2d.setValue({ id: pen.value.id, datas: datas.value }, { render: true })
}

function normalizeDatas() {
  if (!pen.value?.id || !Array.isArray(datas.value) || datas.value.length === 0) return

  let changed = false
  const fallbackKey = pen.value.key || ''
  const fallbackName = pen.value.nickname || pen.value.name || fallbackKey

  datas.value.forEach((item: any) => {
    if (!item || typeof item !== 'object') return

    if (!item.key && fallbackKey) {
      item.key = fallbackKey
      changed = true
    }

    if (!item.name) {
      if (item.autoSync === true) {
        item.name = AUTO_SYNC_DATA_NAME
      } else if (fallbackName) {
        item.name = fallbackName
      }
      changed = true
    }
  })

  if (changed) {
    syncDatasToPen()
  }
}

function ensureAutoSyncData(varKey?: string) {
  const key = varKey || pen.value.key
  const index = datas.value.findIndex((item: any) => item?.autoSync === true)

  if (!key) {
    if (index >= 0) {
      datas.value.splice(index, 1)
      syncDatasToPen()
    }
    return
  }

  const autoSyncData: DataForm & { autoSync?: boolean } = {
    id: index >= 0 ? datas.value[index].id : '',
    key,
    name: AUTO_SYNC_DATA_NAME,
    value: '',
    autoSync: true,
    condData: [
      {
        cond: false,
        min: 0,
        max: 0,
        valueType: ValueTypeEnum.varValue,
        prop: PropEnums.value,
        propValue: undefined,
      },
    ],
  }

  if (index >= 0) {
    datas.value[index] = autoSyncData
  } else {
    autoSyncData.id = s8()
    datas.value.unshift(autoSyncData)
  }

  syncDatasToPen()
}

function renamePenByVariableName(variableName?: string) {
  const nextName = variableName?.trim()
  if (!nextName) return
  pen.value.nickname = nextName
  changePen(nextName, 'nickname')
}

function handleBindVariable(value: string) {
  pen.value.key = value
  changePen(value, 'key')
  ensureAutoSyncData(value)
}

function showUpdateEventModal(data: EventForm) {
  if (data) {
    eventFormData.value = data
  } else {
    eventFormData.value = {
      action: undefined,
      id: '',
      name: undefined,
      params: {},
      title: '',
      trigger: TriggerEnum.none,
      presetJsKey: PresetJsKeyEnums.writeVarValue,
      value: '',
      isPresetJs: true,
      where: {
        comparison: '',
        key: '',
        type: '',
        value: '',
      },
    }
  }
  showUpdateEvent.value = true
}

function startPickEventTarget(field: 'params' | 'value') {
  if (appStore.targetPicker.active) return
  appStore.startTargetPick(pen.value.id, field)
  showUpdateEvent.value = false
  window.$message.info('请在画布中选择目标图元')
}

function showCopyEventModal(data: EventForm) {
  debugger
  const rawData = toRaw(data)
  const clone = cloneDeep(rawData)
  clone.id = ''
  showUpdateEventModal(clone)
}

function addOrUpdateEvent(data: EventForm) {
  if (data.id) {
    const v: any = { id: pen.value.id }
    const index = events.value.findIndex((item) => item.id === data.id)
    if (index >= 0) {
      events.value[index] = data
      v['events'] = events.value
      meta2d.setValue(v, { render: true })
    }
  } else {
    data.id = s8()
    const v: any = { id: pen.value.id }
    events.value.push(data)
    v['events'] = events.value
    meta2d.setValue(v, { render: true })
  }
  showUpdateEvent.value = false
}

function removeEvent(idx: number) {
  const v: any = { id: pen.value.id }
  events.value.splice(idx, 1)
  v['events'] = events.value
  meta2d.setValue(v, { render: true })
}

function addOrUpdateData(data: DataForm) {
  if (data.id) {
    const v: any = { id: pen.value.id }
    const index = datas.value.findIndex((item) => item.id === data.id)
    if (index >= 0) {
      datas.value[index] = data
      v['datas'] = datas.value
      v['preferredVarKey'] = data.key || pen.value.preferredVarKey || pen.value.key
      meta2d.setValue(v, { render: true })
    }
  } else {
    data.id = s8()
    const v: any = { id: pen.value.id }
    datas.value.push(data)
    v['datas'] = datas.value
    v['preferredVarKey'] = data.key || pen.value.preferredVarKey || pen.value.key
    meta2d.setValue(v, { render: true })
  }
  pen.value.preferredVarKey = data.key || pen.value.preferredVarKey || pen.value.key
  showUpdateData.value = false
}

function removeData(idx: number) {
  const v: any = { id: pen.value.id }
  datas.value.splice(idx, 1)
  v['datas'] = datas.value
  meta2d.setValue(v, { render: true })
}

function showUpdateDataModal(data: DataForm) {
  debugger
  if (!pen.value.key) {
    window.$message.error('请先绑定变量!')
    return
  }
  if (data) {
    dataFormData.value = data
    if (!dataFormData.value.key && pen.value.key) {
      dataFormData.value.key = pen.value.key
      dataFormData.value.name = pen.value.nickname || pen.value.name || pen.value.key
    }
  } else {
    dataFormData.value = {
      id: '',
      key: pen.value.key,
      name: pen.value.nickname || pen.value.name || pen.value.key,
      value: '',
      varParams: {
        label: '',
        value: '',
      },
      condData: [
        {
          cond: true,
          max: 0,
          min: 0,
          valueType: ValueTypeEnum.customValue,
          prop: PropEnums.background,
          propValue: '#000000',
        },
      ],
    }
  }
  showUpdateData.value = true
}

function showCopyDataModal(data: DataForm) {
  const rawData = toRaw(data)
  const clone = cloneDeep(rawData)
  clone.id = ''
  showUpdateDataModal(clone)
}

function startAnimate() {
  meta2d.startAnimate(pen.value.id)
}

function pauseAnimate() {
  meta2d.pauseAnimate(pen.value.id)
}

function stopAnimate() {
  meta2d.stopAnimate(pen.value.id)
}

function changePenAnimation(v: string) {
  console.log(v)
  const frames = AnimationFramesOptions.find((item) => item.key === v)
  const p: any = { id: pen.value.id }
  if (frames) {
    p['frameKey'] = v
    p['frames'] = frames.value
    meta2d.setValue(p, { render: true })
  }
}

const penChildrenOptions = computed(() => {
  if (pen.value.children && pen.value.children.length > 0) {
    let options = []
    getChildStateValues(pen.value).forEach((item, index) => {
      const p = meta2d.findOne(item.childId)
      if (p) options.push({ label: p.title || p.nickname || p.name || index, value: item.value })
    })
    if (options.length > 0) return options
    return null
  }
  return null
})

function onCheckPen(pen) {
  const currentPen = meta2d.findOne(pen?.id) || meta2d.store.pens?.[pen?.id]
  if (!currentPen) return
  meta2d.active([currentPen])
  meta2d.render()
  select([currentPen])
}

function findPenIndex(targetPen: any) {
  return pens.value.findIndex((item: any) => item?.id === targetPen?.id)
}

function changeVisible(targetPen) {
  const index = findPenIndex(targetPen)
  const value = !(targetPen.visible === false || targetPen.visible === true
    ? targetPen.visible
    : false)
  meta2d.setValue({ id: targetPen.id, visible: value }, { render: true })
  if (index >= 0) updatePenProp(index, 'visible', value)
}

function removePen(targetPen) {
  const index = findPenIndex(targetPen)
  removeMeta2dPens([targetPen], { render: true })
  if (index >= 0) {
    pens.value.splice(index, 1)
  }
}

function changeLocked(targetPen) {
  const index = findPenIndex(targetPen)
  if (!targetPen) return
  if (targetPen.locked === LockState.None) {
    targetPen.locked = LockState.DisableEdit
    if (index >= 0) {
      pens.value[index]['locked'] = LockState.DisableEdit
      updatePenProp(index, 'locked', LockState.DisableEdit)
    }
  } else if (targetPen.locked === LockState.DisableEdit) {
    targetPen.locked = LockState.Disable
    if (index >= 0) {
      pens.value[index]['locked'] = LockState.Disable
      updatePenProp(index, 'locked', LockState.Disable)
    }
  } else if (targetPen.locked === LockState.Disable) {
    targetPen.locked = LockState.None
    if (index >= 0) updatePenProp(index, 'locked', LockState.None)
  }
  meta2d.setValue({ id: targetPen.id, locked: targetPen.locked }, { render: true })
}

function updatePenProp(index: number, key: string, value: any) {
  pens.value[index] = {
    ...pens.value[index],
    [key]: value,
  }
}

function updateTabs(key: string) {
  if (key === 'structure') {
    pens.value = meta2d.data().pens || []
    structureTreeScrollVersion.value += 1
  }
}

function isValidDataItem(item: any) {
  if (!item || typeof item !== 'object') return false
  if (item.autoSync === true) return true
  return Boolean(
    item.id || item.name || item.key || (Array.isArray(item.condData) && item.condData.length),
  )
}

function handleSorted() {
  pens.value = [...(meta2d.data().pens || [])]
}

const getPens = computed(() => {
  if (pens.value) {
    return pens.value.filter((item) => item)
  } else {
    return []
  }
})

function changeBackground(color: string) {
  pen.value.background = color
  pen.value.hoverBackground = color
  pen.value.activeBackground = color
  const { id, background, hoverBackground, hoverColor, activeBackground, activeColor } = pen.value
  meta2d.setValue(
    { id, background, hoverBackground, hoverColor, activeBackground, activeColor },
    { render: true },
  )
}

function changeTextColor(color: string) {
  pen.value.textColor = color
  pen.value.activeColor = color
  pen.value.hoverColor = color
  const { id, hoverColor, activeColor, textColor } = pen.value
  meta2d.setValue({ id, hoverColor, activeColor, textColor }, { render: true })
}

onUnmounted(() => {
  watcher()
  propsContextWatcher()
  emitter.off('pensSorted', handleSorted)
})
</script>
<template>
  <div class="element-props w-full h-full" :key="KEY">
    <n-tabs class="element-props__tabs" v-model:value="activeTab" @update:value="updateTabs">
      <n-tab-pane name="appearance" tab="外观" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar class="element-props__scroll" :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <n-form
            class="element-props__form"
            label-placement="left"
            label-width="100px"
            label-align="left"
            v-if="pen && rect"
          >
            <n-collapse class="element-props__collapse" :default-expanded-names="['1', '2', '3']">
              <n-collapse-item title="样式" name="2">
                <n-form-item label="背景颜色">
                  <color-picker
                    v-model:pureColor="pen.background"
                    @update:pureColor="changeBackground($event)"
                  />
                </n-form-item>
                <n-form-item label="文本颜色">
                  <color-picker
                    v-model:pureColor="pen.textColor"
                    @update:pureColor="changeTextColor($event)"
                  />
                </n-form-item>
                <n-form-item label="悬停背景颜色">
                  <color-picker
                    v-model:pureColor="pen.hoverBackground"
                    @update:pureColor="changePen($event, 'hoverBackground')"
                  />
                </n-form-item>
                <n-form-item label="悬停颜色">
                  <color-picker
                    v-model:pureColor="pen.hoverColor"
                    @update:pureColor="changePen($event, 'hoverColor')"
                  />
                </n-form-item>
                <n-form-item label="选中背景颜色">
                  <color-picker
                    v-model:pureColor="pen.activeBackground"
                    @update:pureColor="changePen($event, 'activeBackground')"
                  />
                </n-form-item>
                <n-form-item label="选中颜色">
                  <color-picker
                    v-model:pureColor="pen.activeColor"
                    @update:pureColor="changePen($event, 'activeColor')"
                  />
                </n-form-item>
                <n-form-item label="线条样式">
                  <n-select
                    :options="[
                      {
                        label: '实线',
                        value: 0,
                      },
                      {
                        label: '虚线',
                        value: 1,
                      },
                    ]"
                    v-model:value="pen.dash"
                    @update:value="changePen($event, 'dash')"
                  ></n-select>
                </n-form-item>
                <!--                <n-form-item label="线条渐变">
                                  <n-select
                                    :options="[
                                      {
                                        label: '无',
                                        value: 0
                                      },
                                      {
                                        label: '线性渐变',
                                        value: 1
                                      },
                                      {
                                        label: '发散渐变',
                                        value: 1
                                      },
                                    ]"
                                    v-model:value="pen.strokeType"
                                    @update:value="changePen($event, 'dash')"
                                  ></n-select>
                                </n-form-item>-->
                <n-form-item label="边框颜色">
                  <color-picker
                    v-model:pureColor="pen.color"
                    @update:pureColor="changePen($event, 'color')"
                  />
                </n-form-item>
                <n-form-item label="线条宽度">
                  <n-input-number
                    v-model:value="pen.borderWidth"
                    @update:value="changePen($event, 'lineWidth')"
                    min="0"
                  />
                </n-form-item>
                <n-form-item label="默认显示">
                  <n-switch
                    v-model:value="pen.defVisible"
                    @update:value="changePen($event, 'defVisible')"
                  />
                </n-form-item>
              </n-collapse-item>
              <n-collapse-item title="文字" name="3">
                <n-input
                  type="textarea"
                  v-model:value="pen.text"
                  @update:value="changePen($event, 'text')"
                  class="mb-[12px]"
                />
                <n-form-item label="文字大小">
                  <n-input-number
                    v-model:value="pen.fontSize"
                    @update:value="changePen($event, 'fontSize')"
                    min="0"
                  />
                </n-form-item>
                <n-form-item label="水平对齐">
                  <n-select
                    :options="TextAlignOptions"
                    @update:value="changePen($event, 'textAlign')"
                  />
                </n-form-item>
                <n-form-item label="垂直对齐">
                  <n-select
                    :options="TextBaselineEnumOptions"
                    @update:value="changePen($event, 'textBaseline')"
                  />
                </n-form-item>
              </n-collapse-item>
              <n-collapse-item title="位置和大小" name="1">
                <n-form-item label="宽">
                  <n-input-number
                    v-model:value="rect.width"
                    @update:value="changePen($event, 'width')"
                  />
                </n-form-item>
                <n-form-item label="高">
                  <n-input-number
                    v-model:value="rect.height"
                    @update:value="changePen($event, 'height')"
                  />
                </n-form-item>
                <n-form-item label="X">
                  <n-input-number v-model:value="rect.x" @update:value="changePen($event, 'x')" />
                </n-form-item>
                <n-form-item label="Y">
                  <n-input-number v-model:value="rect.y" @update:value="changePen($event, 'y')" />
                </n-form-item>
                <n-form-item label="锁定宽高比">
                  <n-switch v-model:value="pen.ratio" @update:value="changePen($event, 'ratio')" />
                </n-form-item>
                <n-form-item label="锁定图片宽高比">
                  <n-switch
                    v-model:value="pen.imageRatio"
                    @update:value="changePen($event, 'imageRatio')"
                  />
                </n-form-item>
                <n-form-item label="锁定状态">
                  <n-select
                    :options="PenLockedOptions"
                    v-model:value="pen.locked"
                    @update:value="changePen($event, 'locked')"
                  />
                </n-form-item>
                <n-form-item label="圆角">
                  <n-input-number
                    v-model:value="pen.borderRadius"
                    @update:value="changePen($event, 'borderRadius')"
                  />
                </n-form-item>
                <n-form-item label="旋转">
                  <n-input-number
                    v-model:value="pen.rotate"
                    @update:value="changePen($event, 'rotate')"
                  />
                </n-form-item>
                <n-form-item label="内边距-左">
                  <n-input-number
                    v-model:value="pen.paddingLeft"
                    @update:value="changePen($event, 'paddingLeft')"
                    min="0"
                  />
                </n-form-item>
                <n-form-item label="内边距-右">
                  <n-input-number
                    v-model:value="pen.paddingRight"
                    @update:value="changePen($event, 'paddingRight')"
                    min="0"
                  />
                </n-form-item>
                <n-form-item label="内边距-上">
                  <n-input-number
                    v-model:value="pen.paddingTop"
                    @update:value="changePen($event, 'paddingTop')"
                    min="0"
                  />
                </n-form-item>
                <n-form-item label="内边距-下">
                  <n-input-number
                    v-model:value="pen.paddingBottom"
                    @update:value="changePen($event, 'paddingBottom')"
                    min="0"
                  />
                </n-form-item>
                <n-form-item label="进度">
                  <n-input-number
                    v-model:value="pen.progress"
                    @update:value="changePen($event, 'progress')"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                </n-form-item>
                <n-form-item label="进度颜色">
                  <color-picker
                    v-model:pureColor="pen.progressColor"
                    @update:pureColor="changePen($event, 'progressColor')"
                  />
                </n-form-item>
                <n-form-item label="垂直进度">
                  <n-switch
                    v-model:value="pen.verticalProgress"
                    @update:value="changePen($event, 'verticalProgress')"
                  />
                </n-form-item>
                <n-form-item label="反向进度">
                  <n-switch
                    v-model:value="pen.reverseProgress"
                    @update:value="changePen($event, 'reverseProgress')"
                  />
                </n-form-item>
                <n-form-item label="水平翻转">
                  <n-switch v-model:value="pen.flipX" @update:value="changePen($event, 'flipX')" />
                </n-form-item>
                <n-form-item label="垂直翻转">
                  <n-switch v-model:value="pen.flipY" @update:value="changePen($event, 'flipY')" />
                </n-form-item>
                <n-form-item label="输入框">
                  <n-switch v-model:value="pen.input" @update:value="changePen($event, 'input')" />
                </n-form-item>
                <n-form-item label="状态值" v-if="penChildrenOptions">
                  <n-select
                    :options="penChildrenOptions"
                    v-model:value="showChildStateValue"
                    @update:value="changePen($event, 'showChild')"
                  />
                </n-form-item>
                <n-form-item
                  label="子状态配置"
                  v-if="penStateChildren && penStateChildren.length > 0"
                  label-placement="top"
                >
                  <div class="state-child-config">
                    <div
                      v-for="item in penStateChildren"
                      :key="item.childId"
                      class="state-child-config__row"
                    >
                      <n-text class="state-child-config__label">{{ item.label }}</n-text>
                      <n-input
                        :value="String(item.value ?? '')"
                        placeholder="请输入状态值"
                        @update:value="updateChildStateValue(item.childId, $event)"
                      />
                    </div>
                  </div>
                </n-form-item>
              </n-collapse-item>
            </n-collapse>
          </n-form>
        </n-scrollbar>
      </n-tab-pane>
      <n-tab-pane name="event" tab="事件" ref="tabPaneRef" class="w-full h-full">
        <n-scrollbar class="element-props__scroll p-2 right-0" :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <n-form
            class="element-props__form"
            v-if="pen?.id"
            label-placement="left"
            label-width="100px"
            label-align="left"
          >
            <n-form-item label="ID">
              <n-text>{{ pen.id }}</n-text>
            </n-form-item>
            <n-form-item label="名称">
              <n-input v-model:value="pen.nickname" @update:value="changePen($event, 'nickname')" />
            </n-form-item>
            <n-form-item label="绑定变量" label-placement="top">
              <GatewayVarSelect
                :model-value="pen.key"
                :model-name="pen.nickname"
                @update:model-value="handleBindVariable"
                @update:model-name="renamePenByVariableName"
              />
            </n-form-item>
            <n-text depth="3" class="text-xs">
              选择变量后会自动同步到当前图元的 value，事件可直接使用
            </n-text>
          </n-form>
          <div class="flex w-full">
            <n-button class="flex-1" type="primary" @click="showUpdateEventModal(null)">
              添加事件
            </n-button>
          </div>
          <n-divider />
          <n-collapse class="element-props__collapse" :default-expanded-names="eventNames">
            <n-collapse-item
              v-for="(item, index) in events"
              :title="`事件 ${index + 1}`"
              :name="item.id"
            >
              <template #header-extra>
                <div class="flex w-full gap-2">
                  <n-button text @click.stop="showUpdateEventModal(item)">
                    <template #icon>
                      <Edit />
                    </template>
                  </n-button>
                  <n-button text @click.stop="showCopyEventModal(item)">
                    <template #icon>
                      <Copy />
                    </template>
                  </n-button>
                  <n-button text type="error" @click="removeEvent(index)">
                    <template #icon>
                      <MdTrash />
                    </template>
                  </n-button>
                </div>
              </template>
              <EventProps :value="item" />
            </n-collapse-item>
          </n-collapse>
        </n-scrollbar>
      </n-tab-pane>
      <n-tab-pane name="effect" tab="动画">
        <n-form class="element-props__form" label-placement="left" label-width="auto">
          <n-form-item label="动画效果">
            <n-select
              :options="AnimationFramesOptions"
              value-field="key"
              v-model:value="pen.framesKey"
              @update:value="changePenAnimation"
            />
          </n-form-item>
          <n-form-item label="循环次数">
            <n-input
              placeholder="默认无限循环"
              v-model:value="pen.animateCycle"
              @update:value="changePen($event, 'animateCycle')"
            />
          </n-form-item>
          <n-form-item label="下个动画">
            <n-input />
          </n-form-item>
          <n-form-item label="自动播放">
            <n-switch v-model:value="pen.autoPlay" @update:value="changePen($event, 'autoPlay')" />
          </n-form-item>
          <n-form-item label="保持动画状态">
            <n-switch
              v-model:value="pen.keepAnimateState"
              @update:value="changePen($event, 'keepAnimateState')"
            />
          </n-form-item>
          <div class="flex w-full justify-center gap-2">
            <n-button class="flex-1" type="info" @click="startAnimate">播放</n-button>
            <n-button class="flex-1" type="info" @click="pauseAnimate">暂停</n-button>
            <n-button class="flex-1" type="info" @click="stopAnimate">停止</n-button>
          </div>
        </n-form>
      </n-tab-pane>
      <n-tab-pane name="data" tab="数据" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar class="element-props__scroll p-2 right-0" :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <n-form
            class="element-props__form"
            v-if="pen?.id"
            label-placement="left"
            label-width="100px"
            label-align="left"
          >
            <n-form-item label="ID">
              <n-text>{{ pen.id }}</n-text>
            </n-form-item>
            <n-form-item label="名称">
              <n-input v-model:value="pen.nickname" @update:value="changePen($event, 'nickname')" />
            </n-form-item>
            <n-form-item label="绑定变量" label-placement="top">
              <GatewayVarSelect
                :model-value="pen.key"
                :model-name="pen.nickname"
                @update:model-value="handleBindVariable"
                @update:model-name="renamePenByVariableName"
              />
            </n-form-item>
            <n-text depth="3" class="text-xs">
              已默认同步变量值到图元 value，只有复杂映射时再添加数据
            </n-text>
          </n-form>
          <div class="w-full flex mb-4 mt-4">
            <n-button class="flex-1" type="primary" @click="showUpdateDataModal(null)">
              添加数据
            </n-button>
          </div>
          <n-collapse class="element-props__collapse" :default-expanded-names="dataNames">
            <n-collapse-item
              :title="`数据 ${index + 1}`"
              v-for="(item, index) in displayDatas"
              :name="item.id"
            >
              <template #header-extra>
                <div class="flex w-full gap-2">
                  <n-button text @click.stop="showUpdateDataModal(item)">
                    <template #icon>
                      <Edit />
                    </template>
                  </n-button>
                  <n-button text @click.stop="showCopyDataModal(item)">
                    <template #icon>
                      <Copy />
                    </template>
                  </n-button>
                  <n-button text @click.stop="removeData(index)">
                    <template #icon>
                      <MdTrash />
                    </template>
                  </n-button>
                </div>
              </template>
              <DataProps :value="item" />
            </n-collapse-item>
          </n-collapse>
        </n-scrollbar>
      </n-tab-pane>
      <n-tab-pane name="structure" tab="图层" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar
          class="structure-tree-tab-scrollbar element-props__scroll"
          :style="{ maxHeight: `${maxTabPaneHeightRef}px` }"
        >
          <StructureTree
            :draw-uid="drawStore.draw.uid"
            :pens="getPens"
            :current-pen-id="pen?.id || ''"
            :scroll-to-selection-version="structureTreeScrollVersion"
            @select-pen="onCheckPen"
            @change-visible="changeVisible"
            @change-locked="changeLocked"
            @remove-pen="removePen"
            @sorted="handleSorted"
          />
        </n-scrollbar>
      </n-tab-pane>
    </n-tabs>
  </div>
  <n-modal
    v-model:show="showUpdateData"
    preset="card"
    :title="dataFormData.id ? '编辑动作' : '新增动作'"
    style="width: 1000px"
    :mask-closable="false"
  >
    <DataFormProps :value="dataFormData" @update:value="addOrUpdateData" />
  </n-modal>

  <n-modal
    v-model:show="showUpdateEvent"
    preset="card"
    :title="eventFormData.id ? '编辑事件' : '新增事件'"
    style="width: 800px"
    :mask-closable="false"
  >
    <EventFormProps
      :value="eventFormData"
      @update:value="addOrUpdateEvent"
      @pick-target="startPickEventTarget"
    />
  </n-modal>
</template>

<style lang="scss" scoped>
.element-props {
  height: 100%;
}

::v-deep(.element-props__tabs.n-tabs) {
  height: 100%;
}

::v-deep(.element-props__tabs .n-tabs-nav) {
  padding: 0 14px;
}

::v-deep(.element-props__tabs .n-tabs-nav-scroll-wrapper) {
  border-bottom: 1px solid #eef2f7;
}

::v-deep(.element-props__tabs .n-tabs-tab) {
  padding-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}

::v-deep(.element-props__tabs .n-tab-pane) {
  padding-top: 8px;
}

::v-deep(.n-tabs-tab-pad) {
  width: 26px;
}

.element-props__scroll {
  padding: 0 10px 18px;
}

::v-deep(.element-props__scroll .n-scrollbar-content) {
  padding-bottom: 18px;
}

.state-child-config {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.state-child-config__row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.state-child-config__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

::v-deep(.element-props__form .n-form-item) {
  padding: 10px 0;
  margin-bottom: 0;
  border-bottom: 1px solid #eef2f7;
}

::v-deep(.element-props__form .n-form-item:last-child) {
  border-bottom: 0;
}

::v-deep(.element-props__form .n-form-item-label) {
  font-weight: 500;
  color: #334155;
}

::v-deep(.element-props__collapse .n-collapse-item) {
  border-bottom: 1px solid #eef2f7;
}

::v-deep(.element-props__collapse .n-collapse-item__header) {
  min-height: 42px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

::v-deep(.element-props__collapse .n-collapse-item__content-inner) {
  padding-top: 2px;
  padding-bottom: 10px;
}

::v-deep(.structure-tree-tab-scrollbar .n-scrollbar-content) {
  padding-right: 4px;
  padding-bottom: 18px;
}

::v-deep(
  .n-scrollbar > .n-scrollbar-rail.n-scrollbar-rail--vertical--right,
  .n-scrollbar + .n-scrollbar-rail.n-scrollbar-rail--vertical--right
) {
  right: 0 !important;
}

::v-deep(
  .n-collapse .n-collapse-item .n-collapse-item__content-wrapper .n-collapse-item__content-inner
) {
  padding-left: 20px !important;
}
</style>
