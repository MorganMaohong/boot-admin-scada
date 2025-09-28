import request from '@/utils/request.ts'
import type {
  MonitorImageCategoryForm,
  ProjectMonitorImage,
  ProjectMonitorImageVo,
  SystemMonitorImage,
  SystemMonitorImageVo,
} from '@/model/image'
import { monitorImageApi } from '@/services/api/index.ts'

export const MonitorImageService = {
  async selectSystemMonitorImageCategory(): Promise<SystemMonitorImageVo> {
    try {
      let res = await request({
        url: monitorImageApi.selectSystemMonitorImageCategory.url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async selectSystemMonitorImage(categoryUid: string): Promise<SystemMonitorImage[]> {
    try {
      let res = await request({
        url: monitorImageApi.selectSystemMonitorImage.url + `/${categoryUid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async selectProjectMonitorImage(categoryUid: string): Promise<ProjectMonitorImage[]> {
    try {
      let res = await request({
        url: monitorImageApi.selectProjectMonitorImage.url + `/${categoryUid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async selectProjectMonitorImageCategory(projectUid: string): Promise<ProjectMonitorImageVo> {
    try {
      let res = await request({
        url: monitorImageApi.selectProjectMonitorImageCategory.url + `/${projectUid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async addOrUpdateProjectMonitorImageCategory(data: MonitorImageCategoryForm): Promise<void> {
    try {
      const url = data.uid
        ? monitorImageApi.updateProjectMonitorImageCategory.url
        : monitorImageApi.addProjectMonitorImageCategory.url
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
  async addOrUpdateSystemMonitorImageCategory(data: MonitorImageCategoryForm): Promise<void> {
    try {
      const url = data.uid
        ? monitorImageApi.updateSystemMonitorImageCategory.url
        : monitorImageApi.addSystemMonitorImageCategory.url
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
  async deleteProjectMonitorImageCategory(uid: string): Promise<void> {
    try {
      let res = await request({
        url: monitorImageApi.deleteProjectMonitorImageCategory.url + `/${uid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async deleteSystemMonitorImageCategory(uid: string): Promise<void> {
    try {
      let res = await request({
        url: monitorImageApi.deleteSystemMonitorImageCategory.url + `/${uid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async deleteProjectMonitorImage(uid: string): Promise<void> {
    try {
      let res = await request({
        url: monitorImageApi.deleteProjectMonitorImage.url + `/${uid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async deleteSystemMonitorImage(uid: string): Promise<void> {
    try {
      let res = await request({
        url: monitorImageApi.deleteSystemMonitorImage.url + `/${uid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async uploadProjectMonitorImage(categoryUid: string, data: FormData): Promise<void> {
    try {
      let res = await request({
        url: monitorImageApi.uploadProjectMonitorImage.url + `/${categoryUid}`,
        method: 'POST',
        data,
        headers: { 'Content-Type': 'multipart/form-data' }, // 动态修改请求头
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async uploadSystemMonitorImage(categoryUid: string, data: FormData): Promise<void> {
    try {
      let res = await request({
        url: monitorImageApi.uploadSystemMonitorImage.url + `/${categoryUid}`,
        method: 'POST',
        data,
        headers: { 'Content-Type': 'multipart/form-data' }, // 动态修改请求头
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
}
