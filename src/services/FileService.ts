import request from '@/utils/request'
import { fileApi } from '@/services/api'

export const FileService = {
  async uploadFile(data: FormData): Promise<string> {
    try {
      // 调用上传接口，传入 FormData 作为文件数据
      let res = await request({
        url: fileApi.uploadFile.url,
        method: 'POST',
        data,
        headers: { 'Content-Type': 'multipart/form-data' }, // 动态修改请求头
      })
      // 如果上传成功，返回文件上传后的 URL 或其他相关信息
      return Promise.resolve(res.data)
    } catch (err) {
      console.error('File upload error:', err)
      return Promise.reject(err) // 抛出错误到调用方
    }
  },
}
