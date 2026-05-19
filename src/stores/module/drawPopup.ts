import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { MonitorDrawService } from '@/services/MonitorDrawService.ts'
import { getUrlParams } from '@/utils'
import store from '@/stores'
import type { ProjectMonitorDraw } from '@/model/draw'

export const useDrawPopupStore = defineStore('drawPopup', () => {
  const show = ref(false)
  const loading = ref(false)
  const draw = ref<ProjectMonitorDraw>({} as ProjectMonitorDraw)

  const style = computed(() => ({
    width: `${draw.value.width || 800}px`,
    height: `${draw.value.height || 600}px`,
  }))

  async function open(uid: string) {
    if (!uid) return
    loading.value = true
    show.value = false
    try {
      const { projectUid } = getUrlParams()
      const data = await MonitorDrawService.display(projectUid, uid)
      draw.value = data.draw || {}
      show.value = true
    } finally {
      loading.value = false
    }
  }

  function close() {
    show.value = false
  }

  return {
    show,
    loading,
    draw,
    style,
    open,
    close,
  }
})

export function useDrawPopupStoreHook() {
  return useDrawPopupStore(store)
}
