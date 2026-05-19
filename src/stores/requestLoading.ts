import { computed, ref } from 'vue'

const pendingRequestCount = ref(0)

export function beginRequestLoading() {
  pendingRequestCount.value += 1
}

export function endRequestLoading() {
  pendingRequestCount.value = Math.max(0, pendingRequestCount.value - 1)
}

export function resetRequestLoading() {
  pendingRequestCount.value = 0
}

export const hasPendingRequest = computed(() => pendingRequestCount.value > 0)
