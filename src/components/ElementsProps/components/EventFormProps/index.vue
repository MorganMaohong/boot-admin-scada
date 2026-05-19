<script lang="ts" setup>
import { ref, watch } from 'vue'
import {
  ComparisonOptions,
  EventActionEnums,
  EventActionOptions,
  type EventForm,
  EventNameOptions,
  GlobalFnEnums,
  GlobalFnOptions,
  LinkOpenOptions,
  PresetJsOptions,
  PresetJsPropOptions,
  PropEnums,
  PropOptions,
  type SetPropsItem,
  TriggerComparisonPropOptions,
  TriggerEnum,
  TriggerOptions,
  ValueTypeEnum,
} from '@/components/ElementsProps/model'
import type { FormInst } from 'naive-ui'
import { AddAlt } from '@vicons/carbon'
import { RemoveCircleOutline } from '@vicons/ionicons5'
import GatewayVarSelect from '@/components/ElementsProps/components/GatewayVarSelect/index.vue'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { getUrlParams } from '@/utils'
import type { OptionVo } from '@/model'
import EventJsForm from '@/components/ElementsProps/components/EventFormProps/components/EventJsForm.vue'
import EventGlobalFnForm from '@/components/ElementsProps/components/EventFormProps/components/EventGlobalFnForm.vue'
import EventLinkForm from '@/components/ElementsProps/components/EventFormProps/components/EventLinkForm.vue'
import { ColorPicker } from 'vue3-colorpicker'
import { useSelection } from '@/services/selections.ts'

const { selections } = useSelection()
const props = defineProps<{
  value: EventForm
}>()
const emit = defineEmits(['update:value', 'pick-target'])

const formRules = {
  title: {
    required: true,
    message: '请输入名称',
    trigger: ['blur'],
  },
  name: {
    required: true,
    message: '请选择事件类型',
    trigger: ['change'],
  },
  action: {
    required: true,
    type: 'number',
    message: '请选择事件行为',
    trigger: ['change'],
  },
}
const formRef = ref<FormInst>()
const eventFormData = ref<EventForm>({})
const setPropsArray = ref<SetPropsItem[]>([])
const penOptions = ref<OptionVo[]>([])
const pen = ref({})

watch(
  () => props.value,
  () => {
    syncFormState()
  },
  { immediate: true },
)

function syncFormState() {
  eventFormData.value = props.value || ({} as EventForm)
  pen.value = selections.pen || {}
  normalizeWhereKey()
  loadValue()
}

function getCurrentPenId() {
  return selections.pen?.id || ''
}

function shouldUsePenOptions(action?: number) {
  return (
    action === EventActionEnums.SetProps ||
    action === EventActionEnums.StartAnimate ||
    action === EventActionEnums.PauseAnimate ||
    action === EventActionEnums.StopAnimate
  )
}

function normalizeWhereKey() {
  if (eventFormData.value?.where?.key === 'realtimeValue') {
    eventFormData.value.where.key = PropEnums.value
  }
}

function loadValue() {
  if (shouldUsePenOptions(eventFormData.value.action)) {
    getPenOptions()
  } else {
    penOptions.value = []
  }

  switch (eventFormData.value.action) {
    case EventActionEnums.SetProps:
      setPropsArray.value = Object.entries(eventFormData.value.value || {}).map(([key, value]) => ({
        key,
        value,
      }))
      if (!eventFormData.value.params) {
        eventFormData.value.params = getCurrentPenId()
      }
      break
    case EventActionEnums.StartAnimate:
    case EventActionEnums.PauseAnimate:
    case EventActionEnums.StopAnimate:
      if (!eventFormData.value.value) {
        eventFormData.value.value = getCurrentPenId()
      }
      setPropsArray.value = []
      break
    default:
      setPropsArray.value = []
      break
  }
}

