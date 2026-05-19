<script setup lang="ts">
import { computed } from 'vue'
import { bootstrapAuthFromUrl } from '@/utils/auth'
import { getAuthToken } from '@/utils/auth'
import RequestLoadingBridge from '@/components/RequestLoadingBridge.vue'
import DisplayToastHost from '@/components/DisplayToastHost.vue'
import DisplayView from '@/views/display/index.vue'
import { requestOverlayMessage, requestOverlayVisible } from '@/stores/requestOverlay'
import { displayMessage } from '@/stores/displayMessage'
import AccessRequired from '@/views/access-required/index.vue'

bootstrapAuthFromUrl()
window.$message = displayMessage
const hasToken = computed(() => Boolean(getAuthToken()))
</script>

<template>
  <div class="w-full h-full">
    <template v-if="hasToken">
      <request-loading-bridge />
      <display-toast-host />
      <DisplayView />
      <transition name="request-loading-fade">
        <div v-if="requestOverlayVisible" class="request-loading-mask">
          <div class="request-loading-panel">
            <div class="request-loading-spinner" />
            <div class="request-loading-text">{{ requestOverlayMessage }}</div>
          </div>
        </div>
      </transition>
    </template>
    <access-required v-else />
  </div>
</template>

<style lang="scss">
.n-form-item .n-form-item-feedback-wrapper {
  min-height: 12px;
}

.request-loading-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(1px);
}

.request-loading-panel {
  min-width: 180px;
  padding: 18px 20px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.request-loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(148, 163, 184, 0.25);
  border-top-color: #2563eb;
  border-radius: 999px;
  animation: request-loading-spin 0.8s linear infinite;
}

.request-loading-text {
  font-size: 13px;
  line-height: 1.4;
  color: #334155;
}

.request-loading-fade-enter-active,
.request-loading-fade-leave-active {
  transition: opacity 0.18s ease;
}

.request-loading-fade-enter-from,
.request-loading-fade-leave-to {
  opacity: 0;
}

@keyframes request-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
