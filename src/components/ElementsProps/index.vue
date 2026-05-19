<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import FileProps from '@/components/FileProps/index.vue'
import LineProps from '@/components/ElementsProps/components/LineProps/index.vue'
import NodeProps from '@/components/ElementsProps/components/NodeProps/index.vue'
import MoreNodeProps from '@/components/ElementsProps/components/MoreNodeProps/index.vue'
import { SelectionMode, useSelection } from '@/services/selections.ts'
import { s16 } from '@meta2d/core'
import { useDrawStore } from '@/stores/module/draw.ts'
import { resetElementsPropsActiveTab } from '@/components/ElementsProps/state.ts'
import emitter from '@/utils/eventBus.ts'

const { select, selections, selects } = useSelection()
const drawStore = useDrawStore()
const pen = ref<any>({})
const k1 = ref(s16)
const k2 = ref(s16)

const propsContextKey = computed(() => {
  const modalUid = drawStore.globalModal?.show ? drawStore.globalModal?.draw?.uid : ''
  if (modalUid) return `modal:${modalUid}`
  return `draw:${drawStore.draw?.uid || ''}`
})

onMounted(() => {
  // debugger
  pen.value = selections.pen
  console.log(pen.value)
  emitter.on('draw', resetToFileProps)
  emitter.on('reloadDraw', resetToFileProps)
})

watch(
  () => selections.pen,
  (newPen) => {
    pen.value = newPen // ✅ 更新 pen 的值
  },
  { deep: true },
)

watch(propsContextKey, (next, prev) => {
  if (!prev || next === prev) return
  resetToFileProps()
})

function resetToFileProps() {
  resetElementsPropsActiveTab()
  select()
  selects()
  meta2d?.inactive?.()
}

onUnmounted(() => {
  emitter.off('draw', resetToFileProps)
  emitter.off('reloadDraw', resetToFileProps)
})
</script>

<template>
  <FileProps v-if="selections.mode === SelectionMode.File" />
  <template v-else-if="selections.pens && selections.pens.length > 1">
    <MoreNodeProps />
  </template>
  <template v-else>
    <LineProps v-if="pen.name === 'line'" :key="k1" />
    <NodeProps v-else :key="k2" />
  </template>
</template>

<style lang="scss" scoped></style>
