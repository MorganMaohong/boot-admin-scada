<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import type { EventForm } from '@/components/ElementsProps/model'
import MonacoEditor from '@/components/MonacoEditor/index.vue'

const props = defineProps<{
  eventData: EventForm
}>()
const showUpdateJs = ref<boolean>(false)

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
      :code="eventData.value"
      ref="monacoEditorRef"
      @submit="
        (v: any) => {
          console.log(v)
          eventData.value = String(v)
          showUpdateJs = false
        }
      "
    />
  </n-modal>
</template>

<style lang="scss" scoped></style>
