import request from '@/utils/request'
import type { Project } from '@/model/project'

import { projectApi } from '@/services/api'

export const ProjectService = {
  async selectAll(): Promise<Project[]> {
    try {
      let res = await request({
        url: projectApi.selectAll.url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
  async getProjectName(uid: string): Promise<string> {
    try {
      let res = await request({
        url: projectApi.getProjectName.url + `/${uid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
    } catch (err) {
      return Promise.reject(err)
    }
  },
}
