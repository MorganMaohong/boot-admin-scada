<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import {
  type EventForm,
  GlobalFnEnums,
  GlobalFnOptions,
  PresetJsPropOptions,
} from '@/components/ElementsProps/model'
import GatewayVarSelect from '@/components/ElementsProps/components/GatewayVarSelect/index.vue'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { getUrlParams } from '@/utils'
import type { OptionVo } from '@/model'
import { useSelection } from '@/services/selections.ts'
import { s8 } from '@meta2d/core'
import { openModal } from '@/globals.ts'

const { selections } = useSelection()

const props = defineProps<{
  eventData: EventForm
}>()
const globalFnOpenParamsOptions = ref<OptionVo[]>([])

onMounted(() => {
  const pen = selections.pen
  if (!pen) return
  switch (props.eventData.value) {
    case GlobalFnEnums.openDraw:
      options()
      break
    case GlobalFnEnums.openModal:
      modalOptions()
      break
    case GlobalFnEnums.writeVar:
    case GlobalFnEnums.controlVar:
      ensureVarParams()
      break
  }
})

function getPreferredVarKey() {
  const pen = selections.pen as any
  if (!pen) return ''
  if (pen.preferredVarKey) return pen.preferredVarKey
  if (Array.isArray(pen.datas)) {
    const preferredData = [...pen.datas]
      .reverse()
      .find((item) => item?.key && item?.autoSync !== true)
    if (preferredData?.key) return preferredData.key
  }
  return pen.key || ''
}

function ensureVarParams(force = false) {
  const pen = selections.pen
  const preferredVarKey = getPreferredVarKey()
  if (!props.eventData.params || typeof props.eventData.params !== 'object') {
    props.eventData.params = {}
  }
  if ((force || !props.eventData.params.key) && preferredVarKey) {
    props.eventData.params.key = preferredVarKey
  }
  if ((force || !props.eventData.params.prop) && props.eventData.value === GlobalFnEnums.writeVar) {
    props.eventData.params.prop = 'custom'
  }
}

function updateGlobalFnValue(v: string) {
  props.eventData.params = null
  const pen = selections.pen
  if (!pen) return
  switch (v) {
    case GlobalFnEnums.openDraw:
      options()
      break
    case GlobalFnEnums.writeVar:
    case GlobalFnEnums.controlVar:
      props.eventData.params = {}
      ensureVarParams(true)
      break
    case GlobalFnEnums.openModal:
      modalOptions()
      break
  }
}

function isTrulyEmptyObject(obj: any): boolean {
  return (
    obj !== null && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length === 0
  )
}

function options() {
  MonitorDrawService.options(getUrlParams().projectUid).then((data) => {
    globalFnOpenParamsOptions.value = data
  })
}

function modalOptions() {
  MonitorDrawService.modalOptions(getUrlParams().projectUid).then((data) => {
    globalFnOpenParamsOptions.value = data
  })
}
</script>

<template>
  <n-form-item label="函数名称">
    <n-select
      :options="GlobalFnOptions"
      v-model:value="eventData.value"
      @update:value="updateGlobalFnValue"
    />
  </n-form-item>
  <template v-if="eventData.value === GlobalFnEnums.openDraw">
    <n-form-item label="参数">
      <n-select :options="globalFnOpenParamsOptions" v-model:value="eventData.params" />
    </n-form-item>
  </template>
  <template v-if="eventData.value === GlobalFnEnums.openModal">
    <n-form-item label="参数">
      <n-select :options="globalFnOpenParamsOptions" v-model:value="eventData.params" />
    </n-form-item>
  </template>
  <template
    v-if="
      eventData.value === GlobalFnEnums.writeVar &&
      eventData.params &&
      typeof eventData.params === 'object'
    "
  >
    <n-form-item label="变量" class="w-full">
      <GatewayVarSelect v-model:model-value="eventData.params.key" />
    </n-form-item>
    <n-text depth="3" class="text-xs block mb-3">
      可直接写固定值，或读取当前图元的属性值后写入变量。
    </n-text>
    <div class="flex w-full gap-2">
      <n-form-item label="属性" class="w-full">
        <n-select v-model:value="eventData.params.prop" :options="PresetJsPropOptions" />
      </n-form-item>
      <n-form-item label="设置值" class="w-full" v-if="eventData.params.prop === 'custom'">
        <n-input v-model:value="eventData.params.value" />
      </n-form-item>
    </div>
  </template>
  <template
    v-if="
      eventData.value === GlobalFnEnums.controlVar &&
      eventData.params &&
      typeof eventData.params === 'object'
    "
  >
    <n-form-item label="变量" class="w-full">
      <GatewayVarSelect v-model:model-value="eventData.params.key" />
    </n-form-item>
    <n-text depth="3" class="text-xs block mb-3">
      运行时会弹出变量输入框，默认带出当前图元的值，用户确认后再写入。
    </n-text>
  </template>
</template>

<style lang="scss" scoped></style>
