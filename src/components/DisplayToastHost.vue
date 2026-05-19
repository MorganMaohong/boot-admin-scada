<script setup lang="ts">
import { displayMessages } from '@/stores/displayMessage'
</script>

<template>
  <div class="display-toast-host">
    <transition-group name="display-toast">
      <div
        v-for="item in displayMessages"
        :key="item.id"
        class="display-toast"
        :class="`display-toast--${item.type}`"
      >
        {{ item.content }}
      </div>
    </transition-group>
  </div>
</template>

<style scoped lang="scss">
.display-toast-host {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10020;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.display-toast {
  min-width: 180px;
  max-width: min(360px, calc(100vw - 32px));
  padding: 10px 14px;
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  line-height: 1.45;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.2);
  background: rgba(15, 23, 42, 0.88);
}

.display-toast--success {
  background: rgba(22, 163, 74, 0.92);
}

.display-toast--error {
  background: rgba(220, 38, 38, 0.92);
}

.display-toast--warning {
  background: rgba(217, 119, 6, 0.94);
}

.display-toast--info {
  background: rgba(37, 99, 235, 0.92);
}

.display-toast-enter-active,
.display-toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.display-toast-enter-from,
.display-toast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

