<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, toRaw, watch } from 'vue'
import { useSelection } from '@/services/selections.ts'
import {
  type DataForm,
  type EventForm,
  getOptionsKeyValue,
  type LineAnimationForm,
  LineAnimationOptions,
  LineDashOptions,
  LineGradientEnums,
  LineGradientOptions,
  PresetJsKeyEnums,
  PropEnums,
  TriggerEnum,
  ValueTypeEnum,
} from '@/components/ElementsProps/model'
import { ColorPicker } from 'vue3-colorpicker'
import { Copy, Edit } from '@vicons/carbon'
import DataProps from '@/components/ElementsProps/components/DataProps/index.vue'
import { MdTrash } from '@vicons/ionicons4'
import { LockState, s8 } from '@meta2d/core'
import DataFormProps from '@/components/ElementsProps/components/DataFormProps/index.vue'
import EventFormProps from '@/components/ElementsProps/components/EventFormProps/index.vue'
import EventProps from '@/components/ElementsProps/components/EventProps/index.vue'
import GatewayVarSelect from '@/components/ElementsProps/components/GatewayVarSelect/index.vue'
import { cloneDeep } from 'lodash'
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
  syncDatasWithPenBinding,
  syncEventsWithPenBinding,
} from '@/components/ElementsProps/penBindingSync.ts'

