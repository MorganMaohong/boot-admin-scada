<template>
  <div class="gateway-var-select">
    <n-tree-select
      v-model:value="modelValueRef"
      :options="gatewayVarData"
      key-field="value"
      label-field="label"
      default-expand-all
      filterable
      clearable
      :disabled="disabled"
      @update:value="updateValue"
    />
    <div v-if="showMissingHint" class="gateway-var-select__hint">
      当前变量未在本项目中匹配，请重新选择
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { getUrlParams } from '@/utils'

const props = defineProps<{
  modelValue: string
  modelName?: string
  disabled?: boolean
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'update:modelName', val: string): void
}>()

const modelValueRef = ref(props.modelValue)
const modelNameRef = ref(props.modelName)
const knownValueSet = ref<Set<string>>(new Set())
const gatewayVarData = ref<any[]>([])

watch(
  () => props.modelValue,
  (val) => {
    modelValueRef.value = val
  },
)

watch(modelValueRef, (val) => {
  emits('update:modelValue', val)
})

onMounted(() => {
  MonitorDrawService.getAllGatewayVar(getUrlParams().projectUid).then((res) => {
    gatewayVarData.value = res
    knownValueSet.value = collectOptionValues(res || [])
  })
})

function updateValue(_key: string | null, option: any) {
  const label = option?.label
  if (!label) return
  modelNameRef.value = label
  emits('update:modelName', modelNameRef.value)
}

function collectOptionValues(options: any[], values = new Set<string>()) {
  ;(options || []).forEach((item) => {
    if (!item) return
    const value = item.value ?? item.uid ?? item.key
    if (value !== undefined && value !== null) {
      values.add(String(value))
    }
    if (Array.isArray(item.children) && item.children.length > 0) {
      collectOptionValues(item.children, values)
    }
  })
  return values
}

const showMissingHint = computed(() => {
  if (!modelValueRef.value) return false
  return !knownValueSet.value.has(String(modelValueRef.value))
})
</script>

<style scoped lang="scss">
.gateway-var-select {
  width: 100%;
}

.gateway-var-select__hint {
  margin-top: 6px;
  padding-left: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: #d97706;
}
</style>
