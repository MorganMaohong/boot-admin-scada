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
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async getProjectName(uid: string): Promise<String> {
    try {
      let res = await request({
        url: projectApi.getProjectName.url + `/${uid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
}
