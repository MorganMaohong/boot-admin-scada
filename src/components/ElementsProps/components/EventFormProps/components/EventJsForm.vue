<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue'
import type { EventForm } from '@/components/ElementsProps/model'
import FormModal from '@/components/FormModal/index.vue'

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
  <FormModal v-model:show="showUpdateJs" title="编辑 JavaScript" size="xl">
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
  </FormModal>
</template>

<style lang="scss" scoped></style>
