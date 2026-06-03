import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { clearAuthToken, getAuthToken } from '@/utils/auth'
import { useScreenApiClient } from '@/utils/displayAccess'
import {
  beginRequestLoading,
  endRequestLoading,
  resetRequestLoading,
} from '@/stores/requestLoading'
// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 50000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' },
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    beginRequestLoading()
    const headers = config.headers as any
    headers['x-client-system'] = useScreenApiClient() ? 'screen' : 'scada'
    const token = getAuthToken()
    if (token) {
      headers['x-token'] = token
      headers.satoken = token
    }

    return config
  },
  (error: any) => {
    endRequestLoading()
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    endRequestLoading()
    // 假设 response.data 是 Blob 类型，表示文件下载
    if (response.config.responseType === 'blob') {
      // 获取 Content-Disposition 响应头
      const contentDisposition = response.headers['content-disposition']

      // 正则提取文件名
      const fileNameMatch = contentDisposition?.match(/filename\*=UTF-8''(.+)|filename="(.+)"/)
      const fileName = decodeURIComponent(
        fileNameMatch?.[1] || fileNameMatch?.[2] || 'download.xlsx',
      )

      // 创建一个 blob 链接
      const blob = new Blob([response.data])
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return Promise.resolve(response)
    }

    // 其他响应处理
    if (response.data && response.data.code !== undefined) {
      // 处理带有 code 和 msg 的响应
      // 之前的处理逻辑
      const { code, msg } = response.data
      // code 根据情况处理
      switch (code) {
        case 0:
          if (msg) {
            if (window.$message) {
              window.$message.success(msg)
            }
          }
          return response.data
        case 501:
          clearAuthToken()
          window.$message.error('登陆失效，请重新登陆')
          break
      }
      window.$message.error(msg || '系统出错')
      return Promise.reject(new Error(msg || 'Error'))
    }
    window.$message.error('系统出错')
    return response.data
  },
  (error: any) => {
    endRequestLoading()
    if (error.response?.data) {
      const { code, msg } = error.response.data
      // token 过期，跳转登录页
      if (code === 501) {
        clearAuthToken()
        window.$message.error('登陆失效，请重新登陆')
      } else {
        window.$message.error(msg || '系统出错')
      }
    } else {
      window.$message.error('服务器异常，请稍后再试')
    }
    if (!error.response) {
      resetRequestLoading()
    }
    return Promise.reject(error.message)
  },
)

// 导出 axios 实例
export default service
