import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProjectMonitorLayer } from '@/model/layer'
import { MonitorLayerService } from '@/services/MonitorLayerService.ts'
import { useDrawStoreHook } from '@/stores/module/draw.ts'

const drawStore = useDrawStoreHook()
export const useLayerStore = defineStore('layer', () => {
  const layer = ref<ProjectMonitorLayer>({})
  const getDefaultLayer = () => {
    MonitorLayerService.selectDefault(drawStore.draw.uid).then((res) => {
      console.log(res)
      layer.value = res
    })
  }
  return {
    layer,
    getDefaultLayer,
  }
})
