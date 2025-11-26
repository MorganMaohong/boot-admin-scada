import request from '@/utils/request.ts'
import { monitorDrawModalCategoryApi } from '@/services/api/index.ts'
import type { ProjectMonitorDrawModalCategoryForm } from '@/model/modalCategory'

export const MonitorDrawModalCategoryService = {
  async addOrUpdate(data: ProjectMonitorDrawModalCategoryForm): Promise<void> {
    try {
      const url = data.uid
        ? monitorDrawModalCategoryApi.update.url
        : monitorDrawModalCategoryApi.add.url
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
        url: monitorDrawModalCategoryApi.delete.url + `/${uid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async form(projectUid: string, uid: string): Promise<ProjectMonitorDrawModalCategoryForm> {
    try {
      const url = uid
        ? monitorDrawModalCategoryApi.form.url + `/${projectUid}/${uid}`
        : monitorDrawModalCategoryApi.form.url + `/${projectUid}`
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