const { select, selections, selects } = useSelection()
const appStore = useAppStore()
const drawStore = useDrawStore()
const activeTab = elementsPropsActiveTab
const KEY = ref('')
const pen = ref<any>({})
// 位置数据。当前版本位置需要动态计算获取
const rect = ref<any>({})
const tabPaneRef = ref()
const maxTabPaneHeightRef = ref()
const events = ref<EventForm[]>([])
const eventFormData = ref<EventForm>({})
const datas = ref<DataForm[]>([])
const dataFormData = ref<DataForm>({})
const showUpdateData = ref(false)
const showUpdateEvent = ref(false)
const animationFormData = ref<LineAnimationForm>({
  animateCycle: 0,
  animateInterval: 0,
  frames: [],
  keepAnimateState: false,
})
const pens = ref<any[]>([])
const tags = ref([])
const AUTO_SYNC_DATA_NAME = '默认值同步'
const structureTreeScrollVersion = ref(0)
const COPY_SOURCE_ID_KEY = '__copySourcePenId'
onMounted(() => {
  pens.value = meta2d.data().pens || []
  emitter.on('pensSorted', handleSorted)
  getPen()
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
  if (!pen.value?.id) {
    rect.value = null
    events.value = []
    datas.value = []
    KEY.value = s8()
    return
  }
  if (pen.value.globalAlpha == undefined) {
    pen.value.globalAlpha = 1
  }
  rect.value = meta2d.getPenRect(pen.value)
  if (!pen.value.lineGradientKey) {
    pen.value.lineGradientKey = LineGradientEnums.none
  }
  if (!pen.value.animateSpan) {
    pen.value.animateSpan = 1
    changePen(pen.value.animateSpan, 'animateSpan')
  }
  if (pen.value.locked === undefined || pen.value.locked === null) {
    pen.value.locked = LockState.None
    changePen(LockState.None, 'locked')
  }
  if (!pen.value.nickname) {
    pen.value.nickname = pen.value.name
    changePen(pen.value.nickname, 'nickname')
  }
  if (pen.value.visible === undefined || pen.value.visible === null) {
    pen.value.visible = true
    changePen(true, 'visible')
  }
  if (pen.value.defVisible === undefined || pen.value.defVisible === null) {
    pen.value.defVisible = true
    changePen(true, 'defVisible')
  }
  events.value = pen.value.events || []
  datas.value = pen.value.datas || []
  const sourcePenId = pen.value?.[COPY_SOURCE_ID_KEY] ? String(pen.value[COPY_SOURCE_ID_KEY]) : ''
  const eventsChanged = syncEventsWithPenBinding(events.value, {
    penId: pen.value.id,
    varKey: pen.value.preferredVarKey || pen.value.key || '',
    forceVarKey: false,
    sourcePenId,
  })
  normalizeDatas()
  if (eventsChanged) {
    meta2d.setValue({ id: pen.value.id, events: events.value }, { render: true })
  }

  for (const key in pen.value) {
    if (animationFormData.value.hasOwnProperty(key)) {
      animationFormData.value[key] = pen.value[key]
    }
  }
  KEY.value = s8()
}

function changePen(value: any, prop: string) {
  const v: any = { id: pen.value.id }
  if (prop === 'lineGradientKey') {
    v['color'] = '#000000'
  }
  if (prop === 'lineGradientColors') {
    v['strokeType'] = 1
  }
  v[prop] = value
  meta2d.setValue(v, { render: true })
}

function syncDatasToPen() {
  meta2d.setValue({ id: pen.value.id, datas: datas.value }, { render: true })
}

function normalizeDatas() {
  if (!pen.value?.id || !Array.isArray(datas.value) || datas.value.length === 0) return

  const fallbackKey = pen.value.key || ''
  const fallbackName = pen.value.nickname || pen.value.name || fallbackKey
  const changed = syncDatasWithPenBinding(datas.value as any, {
    varKey: fallbackKey,
    autoSyncName: AUTO_SYNC_DATA_NAME,
    fallbackName,
    forceVarKey: false,
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
  pen.value.preferredVarKey = value || ''
  changePen(pen.value.preferredVarKey, 'preferredVarKey')
  ensureAutoSyncData(value)
  const nextName = pen.value.nickname || pen.value.name || value
  const eventsChanged = syncEventsWithPenBinding(events.value, {
    penId: pen.value.id,
    varKey: value,
    forceVarKey: true,
  })
  const datasChanged = syncDatasWithPenBinding(datas.value as any, {
    varKey: value,
    autoSyncName: AUTO_SYNC_DATA_NAME,
    fallbackName: nextName,
    forceVarKey: true,
  })

  if (eventsChanged || datasChanged) {
    meta2d.setValue(
      {
        id: pen.value.id,
        events: events.value,
        datas: datas.value,
        preferredVarKey: pen.value.preferredVarKey,
      },
      { render: true },
    )
  }
}

function changeLineDash(k: string) {
  const v: any = { id: pen.value.id }
  v['lineDashKey'] = k
  v['lineDash'] = getOptionsKeyValue(LineDashOptions, k)
  meta2d.setValue(v, { render: true })
}

function changeLineGradientKey(k: string) {
  const v: any = { id: pen.value.id }
  v['lineGradientKey'] = k
  if (k === LineGradientEnums.none) {
    v['lineGradientColors'] = ''
    v['strokeType'] = 0
  } else if (k === LineGradientEnums.gradient) {
    v['color'] = '#000000'
  } else {
    return
  }
  meta2d.setValue(v, { render: true })
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
  // console.log("sss")
  // debugger
  if (!pen.value.key) {
    window.$message.error('请先绑定变量!')
    return
  }
  if (data) {
    dataFormData.value = data
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
      condData: [{ min: 0, max: 1, prop: PropEnums.background, propValue: '#000000' }],
    }
  }
  showUpdateData.value = true
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

function showCopyEventModal(data: EventForm) {
  const rawData = toRaw(data)
  const clone = cloneDeep(rawData)
  clone.id = ''
  showUpdateEventModal(clone)
}

function removeEvent(idx: number) {
  const v: any = { id: pen.value.id }
  events.value.splice(idx, 1)
  v['events'] = events.value
  meta2d.setValue(v, { render: true })
}

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

function handleSorted() {
  pens.value = [...(meta2d.data().pens || [])]
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

const getPens = computed(() => {
  if (pens.value) {
    return pens.value.filter((item) => item)
  } else {
    return []
  }
})

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
          <n-collapse class="element-props__collapse" :expanded-names="['layout']">
            <n-collapse-item title="样式" name="layout">
              <n-form class="element-props__form" label-placement="left" label-width="120px" label-align="left">
                <n-form-item label="线条样式">
                  <n-select
                    :options="LineDashOptions"
                    v-model:value="pen.lineDashKey"
                    value-field="key"
                    @update:value="changeLineDash"
                  />
                </n-form-item>
                <!--                <n-form-item label="平滑度"></n-form-item>-->
                <n-form-item label="线条渐变">
                  <n-select
                    :options="LineGradientOptions"
                    v-model:value="pen.lineGradientKey"
                    @update:value="changeLineGradientKey"
                  />
                </n-form-item>
                <n-form-item label="颜色" v-if="pen.lineGradientKey === LineGradientEnums.none">
                  <color-picker
                    v-model:pureColor="pen.color"
                    @update:pureColor="changePen($event, 'color')"
                  />
                </n-form-item>
                <n-form-item
                  label="渐变颜色"
                  v-else-if="pen.lineGradientKey === LineGradientEnums.gradient"
                >
                  <color-picker
                    v-model:gradientColor="pen.lineGradientColors"
                    use-type="gradient"
                    shape="circle"
                    format="rgb"
                    @update:gradientColor="changePen($event, 'lineGradientColors')"
                  />
                </n-form-item>
                <!--                <n-form-item label="浮动颜色"></n-form-item>-->
                <!--                <n-form-item label="选中颜色"></n-form-item>-->
                <n-form-item label="线条宽度">
                  <n-input-number
                    v-model:value="pen.borderWidth"
                    @update:value="changePen($event, 'borderWidth')"
                    min="1"
                  />
                </n-form-item>
                <!--                <n-form-item label="边框颜色"></n-form-item>-->
                <!--                <n-form-item label="边框宽度"></n-form-item>-->
                <!--                <n-form-item label="背景"></n-form-item>-->
                <!--                <n-form-item label="背景颜色"></n-form-item>-->
                <!--                <n-form-item label="浮动背景颜色"></n-form-item>-->
                <!--                <n-form-item label="选中背景颜色"></n-form-item>-->
                <!--                <n-form-item label="透明度"></n-form-item>-->
                <!--                <n-form-item label="锚点颜色"></n-form-item>-->
                <n-form-item label="锚点半径">
                  <n-input-number
                    v-model:value="pen.anchorRadius"
                    @update:value="changePen($event, 'anchorRadius')"
                    min="1"
                  />
                </n-form-item>
                <n-form-item label="默认显示">
                  <n-switch
                    v-model:value="pen.defVisible"
                    @update:value="changePen($event, 'defVisible')"
                  />
                </n-form-item>
                <!--                <n-form-item label="阴影颜色"></n-form-item>-->
                <!--                <n-form-item label="阴影模糊"></n-form-item>-->
                <!--                <n-form-item label="阴影X偏移"></n-form-item>-->
                <!--                <n-form-item label="阴影Y偏移"></n-form-item>-->
                <!--                <n-form-item label="文字阴影"></n-form-item>-->
                <!--                <n-form-item label="滤镜"></n-form-item>-->
                <!--                <n-form-item label="控制点1X"></n-form-item>-->
                <!--                <n-form-item label="控制点1Y"></n-form-item>-->
              </n-form>
            </n-collapse-item>
          </n-collapse>
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
      <n-tab-pane name="effect" tab="动画" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar class="element-props__scroll" :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
          <n-form class="element-props__form" label-align="left" label-width="100px" label-placement="left">
            <n-form-item label="动画效果">
              <n-select
                v-model:value="pen.lineAnimateType"
                :options="LineAnimationOptions"
                @update:value="changePen($event, 'lineAnimateType')"
              />
            </n-form-item>
            <n-form-item label="动画线宽">
              <n-input-number
                v-model:value="pen.lineWidth"
                @update:value="changePen($event, 'lineWidth')"
              />
            </n-form-item>
            <n-form-item label="动画颜色">
              <color-picker
                v-model:pureColor="pen.animateColor"
                @update:pureColor="changePen($event, 'animateColor')"
              />
            </n-form-item>
            <n-form-item label="动画发光">
              <n-switch />
            </n-form-item>
            <n-form-item label="动画速度">
              <n-input-number
                v-model:value="pen.animateSpan"
                @update:value="changePen($event, 'animateSpan')"
                :show-button="false"
                min="0"
                max="5"
              />
            </n-form-item>
            <n-form-item label="反向流动">
              <n-switch
                v-model:value="pen.animateReverse"
                @update:value="changePen($event, 'animateReverse')"
              />
            </n-form-item>
            <n-form-item label="循环次数">
              <n-input
                placeholder="默认无限循环"
                v-model:value="pen.animateCycle"
                @update:value="changePen($event, 'animateCycle')"
              />
            </n-form-item>
            <n-form-item label="下个动画"></n-form-item>
            <n-form-item label="自动播放">
              <n-switch
                v-model:value="pen.autoPlay"
                @update:value="changePen($event, 'autoPlay')"
              />
            </n-form-item>
            <n-form-item label="保持动画状态">
              <n-switch
                v-model:value="pen.keepAnimateState"
                @update:value="changePen($event, 'keepAnimateState')"
              />
            </n-form-item>
            <n-form-item label="线性播放">
              <n-switch v-model:value="pen.linear" @update:value="changePen($event, 'linear')" />
            </n-form-item>
            <div class="flex gap-2 justify-center">
              <n-button class="flex-1" type="info" @click="startAnimate">播放</n-button>
              <n-button class="flex-1" type="info" @click="pauseAnimate">暂停</n-button>
              <n-button class="flex-1" type="info" @click="stopAnimate">停止</n-button>
            </div>
          </n-form>
        </n-scrollbar>
      </n-tab-pane>
      <n-tab-pane name="data" tab="数据" class="w-full h-full" ref="tabPaneRef">
        <n-scrollbar class="element-props__scroll" :style="{ maxHeight: `${maxTabPaneHeightRef}px` }">
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
          <div class="w-full flex mb-4">
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
                <div class="flex gap-2">
                  <n-button text @click.stop="showUpdateDataModal(item)">
                    <template #icon>
                      <Edit />
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
