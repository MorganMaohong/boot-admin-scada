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
    case GlobalFnEnums.writeVar:
    case GlobalFnEnums.controlVar:
      if (!isTrulyEmptyObject(props.eventData.params)) {
        if (!props.eventData.params.key) {
          if (pen.key) {
            props.eventData.params.key = pen.key
          }
        }
      } else {
        props.eventData.params = {}
      }
      break
  }
})

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
      if (pen.key) {
        props.eventData.params = {
          key: pen.key,
          prop: 'custom',
        }
      } else {
        props.eventData.params = {}
      }
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
  </template>
  <template
    v-if="
      eventData.value === GlobalFnEnums.openModal &&
      eventData.params &&
      typeof eventData.params === 'object'
    "
  >
    <n-form-item label="变量" class="w-full">
      <GatewayVarSelect v-model:model-value="eventData.params.key" />
    </n-form-item>
  </template>
</template>

<style lang="scss" scoped></style>
