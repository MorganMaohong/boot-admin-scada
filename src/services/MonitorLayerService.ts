import type { ProjectMonitorDrawForm } from '@/model/draw'
import { monitorDrawApi, monitorLayerApi } from '@/services/api'
import request from '@/utils/request.ts'
import type { ProjectMonitorLayer, ProjectMonitorLayerForm } from '@/model/layer'

export const MonitorLayerService = {
  async addOrUpdate(data: ProjectMonitorLayerForm): Promise<void> {
    try {
      const url = data.uid ? monitorLayerApi.update.url : monitorLayerApi.add.url
      let res = await request({
        url,
        method: 'POST',
        data,
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async copy(data: ProjectMonitorLayerForm): Promise<ProjectMonitorLayer> {
    try {
      let res = await request({
        url: monitorLayerApi.copy.url,
        method: 'POST',
        data,
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async delete(layerUid: string): Promise<void> {
    try {
      const url = `${monitorLayerApi.delete.url}/${layerUid}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async select(drawUid: string): Promise<ProjectMonitorLayer[]> {
    try {
      const url = `${monitorLayerApi.select.url}/${drawUid}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async selectDefault(drawUid: string): Promise<ProjectMonitorLayer> {
    try {
      const url = `${monitorLayerApi.selectDefault.url}/${drawUid}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async changeDefaultLayer(drawUid: string, layerUid: string): Promise<ProjectMonitorLayer> {
    try {
      const url = `${monitorLayerApi.changeDefaultLayer.url}/${drawUid}/${layerUid}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async sort(drawUid: string, layerUids: string[]): Promise<void> {
    try {
      const url = `${monitorLayerApi.sort.url}/${drawUid}`
      const res = await request({
        url,
        method: 'POST',
        data: layerUids,
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
}
