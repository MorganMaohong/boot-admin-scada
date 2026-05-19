<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue'
import type { EventForm } from '@/components/ElementsProps/model'

const props = defineProps<{
  eventData: EventForm
}>()
const showUpdateJs = ref<boolean>(false)
const MonacoEditor = defineAsyncComponent(() => import('@/components/MonacoEditor/index.vue'))

function editJsCode() {
  showUpdateJs.value = true
}
</script>

<template>
  <n-form-item label="JavaScript">
    <n-button type="info" @click="editJsCode">编辑JS代码</n-button>
  </n-form-item>
  <n-modal v-model:show="showUpdateJs" style="width: 1200px; height: 600px" preset="card">
    <MonacoEditor
      v-if="showUpdateJs"
      :code="eventData.value"
      ref="monacoEditorRef"
      @submit="
        (v: any) => {
          eventData.value = String(v)
          showUpdateJs = false
        }
      "
    />
  </n-modal>
</template>

<style lang="scss" scoped></style>
