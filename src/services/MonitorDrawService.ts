import request from '@/utils/request.ts'
import { useScreenApiClient } from '@/utils/displayAccess.ts'
import { monitorDrawApi } from '@/services/api/index.ts'
import type {
  ProjectMonitorDraw,
  ProjectMonitorDrawDisplay,
  ProjectMonitorDrawForm,
  ProjectMonitorSaveForm,
  ProjectMonitorVo,
  ProjectQuery,
} from '@/model/draw'
import type { OptionVo } from '@/model'
import type { Project } from '@/model/project'

export const MonitorDrawService = {
  async addOrUpdate(data: ProjectMonitorDrawForm): Promise<void> {
    try {
      const url = data.uid ? monitorDrawApi.update.url : monitorDrawApi.add.url
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
  async addOrUpdateModal(data: ProjectMonitorDrawForm): Promise<void> {
    try {
      const url = data.uid ? monitorDrawApi.updateModal.url : monitorDrawApi.addModal.url
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
  async save(data: string, uid: string): Promise<void> {
    try {
      const url = monitorDrawApi.save.url + `/${uid}`
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
        url: monitorDrawApi.delete.url + `/${uid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async selectByUid(uid: string): Promise<ProjectMonitorDraw> {
    try {
      let res = await request({
        url: monitorDrawApi.selectByUid.url + `/${uid}`,
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
        ? monitorDrawApi.form.url + `/${projectUid}/${uid}`
        : monitorDrawApi.form.url + `/${projectUid}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async formModal(projectUid: string, uid: string): Promise<void> {
    try {
      const url = uid
        ? monitorDrawApi.formModal.url + `/${projectUid}/${uid}`
        : monitorDrawApi.formModal.url + `/${projectUid}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async select(projectUid: string): Promise<ProjectMonitorVo> {
    try {
      let res = await request({
        url: monitorDrawApi.select.url + `/${projectUid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async selectModal(projectUid: string): Promise<ProjectMonitorVo> {
    try {
      let res = await request({
        url: monitorDrawApi.selectModal.url + `/${projectUid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async display(projectUid: string, drawUid?: string): Promise<ProjectMonitorDrawDisplay> {
    try {
      const url = useScreenApiClient()
        ? drawUid
          ? `/projectScreen/scadaPreview/${projectUid}/${drawUid}`
          : `/projectScreen/scadaPreview/${projectUid}`
        : drawUid
          ? monitorDrawApi.display.url + `/${projectUid}/${drawUid}`
          : monitorDrawApi.display.url + `/${projectUid}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async options(projectUid: string): Promise<OptionVo[]> {
    try {
      let res = await request({
        url: monitorDrawApi.options.url + `/${projectUid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async modalOptions(projectUid: string): Promise<OptionVo[]> {
    try {
      let res = await request({
        url: monitorDrawApi.modalOptions.url + `/${projectUid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async getAllGatewayVar(projectUid: string): Promise<OptionVo[]> {
    try {
      let res = await request({
        url: monitorDrawApi.getAllGatewayVar.url + `/${projectUid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async uploadFile(data: FormData): Promise<string> {
    try {
      let res = await request({
        url: monitorDrawApi.uploadFile.url,
        method: 'POST',
        data,
        headers: { 'Content-Type': 'multipart/form-data' }, // 动态修改请求头
      })

      return Promise.resolve(res.data)
    } catch (err) {
      console.error('File upload error:', err)
      return Promise.reject(err)
    }
  },
  async images(): Promise<string[]> {
    try {
      let res = await request({
        url: monitorDrawApi.images.url,
        method: 'POST',
      })

      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async selectByProjectUid(projectUid: string): Promise<ProjectMonitorDraw[]> {
    try {
      let res = await request({
        url: monitorDrawApi.selectByProjectUid.url + `/${projectUid}`,
        method: 'POST',
      })

      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async selectProject(data: ProjectQuery, currentProjectUid: string): Promise<Project[]> {
    try {
      let res = await request({
        url: monitorDrawApi.selectProject.url + `/${currentProjectUid}`,
        method: 'POST',
        data,
      })

      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
}
