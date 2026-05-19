import { computed, ref } from 'vue'

export type DisplayMessageType = 'success' | 'error' | 'warning' | 'info'

export interface DisplayMessageItem {
  id: number
  type: DisplayMessageType
  content: string
}

export interface DisplayMessageApi {
  success: (content: string) => void
  error: (content: string) => void
  warning: (content: string) => void
  info: (content: string) => void
}

const messages = ref<DisplayMessageItem[]>([])
let nextMessageId = 1

function pushMessage(type: DisplayMessageType, content: string) {
  if (!content) return
  const id = nextMessageId++
  messages.value.push({ id, type, content })
  window.setTimeout(() => {
    messages.value = messages.value.filter((item) => item.id !== id)
  }, 2400)
}

export const displayMessages = computed(() => messages.value)

export const displayMessage: DisplayMessageApi = {
  success(content: string) {
    pushMessage('success', content)
  },
  error(content: string) {
    pushMessage('error', content)
  },
  warning(content: string) {
    pushMessage('warning', content)
  },
  info(content: string) {
    pushMessage('info', content)
  },
}

