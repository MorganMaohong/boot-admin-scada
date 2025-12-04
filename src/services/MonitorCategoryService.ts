import request from '@/utils/request.ts'
import { monitorCategoryApi } from '@/services/api/index.ts'
import type { ProjectMonitorCategoryForm } from '@/model/category'

export const MonitorCategoryService = {
  async addOrUpdate(data: ProjectMonitorCategoryForm): Promise<void> {
    try {
      const url = data.uid ? monitorCategoryApi.update.url : monitorCategoryApi.add.url
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
  async addOrUpdateModal(data: ProjectMonitorCategoryForm): Promise<void> {
    try {
      const url = data.uid ? monitorCategoryApi.update.url : monitorCategoryApi.addModal.url
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
  async delete(uid: string): Promise<void> {
    try {
      let res = await request({
        url: monitorCategoryApi.delete.url + `/${uid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async form(projectUid: string, uid: string): Promise<ProjectMonitorCategoryForm> {
    try {
      const url = uid
        ? monitorCategoryApi.form.url + `/${projectUid}/${uid}`
        : monitorCategoryApi.form.url + `/${projectUid}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
}
