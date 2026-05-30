<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    show: boolean
    title?: string
    width?: string
    height?: string
    showMask?: boolean
    maskClosable?: boolean
    /** 显示右上角关闭按钮 */
    closable?: boolean
    /** 内容区撑满面板剩余高度（用于 Meta2d 弹窗画布） */
    contentFill?: boolean
  }>(),
  {
    title: '',
    width: '500px',
    height: '',
    showMask: true,
    maskClosable: true,
    closable: false,
    contentFill: false,
  },
)

const showHeader = computed(() => Boolean(props.title) || props.closable)

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const panelStyle = computed(() => ({
  width: props.width,
  height: props.height || undefined,
}))

function close() {
  emit('update:show', false)
}

function onMaskClick() {
  if (props.maskClosable) close()
}
</script>

<template>
  <teleport to="body">
    <transition name="display-modal-fade">
      <div v-if="show" class="display-modal" :class="{ 'display-modal--maskless': !showMask }">
        <div v-if="showMask" class="display-modal__mask" @click="onMaskClick" />
        <div class="display-modal__panel" :style="panelStyle">
          <div v-if="showHeader" class="display-modal__header">
            <div v-if="title" class="display-modal__title">{{ title }}</div>
            <button
              v-if="closable"
              type="button"
              class="display-modal__close"
              aria-label="关闭"
              @click="close"
            >
              ×
            </button>
          </div>
          <div
            class="display-modal__body"
            :class="{ 'display-modal__body--fill': contentFill }"
          >
            <slot />
          </div>
          <div v-if="$slots.footer" class="display-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped lang="scss">
.display-modal {
  position: fixed;
  inset: 0;
  z-index: 10010;
  display: flex;
  align-items: center;
  justify-content: center;
}

.display-modal--maskless {
  pointer-events: none;
}

.display-modal--maskless .display-modal__panel {
  pointer-events: auto;
}

.display-modal__mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.28);
}

.display-modal__panel {
  position: relative;
  z-index: 1;
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 24px);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
  overflow: hidden;
}

.display-modal__header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  padding: 14px 18px 10px;
  border-bottom: 1px solid #e2e8f0;
}

.display-modal__title {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  line-height: 1.4;
  font-weight: 600;
  color: #0f172a;
}

.display-modal__close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.display-modal__close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.display-modal__body {
  padding: 16px 18px;
  overflow: auto;
}

.display-modal__body--fill {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.display-modal__footer {
  padding: 0 18px 16px;
}

.display-modal-fade-enter-active,
.display-modal-fade-leave-active {
  transition: opacity 0.18s ease;
}

.display-modal-fade-enter-from,
.display-modal-fade-leave-to {
  opacity: 0;
}
</style>