function setValue() {
  switch (eventFormData.value.action) {
    case EventActionEnums.SetProps:
      eventFormData.value.value = setPropsArray.value.reduce(
        (acc, item) => {
          if (item.key !== undefined && item.key !== null && item.key !== '') {
            acc[item.key] = item.value
          }
          return acc
        },
        {} as Record<string, any>,
      )
      if (!eventFormData.value.params) {
        eventFormData.value.params = getCurrentPenId()
      }
      break
    case EventActionEnums.StartAnimate:
    case EventActionEnums.PauseAnimate:
    case EventActionEnums.StopAnimate:
      if (!eventFormData.value.value) {
        eventFormData.value.value = getCurrentPenId()
      }
      break
  }
}

function getPenOptions() {
  penOptions.value = []
  Object.keys(meta2d.store.pens || {}).forEach((key) => {
    const p = meta2d.store.pens[key]
    if (p)
      penOptions.value.push({
        label: p.nickname ? `${p.nickname} - ${p.id}` : `${p.name} - ${p.id}`,
        value: p.id,
      })
  })
}

function updateSelectActionValue(v: number) {
  penOptions.value = []
  switch (v) {
    case EventActionEnums.Link:
      eventFormData.value.params = null
      eventFormData.value.value = null
      break
    case EventActionEnums.SetProps:
      eventFormData.value.params = null
      eventFormData.value.value = null
      getPenOptions()
      eventFormData.value.params = getCurrentPenId()
      break
    case EventActionEnums.StartAnimate:
    case EventActionEnums.PauseAnimate:
    case EventActionEnums.StopAnimate:
      eventFormData.value.params = null
      eventFormData.value.value = null
      getPenOptions()
      eventFormData.value.value = getCurrentPenId()
      break
    case EventActionEnums.JS:
      break
    case EventActionEnums.GlobalFn:
      eventFormData.value.params = {}
      eventFormData.value.value = null
      break
  }
}

function pickTarget(field: 'params' | 'value') {
  emit('pick-target', field)
}

function getPenLabel(id: string) {
  const target = penOptions.value.find((item) => item.value === id)
  return target ? target.label : id || '未选择'
}

function updateValue() {
  formRef.value?.validate((valid) => {
    if (valid) return
    normalizeWhereKey()
    setValue()
    emit('update:value', eventFormData.value)
  })
}

function addSetProp() {
  const item: SetPropsItem = {
    key: PropEnums.text,
    value: undefined,
  }
  setPropsArray.value.push(item)
}

function removeSetProp(index: number) {
  setPropsArray.value.splice(index, 1)
}

function changeTrigger(v: string) {
  if (v === TriggerEnum.comparison) {
    eventFormData.value.where = {
      comparison: '',
      key: selections.pen?.key ? PropEnums.value : '',
      type: TriggerEnum.comparison,
      value: '',
    }
  } else if (v === TriggerEnum.none) {
    eventFormData.value.where = null
  }
}
</script>

