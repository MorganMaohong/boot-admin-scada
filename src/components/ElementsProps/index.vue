<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import LineProps from '@/components/ElementsProps/components/LineProps/index.vue'
import NodeProps from '@/components/ElementsProps/components/NodeProps/index.vue'
import MoreNodeProps from '@/components/ElementsProps/components/MoreNodeProps/index.vue'
import { useSelection } from '@/services/selections.ts'
import { s16 } from '@meta2d/core'

const { selections } = useSelection()
const pen = ref<any>({})
const k1 = ref(s16)
const k2 = ref(s16)
onMounted(() => {
  // debugger
  pen.value = selections.pen
  console.log(pen.value)
})

watch(
  () => selections.pen,
  (newPen) => {
    pen.value = newPen // ✅ 更新 pen 的值
  },
  { deep: true },
)
</script>

<template>
  <template v-if="selections.pens && selections.pens.length > 1">
    <MoreNodeProps />
  </template>
  <template v-else>
    <LineProps v-if="pen.name === 'line'" :key="k1" />
    <NodeProps v-else :key="k2" />
  </template>
</template>

<style lang="scss" scoped></style>
