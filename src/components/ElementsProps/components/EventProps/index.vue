<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'

import {
  EventNameOptions,
  EventActionOptions,
  EventActionEnums,
  EventNameEnums,
  LinkOpenOptions,
  getOptionsLabel,
  type EventForm,
} from '@/components/ElementsProps/model/index.ts'

const props = defineProps<{
  value: EventForm
}>()
</script>

<template>
  <n-form label-placement="left" label-width="auto">
    <n-form-item label="事件类型">
      <n-text>{{ getOptionsLabel(EventNameOptions, value.name) }}</n-text>
    </n-form-item>
    <n-form-item label="事件行为">
      <n-text>{{ getOptionsLabel(EventActionOptions, value.action) }}</n-text>
    </n-form-item>
    <template v-if="value.action === EventActionEnums.Link">
      <!--      <n-form-item label="链接地址">
              <n-input
                v-model:value="value.value"
                @update:value="changeEvent($event, 'value')"
                disabled
              />
            </n-form-item>
            <n-form-item label="打开方式">
              <n-select
                v-model:value="value.params"
                @update:value="changeEvent($event, 'params')"
                :options="LinkOpenOptions"
                disabled
              />
            </n-form-item>-->
    </template>
    <template v-else-if="value.action === EventActionEnums.SetProps"></template>
    <template v-else-if="value.action === EventActionEnums.StartAnimate"></template>
    <template v-else-if="value.action === EventActionEnums.PauseAnimate"></template>
    <template v-else-if="value.action === EventActionEnums.StopAnimate"></template>
    <template v-else-if="value.action === EventActionEnums.JS"></template>
    <template v-else-if="value.action === EventActionEnums.GlobalFn"></template>
    <template v-else-if="value.action === EventActionEnums.Emit"></template>
    <template v-else-if="value.action === EventActionEnums.StartVideo"></template>
    <template v-else-if="value.action === EventActionEnums.PauseVideo"></template>
    <template v-else-if="value.action === EventActionEnums.StopVideo"></template>
    <template v-else-if="value.action === EventActionEnums.SendPropData"></template>
    <template v-else-if="value.action === EventActionEnums.SendVarData"></template>
    <template v-else-if="value.action === EventActionEnums.Dialog"></template>
  </n-form>
</template>

<style lang="scss" scoped></style>
