<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import FileProps from '@/components/FileProps/index.vue'
import ElementsProps from '@/components/ElementsProps/index.vue'
import { useSelection, SelectionMode } from '@/services/selections'
import { s16 } from '@meta2d/core'
const { selections } = useSelection()
</script>

<template>
  <FileProps v-if="selections.mode === SelectionMode.File" />
  <ElementsProps v-else-if="selections.mode === SelectionMode.Pen" />
</template>

<style lang="scss" scoped></style>
