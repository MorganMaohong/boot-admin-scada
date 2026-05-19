import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProjectMonitorLayer } from '@/model/layer'
import { MonitorLayerService } from '@/services/MonitorLayerService.ts'
import { useDrawStoreHook } from '@/stores/module/draw.ts'
import { createDefaultLayerForm, sortLayers } from '@/utils/layer.ts'

const drawStore = useDrawStoreHook()
export const useLayerStore = defineStore('layer', () => {
  const layer = ref<ProjectMonitorLayer>({} as ProjectMonitorLayer)

  const createDefaultLayer = async (drawUid?: string, projectUid?: string) => {
    const nextDrawUid = drawUid || drawStore.draw?.uid
    const nextProjectUid = projectUid || drawStore.draw?.projectUid
    if (!nextDrawUid || !nextProjectUid) return null

    const createdLayer = await MonitorLayerService.addOrUpdate(
      createDefaultLayerForm(nextDrawUid, nextProjectUid),
    )
    layer.value = createdLayer || ({} as ProjectMonitorLayer)
    return createdLayer
  }

  const ensureDefaultLayer = async (drawUid?: string, projectUid?: string) => {
    const nextDrawUid = drawUid || drawStore.draw?.uid
    const nextProjectUid = projectUid || drawStore.draw?.projectUid
    if (!nextDrawUid) {
      layer.value = {} as ProjectMonitorLayer
      return null
    }

    const layerList = await MonitorLayerService.select(nextDrawUid)
    if (!layerList.length) {
      return createDefaultLayer(nextDrawUid, nextProjectUid)
    }

    const sortedLayers = sortLayers(layerList).filter((item) => item?.uid)
    const defaultLayers = sortedLayers.filter((item) => item.defaultLayer)
    let currentLayer = defaultLayers[0] || sortedLayers[0]

    if (!currentLayer) {
      layer.value = {} as ProjectMonitorLayer
      return null
    }

    if (defaultLayers.length !== 1 || !currentLayer.defaultLayer) {
      currentLayer = await MonitorLayerService.changeDefaultLayer(nextDrawUid, currentLayer.uid)
    }

    layer.value = currentLayer || ({} as ProjectMonitorLayer)
    return currentLayer
  }

  const getDefaultLayer = async (drawUid?: string, projectUid?: string) => {
    const nextDrawUid = drawUid || drawStore.draw?.uid
    if (!nextDrawUid) {
      layer.value = {} as ProjectMonitorLayer
      return null
    }

    try {
      const res = await MonitorLayerService.selectDefault(nextDrawUid)
      if (res?.uid) {
        layer.value = res
        return res
      }
    } catch (error) {
      console.warn('load default layer failed, fallback to ensure default layer', error)
    }

    return ensureDefaultLayer(nextDrawUid, projectUid)
  }

  return {
    layer,
    createDefaultLayer,
    ensureDefaultLayer,
    getDefaultLayer,
  }
})
