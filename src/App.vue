<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { NConfigProvider } from 'naive-ui/es/config-provider'
import { NMessageProvider } from 'naive-ui/es/message'
import { NDialogProvider } from 'naive-ui/es/dialog'
import { NLoadingBarProvider } from 'naive-ui/es/loading-bar'
import { NSpin } from 'naive-ui/es/spin'
import zhCN from 'naive-ui/es/locales/common/zhCN'
import dateZhCN from 'naive-ui/es/locales/date/zhCN'
import { bootstrapAuthFromUrl } from '@/utils/auth'
import { getAuthToken } from '@/utils/auth'
import RequestLoadingBridge from '@/components/RequestLoadingBridge.vue'
import { requestOverlayMessage, requestOverlayVisible } from '@/stores/requestOverlay'
import AccessRequired from '@/views/access-required/index.vue'

bootstrapAuthFromUrl()
const hasToken = computed(() => Boolean(getAuthToken()))
</script>

<template>
  <n-config-provider class="w-full h-full" :locale="zhCN" :date-locale="dateZhCN">
    <n-loading-bar-provider>
      <request-loading-bridge />
      <n-message-provider>
        <n-dialog-provider>
          <router-view v-if="hasToken" />
          <access-required v-else />
          <transition name="request-loading-fade">
            <div v-if="requestOverlayVisible" class="request-loading-mask">
              <div class="request-loading-panel">
                <n-spin size="large" />
                <div class="request-loading-text">{{ requestOverlayMessage }}</div>
              </div>
            </div>
          </transition>
        </n-dialog-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
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
</style>
