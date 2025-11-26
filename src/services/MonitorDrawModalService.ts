import request from '@/utils/request.ts'
import { monitorDrawModalApi } from '@/services/api/index.ts'
import type { OptionVo } from '@/model'
import type { Project } from '@/model/project'
import type { ProjectMonitorDrawModalForm } from '@/model/modal'

export const MonitorDrawModalService = {
  async addOrUpdate(data: ProjectMonitorDrawModalForm): Promise<void> {
    try {
      const url = data.uid ? monitorDrawModalApi.update.url : monitorDrawModalApi.add.url
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
        url: monitorDrawModalApi.delete.url + `/${uid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async form(projectUid: string, uid: string): Promise<void> {
    try {
      const url = uid
        ? monitorDrawModalApi.form.url + `/${projectUid}/${uid}`
        : monitorDrawModalApi.form.url + `/${projectUid}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async select(projectUid: string): Promise<ProjectMonitorDrawModalForm> {
    try {
      let res = await request({
        url: monitorDrawModalApi.select.url + `/${projectUid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
}
