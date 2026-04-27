<script setup lang="ts">
import { RouterView } from 'vue-router'
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import { zhCN, dateZhCN } from 'naive-ui'
import { bootstrapAuthFromUrl } from '@/utils/auth'

bootstrapAuthFromUrl()
</script>

<template>
  <n-config-provider class="w-full h-full" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
<style lang="scss">
.n-form-item .n-form-item-feedback-wrapper {
  min-height: 12px;
}
</style>
