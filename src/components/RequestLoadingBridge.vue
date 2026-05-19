<script setup lang="ts">
import { ref, watch } from 'vue'
import { hasPendingRequest } from '@/stores/requestLoading'

const visible = ref(false)

watch(
  hasPendingRequest,
  (loading) => {
    if (loading) {
      visible.value = true
      return
    }

    window.setTimeout(() => {
      visible.value = false
    }, 160)
  },
  { immediate: true },
)
</script>

<template>
  <transition name="request-loading-bar">
    <div v-if="visible" class="request-loading-bar">
      <div class="request-loading-bar__inner" />
    </div>
  </transition>
</template>

<style scoped lang="scss">
.request-loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10030;
  height: 3px;
  overflow: hidden;
  pointer-events: none;
  background: rgba(37, 99, 235, 0.08);
}

.request-loading-bar__inner {
  width: 38%;
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #38bdf8);
  animation: request-loading-slide 1.15s ease-in-out infinite;
}

.request-loading-bar-enter-active,
.request-loading-bar-leave-active {
  transition: opacity 0.16s ease;
}

.request-loading-bar-enter-from,
.request-loading-bar-leave-to {
  opacity: 0;
}

@keyframes request-loading-slide {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(360%);
  }
}
</style>
