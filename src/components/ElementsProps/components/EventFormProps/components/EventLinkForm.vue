<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import { type EventForm, LinkOpenOptions } from '@/components/ElementsProps/model'

const props = defineProps<{
  eventData: EventForm
}>()
</script>

<template>
  <n-form-item label="打开方式">
    <n-select :options="LinkOpenOptions" v-model:value="eventData.params" />
  </n-form-item>
  <n-form-item label="链接">
    <n-input v-model:value="eventData.value" />
  </n-form-item>
</template>

<style lang="scss" scoped></style>
