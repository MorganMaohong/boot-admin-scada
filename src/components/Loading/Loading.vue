<template>
  <div class="relative w-full h-full">
    <!-- 包裹的内容 -->
    <div :class="[{ 'blur-sm': show }, 'w-full h-full']" :style="{ filter: show ? 'blur(4px)' : 'none' }">
      <slot />
    </div>

    <!-- 加载动画 -->
    <div v-if="show" class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg-icon name="spinner" size="48" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue"
import Spin from "@/icons/svg/spin.svg"

const props = defineProps({
  show: Boolean,
  svg: {
    type: String,
    default: ``
  }
})

const svgContent = computed(() => props.svg)
</script>

<style scoped>
/* 使加载动画自适应大小 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
