<template>
  <n-tree-select
    :options="gatewayVarData"
    key-field="value"
    label-field="label"
    default-expand-all
    filterable
    v-model:value="modelValueRef"
    @update:value="updateValue"
    clearable
    :disabled="disabled"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import request from '@/utils/request'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { getUrlParams } from '@/utils' // 替换成你项目里的路径

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
watch(
  () => props.modelValue,
  (val) => (modelValueRef.value = val),
)
watch(modelValueRef, (val) => emits('update:modelValue', val))

const gatewayVarData = ref<any[]>([])

onMounted(() => {
  MonitorDrawService.getAllGatewayVar(getUrlParams().projectUid).then((res) => {
    const raw = res || []
    gatewayVarData.value = res
    /*gatewayVarData.value = raw.map((gateway: any) => ({
      ...gateway,
      disabled: true, // 网关禁选
      children: gateway.children || [], // 子节点仍可选
    }))*/
  })
})

function updateValue(k, v) {
  debugger
  console.log(k, v)
  modelNameRef.value = v.label
  emits('update:modelName', modelNameRef.value)
}
</script>
