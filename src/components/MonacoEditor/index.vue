<template>
  <div style="position: relative; width: 100%; height: 100%">
    <div ref="editorEl" style="width: 100%; height: 100%"></div>
    <n-button
      type="primary"
      @click="emitCode"
      style="position: absolute; bottom: 10px; right: 10px; z-index: 10; padding: 6px 12px"
    >
      提交代码
    </n-button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as monaco from 'monaco-editor'

const props = defineProps({
  code: {
    type: String,
    default: '',
  },
})
const emit = defineEmits(['submit'])

const editorEl = ref(null)
let editorInstance = null
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(workerId, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html') {
      return new htmlWorker()
    }
    if (['typescript', 'javascript'].includes(label)) {
      return new tsWorker()
    }
    return new editorWorker()
  },
}
onMounted(() => {
  editorInstance = monaco.editor.create(editorEl.value, {
    value: props.code,
    language: 'javascript',
    theme: 'vs-dark', // 主题
    folding: true, // 是否折叠
    foldingHighlight: true, // 折叠等高线
    foldingStrategy: 'indentation', // 折叠方式  auto | indentation
    showFoldingControls: 'always', // 是否一直显示折叠 always | mouseover
    disableLayerHinting: true, // 等宽优化
    emptySelectionClipboard: false, // 空选择剪切板
    selectionClipboard: false, // 选择剪切板
    automaticLayout: true, // 自动布局
    codeLens: false, // 代码镜头
    scrollBeyondLastLine: false, // 滚动完最后一行后再滚动一屏幕
    colorDecorators: true, // 颜色装饰器
    accessibilitySupport: 'off', // 辅助功能支持  "auto" | "off" | "on"
    lineNumbers: 'on', // 行号 取值： "on" | "off" | "relative" | "interval" | function
    lineNumbersMinChars: 5, // 行号最小字符   number
    readOnly: false, //是否只读  取值 true | false
  })
})

onBeforeUnmount(() => {
  editorInstance?.dispose()
})

function emitCode() {
  emit('submit', editorInstance?.getValue() || '')
}
</script>
