<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import {
  type AnimationForm,
  AnimationFramesOptions,
  type DataForm,
} from '@/components/ElementsProps/model'

const props = defineProps<{
  value: AnimationForm
}>()
const emit = defineEmits(['update:value'])
onMounted(() => {
  console.log(props.value)
})

function updateValue() {
  emit('update:value', props.value)
}
</script>

<template>
  <n-form>
    <n-form-item label="时长">
      <n-input-number v-model:value="value.duration" class="w-full" :show-button="false" />
    </n-form-item>
    <n-form-item label="动画效果">
      <n-select :options="AnimationFramesOptions" value-field="key" v-model:value="value.framesKey" />
    </n-form-item>
    <n-form-item label="循环次数">
      <n-input placeholder="默认无限循环" />
    </n-form-item>
    <n-form-item label="下个动画">
      <n-input />
    </n-form-item>

    <n-form-item label="保持动画状态">
      <n-switch />
    </n-form-item>
    <div class="flex w-full justify-center gap-2">
      <n-button class="flex-1" type="info">播放</n-button>
      <n-button class="flex-1" type="info">暂停</n-button>
      <n-button class="flex-1" type="info">停止</n-button>
    </div>
    <div class="flex w-full mt-2">
      <n-button class="flex-1" type="primary" @click="updateValue">保存动画</n-button>
    </div>
  </n-form>
</template>

<style lang="scss" scoped></style>
