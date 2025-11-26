import request from '@/utils/request'
import { fileApi } from '@/services/api'

export const FileService = {
  async uploadFile(data: FormData): Promise<string> {
    try {
      let res = await request({
        url: fileApi.uploadFile.url,
        method: 'POST',
        data,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return Promise.resolve(res.data)
    } catch (err) {
      console.error('File upload error:', err)
      return Promise.reject(err)
    }
  },
}
