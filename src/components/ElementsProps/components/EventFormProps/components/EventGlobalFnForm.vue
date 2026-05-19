<script lang="ts" setup>
import { ref, watch } from 'vue'
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

const { selections } = useSelection()

const props = defineProps<{
  eventData: EventForm
}>()
const globalFnOpenParamsOptions = ref<OptionVo[]>([])

watch(
  () => props.eventData,
  () => {
    syncGlobalFnState()
  },
  { immediate: true },
)

watch(
  () => (selections.pen as any)?.id,
  () => {
    syncGlobalFnState()
  },
)

function syncGlobalFnState() {
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
}

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
    <div class="fn-panel">
      <div class="fn-panel__hint">切换到目标图纸，适合做图纸跳转。</div>
      <n-form-item label="参数">
        <n-select
          :options="globalFnOpenParamsOptions"
          v-model:value="eventData.params"
          placeholder="请选择要打开的图纸"
        />
      </n-form-item>
    </div>
  </template>
  <template v-if="eventData.value === GlobalFnEnums.openModal">
    <div class="fn-panel">
      <div class="fn-panel__hint">
        以弹窗方式打开用户设计的弹窗图纸，适合设备详情、启停控制、运行参数等自定义画面。
      </div>
      <n-form-item label="参数">
        <n-select
          :options="globalFnOpenParamsOptions"
          v-model:value="eventData.params"
          placeholder="请选择要打开的弹窗图纸"
        />
      </n-form-item>
    </div>
  </template>
  <template
    v-if="
      eventData.value === GlobalFnEnums.writeVar &&
      eventData.params &&
      typeof eventData.params === 'object'
    "
  >
    <div class="fn-panel">
      <div class="fn-panel__hint">可直接写固定值，或读取当前图元属性后写入变量。</div>
      <n-form-item label="变量" class="w-full">
        <GatewayVarSelect v-model:model-value="eventData.params.key" />
      </n-form-item>
      <div class="flex w-full gap-2 fn-panel__fields">
        <n-form-item label="设置值" class="w-full">
          <n-select v-model:value="eventData.params.prop" :options="PresetJsPropOptions" />
        </n-form-item>
        <n-form-item label="固定值" class="w-full" v-if="eventData.params.prop === 'custom'">
          <n-input v-model:value="eventData.params.value" placeholder="请输入要写入的值" />
        </n-form-item>
      </div>
    </div>
  </template>
  <template
    v-if="
      eventData.value === GlobalFnEnums.controlVar &&
      eventData.params &&
      typeof eventData.params === 'object'
    "
  >
    <div class="fn-panel">
      <div class="fn-panel__hint">
        运行时会弹出变量输入框，默认带出当前图元的值，用户确认后再写入。
      </div>
      <n-form-item label="变量" class="w-full">
        <GatewayVarSelect v-model:model-value="eventData.params.key" />
      </n-form-item>
    </div>
  </template>
  <template v-if="eventData.value === GlobalFnEnums.openFullScreen">
    <div class="fn-panel">
      <div class="fn-panel__hint">点击后会在当前页面切换全屏状态，无需额外参数。</div>
    </div>
  </template>
</template>

<style lang="scss" scoped>
.fn-panel {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
}

.fn-panel__hint {
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
}

.fn-panel__fields {
  align-items: flex-start;
}
</style>
