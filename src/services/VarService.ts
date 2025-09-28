import request from '@/utils/request'

import type { VarComportGroupData, VarForm, VarQuery, VarQueryData, VarVo } from '@/model/var'
import type { PageVo } from '@/model'
import { variableApi } from '@/services/api'
import { getUrlParams } from '@/utils'

export const VarService = {
  async selectGroup(gatewayUid: string): Promise<VarComportGroupData> {
    try {
      let res = await request({
        url: variableApi.selectGroup.url + `/${gatewayUid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async selectVarCacheData(gatewayUid: string): Promise<Record<string, string>> {
    try {
      let res = await request({
        url: variableApi.selectVarCacheData.url + `/${gatewayUid}`,
        method: 'POST',
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async selectVarCacheDataBySnList(data: string[]): Promise<Record<string, string>> {
    try {
      let res = await request({
        url: variableApi.selectVarCacheData.url,
        method: 'POST',
        data,
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async select(data: VarQuery): Promise<PageVo<VarVo, VarQueryData>> {
    try {
      let res = await request({
        url: variableApi.select.url,
        method: 'POST',
        data,
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async form(gatewayUid: string, uid: string): Promise<VarForm> {
    try {
      const url = uid
        ? `${variableApi.form.url}/${gatewayUid}/${uid}`
        : `${variableApi.form.url}/${gatewayUid}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async addOrUpdate(data: VarForm): Promise<void> {
    try {
      const url = data.uid ? variableApi.update.url : variableApi.add.url
      let res = await request({
        url,
        method: 'POST',
        data,
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async copy(uid: string): Promise<void> {
    try {
      const url = variableApi.copy.url + `/${uid}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async delete(uid: string): Promise<void> {
    try {
      const url = variableApi.delete.url + `/${uid}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async deleteds(data: string[]): Promise<void> {
    try {
      const url = variableApi.deletePatch.url
      let res = await request({
        url,
        method: 'POST',
        data,
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async write(uid: string, controlValue: string): Promise<void> {
    try {
      const projectUid = getUrlParams().projectUid
      const url = variableApi.write.url + `/${projectUid}/${uid}/${controlValue}`
      let res = await request({
        url,
        method: 'POST',
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async uploadVarExcel(gatewayUid: string, groupUid: string, data: FormData): Promise<void> {
    try {
      const url = variableApi.uploadVarExcel.url + `/${gatewayUid}/${groupUid}`
      let res = await request({
        url,
        method: 'POST',
        data,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async exportVarExcel(gatewayUid: string): Promise<void> {
    try {
      const url = variableApi.exportVarExcel.url + `/${gatewayUid}`
      let res = await request({
        url,
        method: 'POST',
        responseType: 'blob',
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
  async downloadTemplate(): Promise<void> {
    try {
      const url = variableApi.downloadTemplate.url
      let res = await request({
        url,
        method: 'POST',
        responseType: 'blob',
      })
      return Promise.resolve(res.data)
      // 确保类型安全
    } catch (err) {
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
}