<template>
  <n-form ref="formRef" :model="eventFormData" :rules="formRules">
    <n-form-item label="事件类型" path="name">
      <n-select :options="EventNameOptions" v-model:value="eventFormData.name" />
    </n-form-item>
    <n-form-item label="事件行为" path="action">
      <n-select
        :options="EventActionOptions"
        v-model:value="eventFormData.action"
        @update:value="updateSelectActionValue"
      />
    </n-form-item>
    <template v-if="eventFormData.action === EventActionEnums.Link">
      <EventLinkForm :event-data="eventFormData" />
    </template>
    <!-- 设置属性 -->
    <template v-if="eventFormData.action === EventActionEnums.SetProps">
      <n-form-item label="目标">
        <div class="w-full flex gap-2">
          <n-select
            placeholder="默认为自身"
            v-model:value="eventFormData.params"
            :options="penOptions"
            filterable
            class="flex-1"
          />
          <n-button @click="pickTarget('params')">画布选择</n-button>
        </div>
      </n-form-item>
      <n-form-item v-if="eventFormData.params" label="当前目标">
        <n-text>{{ getPenLabel(eventFormData.params) }}</n-text>
      </n-form-item>
      <div class="flex" :class="setPropsArray.length > 0 ? '' : 'mb-4'">
        <div class="w-full">属性</div>
        <div class="w-full">值</div>
        <n-icon size="20" class="cursor-pointer" @click="addSetProp">
          <AddAlt />
        </n-icon>
      </div>
      <div class="flex gap-2 items-center" v-for="(item, index) in setPropsArray">
        <n-form-item class="w-full">
          <n-select :options="PropOptions" v-model:value="item.key" />
        </n-form-item>
        <template
          v-if="
            item.key === PropEnums.background ||
            item.key === PropEnums.borderColor ||
            item.key === PropEnums.progressColor ||
            item.key === PropEnums.textColor
          "
        >
          <n-form-item class="w-full">
            <color-picker v-model:pureColor="item.value" />
          </n-form-item>
        </template>
        <template
          v-if="
            item.key === PropEnums.text ||
            item.key === PropEnums.x ||
            item.key === PropEnums.y ||
            item.key === PropEnums.width ||
            item.key === PropEnums.height ||
            item.key === PropEnums.showChild
          "
        >
          <n-form-item class="w-full">
            <n-input class="w-full" v-model:value="item.value" />
          </n-form-item>
        </template>
        <template v-if="item.key === PropEnums.visible || item.key === PropEnums.checked">
          <n-form-item class="w-full">
            <n-switch v-model:value="item.value" />
          </n-form-item>
        </template>
        <template v-if="item.key === PropEnums.progress || item.key === PropEnums.rotate">
          <n-form-item class="w-full">
            <n-input-number class="w-full" v-model:value="item.value" />
          </n-form-item>
        </template>
        <n-icon size="20" class="ml-2 cursor-pointer" @click="removeSetProp(index)">
          <RemoveCircleOutline />
        </n-icon>
      </div>
    </template>
    <!-- 执行JS函数 -->
    <template v-if="eventFormData.action === EventActionEnums.JS">
      <EventJsForm :event-data="eventFormData" />
    </template>
    <!-- 执行全局函数 -->
    <template v-if="eventFormData.action === EventActionEnums.GlobalFn">
      <EventGlobalFnForm :event-data="eventFormData" />
    </template>
    <!-- 执行JS函数 -->
    <template
      v-if="
        eventFormData.action === EventActionEnums.StartAnimate ||
        eventFormData.action === EventActionEnums.StopAnimate ||
        eventFormData.action === EventActionEnums.PauseAnimate
      "
    >
      <n-form-item label="目标">
        <div class="w-full flex gap-2">
          <n-select
            placeholder="默认为自身"
            v-model:value="eventFormData.value"
            :options="penOptions"
            filterable
            class="flex-1"
          />
          <n-button @click="pickTarget('value')">画布选择</n-button>
        </div>
      </n-form-item>
      <n-form-item v-if="eventFormData.value" label="当前目标">
        <n-text>{{ getPenLabel(eventFormData.value) }}</n-text>
      </n-form-item>
    </template>
    <n-form-item label="触发条件">
      <n-select
        :options="TriggerOptions"
        v-model:value="eventFormData.trigger"
        @update:value="changeTrigger"
      />
    </n-form-item>
    <template v-if="eventFormData.trigger === TriggerEnum.comparison">
      <n-form-item label="属性名">
        <n-select :options="TriggerComparisonPropOptions" v-model:value="eventFormData.where.key" />
      </n-form-item>
      <n-form-item label="条件">
        <n-select :options="ComparisonOptions" v-model:value="eventFormData.where.comparison" />
      </n-form-item>
      <n-form-item label="属性值">
        <n-input v-model:value="eventFormData.where.value" />
      </n-form-item>
    </template>
    <div class="flex justify-end">
      <n-button type="primary" @click="updateValue">确定</n-button>
    </div>
  </n-form>
</template>

<style lang="scss" scoped></style>
