<script lang="ts" setup>
import { onMounted, ref, reactive } from 'vue'
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
import MonacoEditor from '@/components/MonacoEditor/index.vue'
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
const emit = defineEmits(['update:value'])

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
onMounted(() => {
  eventFormData.value = props.value
  loadValue()
  pen.value = selections.pen
  if (
    props.value.action === EventActionEnums.StartAnimate ||
    props.value.action === EventActionEnums.PauseAnimate ||
    props.value.action === EventActionEnums.StopAnimate ||
    props.value.action === EventActionEnums.SetProps
  ) {
    if (pen.value.key) {
      eventFormData.value.params = pen.value.id
    }
  }
})

function loadValue() {
  switch (eventFormData.value.action) {
    case EventActionEnums.SetProps:
      setPropsArray.value = Object.entries(eventFormData.value.value).map(([key, value]) => ({
        key,
        value,
      }))
      getPenOptions()
      if (!eventFormData.value.id) eventFormData.value.params = selections.pen.id
      break
    case EventActionEnums.StartAnimate:
    case EventActionEnums.PauseAnimate:
    case EventActionEnums.StopAnimate:
      getPenOptions()
      if (!eventFormData.value.id) eventFormData.value.value = selections.pen.id

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
      if (!eventFormData.value.id) eventFormData.value.params = selections.pen.id
      break
    case EventActionEnums.StartAnimate:
    case EventActionEnums.PauseAnimate:
    case EventActionEnums.StopAnimate:
      if (!eventFormData.value.value) eventFormData.value.value = selections.pen.id
      break
  }
}

function getPenOptions() {
  Object.keys(meta2d.store.pens).forEach((key) => {
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
      eventFormData.value.params = selections.pen.id
      break
    case EventActionEnums.StartAnimate:
    case EventActionEnums.PauseAnimate:
    case EventActionEnums.StopAnimate:
      eventFormData.value.params = null
      eventFormData.value.value = null
      getPenOptions()
      eventFormData.value.value = selections.pen.id
      break
    case EventActionEnums.JS:
      break
    case EventActionEnums.GlobalFn:
      eventFormData.value.params = {}
      eventFormData.value.value = null
      break
  }
}

function updateValue() {
  formRef.value?.validate((valid) => {
    if (valid) return
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
      key: '',
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
        <n-select
          placeholder="默认为自身"
          v-model:value="eventFormData.params"
          :options="penOptions"
          filterable
        />
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
        <n-select
          placeholder="默认为自身"
          v-model:value="eventFormData.value"
          :options="penOptions"
          filterable
        />
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
