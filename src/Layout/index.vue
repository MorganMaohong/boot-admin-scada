<script lang="ts" setup>
import { ref, watch, onMounted, reactive } from 'vue'
import Resource from './Resource/index.vue'
import TopBar from './TopBar/index.vue'
import Main from './Main/index.vue'
import Props from './Props/index.vue'
import { useAppStore } from '@/stores/app.ts'
import LeftMode from '@/Layout/Mode/LeftMode.vue'
import { useMessage } from 'naive-ui'

window['$message'] = useMessage()

const appStore = useAppStore()
</script>

<template>
  <n-layout class="h-screen flex flex-col">
    <n-layout-header
      :inverted="true"
      bordered
      :class="[
        'h-12 flex items-center justify-between px-5 flex-shrink-0 border-b border-gray-300 overflow-x-auto overflow-y-hidden',
        appStore.targetPicker.active ? 'picker-disabled' : '',
      ]"
    >
      <TopBar />
    </n-layout-header>
    <n-layout has-sider class="flex-1 overflow-hidden flex">
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="260"
        :collapsed="appStore.collapsed"
        @collapse="appStore.collapsed = true"
        @expand="appStore.collapsed = false"
        :class="['p-2', appStore.targetPicker.active ? 'picker-disabled' : '']"
      >
        <Resource />
      </n-layout-sider>
      <n-layout class="flex-1 flex flex-col overflow-hidden">
        <n-layout-content class="flex-1 overflow-hidden p-2">
          <Main class="flex-1" />
        </n-layout-content>
      </n-layout>
      <div class="border-l border-[#efeff4] h-full">
        <n-layout-sider
          bordered
          collapse-mode="width"
          :collapsed-width="64"
          :width="320"
          :collapsed="appStore.collapsed"
          @collapse="appStore.collapsed = true"
          @expand="appStore.collapsed = false"
          :class="['p-2 h-full', appStore.targetPicker.active ? 'picker-disabled' : '']"
        >
          <Props />
        </n-layout-sider>
      </div>
    </n-layout>
  </n-layout>
</template>

<style lang="scss" scoped>
.picker-disabled {
  pointer-events: none;
  user-select: none;
  opacity: 0.55;
}

::v-deep(.n-layout-scroll-container) {
  display: flex;
  flex-direction: column;
}
</style>
