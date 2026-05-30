<script lang="ts" setup>
import { computed } from 'vue'
import { useDrawPopupStore } from '@/stores/module/drawPopup.ts'
import DisplayModal from '@/components/DisplayModal.vue'
import DrawPopupCanvas from '@/components/DrawPopupCanvas/index.vue'

const drawPopupStore = useDrawPopupStore()

const show = computed({
  get: () => drawPopupStore.show,
  set: (value: boolean) => {
    if (!value) drawPopupStore.close()
  },
})
</script>

<template>
  <DisplayModal
    v-if="drawPopupStore.show"
    :show="show"
    @update:show="show = $event"
    :title="drawPopupStore.draw.title"
    :width="drawPopupStore.style.width"
    :height="drawPopupStore.style.height"
    closable
    content-fill
    :mask-closable="false"
  >
    <DrawPopupCanvas :draw="drawPopupStore.draw" />
  </DisplayModal>
</template>
