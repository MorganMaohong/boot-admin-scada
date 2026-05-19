import { computed, ref } from 'vue'

const visible = ref(false)
const message = ref('加载中，请稍候...')

export function showRequestOverlay(nextMessage = '加载中，请稍候...') {
  message.value = nextMessage
  visible.value = true
}

export function hideRequestOverlay() {
  visible.value = false
}

export const requestOverlayVisible = computed(() => visible.value)
export const requestOverlayMessage = computed(() => message.value)
