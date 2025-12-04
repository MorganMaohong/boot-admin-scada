<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import { getUrlParams } from '@/utils'
import Cookies from 'js-cookie'
import { zhCN, dateZhCN } from 'naive-ui'

onMounted(() => {
  console.log(getUrlParams())
  Cookies.set('x-token', getUrlParams().accessToken)
})
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
