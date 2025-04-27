// src/utils/request.ts
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { CustomResponse } from '@/types/api'

// 定义扩展的请求配置
interface CustomRequestConfig extends AxiosRequestConfig {
  retry?: number // 重试次数
  retryDelay?: number // 重试延迟时间
  preventRepeat?: boolean // 是否防止重复请求
  loading?: boolean // 是否显示loading
}

// 默认配置
const DEFAULT_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
}

class Request {
  private instance: AxiosInstance
  private pendingRequests = new Map()
  private retryCount = 2 // 默认重试次数
  private retryDelay = 1000 // 默认重试延迟

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config)

    // 请求拦截
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => this.requestInterceptor(config),
      (error: AxiosError) => Promise.reject(error),
    )

    // 响应拦截
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => this.responseInterceptor(response),
      (error: AxiosError) => this.responseErrorInterceptor(error),
    )
  }

  // 生成请求Key
  private generateReqKey(config: CustomRequestConfig): string {
    return [
      config.url,
      config.method,
      JSON.stringify(config.params),
      JSON.stringify(config.data),
    ].join('&')
  }

  // 添加请求到pending列表
  private addPendingRequest(config: CustomRequestConfig) {
    const key = this.generateReqKey(config)
    const controller = new AbortController()
    config.signal = controller.signal
    if (!this.pendingRequests.has(key)) {
      this.pendingRequests.set(key, controller)
    }
  }

  // 移除请求
  private removePendingRequest(config: CustomRequestConfig) {
    const key = this.generateReqKey(config)
    if (this.pendingRequests.has(key)) {
      this.pendingRequests.delete(key)
    }
  }

  // 请求拦截处理
  private async requestInterceptor(config: InternalAxiosRequestConfig) {
    // 自动携带token
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }

    // 防止重复请求
    if ((config as CustomRequestConfig).preventRepeat) {
      const key = this.generateReqKey(config)
      if (this.pendingRequests.has(key)) {
        const controller = this.pendingRequests.get(key)
        controller.abort('重复请求被取消')
      }
      this.addPendingRequest(config)
    }

    // 显示loading
    if ((config as CustomRequestConfig).loading) {
      // 这里可以添加loading组件显示逻辑
    }

    return config
  }

  // 响应拦截处理
  private responseInterceptor(response: AxiosResponse): CustomResponse {
    // 隐藏loading
    if (response.config.loading) {
      // 关闭loading逻辑
    }

    // 处理二进制数据
    if (response.config.responseType === 'blob') {
      return response.data
    }

    const { code, message, data } = response.data

    // 根据业务状态码处理
    if (code === 200) {
      return data
    } else {
      this.handleBusinessError(code, message)
      return Promise.reject(response.data)
    }
  }

  // 响应错误拦截处理
  private async responseErrorInterceptor(error: AxiosError) {
    const config = error.config as CustomRequestConfig

    // 隐藏loading
    if (config?.loading) {
      // 关闭loading逻辑
    }

    // 移除pending请求
    this.removePendingRequest(config)

    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    // 重试机制
    if (error.code === 'ECONNABORTED' || !error.response) {
      config.retry = config?.retry || this.retryCount
      if (config.retry > 0) {
        config.retry--
        await new Promise((resolve) => setTimeout(resolve, config.retryDelay || this.retryDelay))
        return this.instance(config)
      }
    }

    // HTTP状态码处理
    if (error.response) {
      const status = error.response.status
      const message = this.handleHttpError(status)
      ElMessage.error(message)
    } else {
      ElMessage.error('网络连接异常，请稍后重试！')
    }

    return Promise.reject(error)
  }

  // 处理业务错误
  private handleBusinessError(code: number, message: string) {
    const errorMap: Record<number, string> = {
      401: '登录已过期，请重新登录',
      403: '您没有权限操作',
      500: '服务器异常，请联系管理员',
    }

    if (code === 401) {
      // 跳转到登录页
      const userStore = useUserStore()
      userStore.logout()
      location.reload()
    }

    ElMessage.error(errorMap[code] || message || '未知错误')
  }

  // 处理HTTP错误
  private handleHttpError(status: number): string {
    const messageMap: Record<number, string> = {
      400: '请求错误',
      401: '未授权，请重新登录',
      403: '拒绝访问',
      404: '请求的资源不存在',
      408: '请求超时',
      500: '服务器内部错误',
      501: '服务未实现',
      502: '网关错误',
      503: '服务不可用',
      504: '网关超时',
      505: 'HTTP版本不受支持',
    }
    return messageMap[status] || '未知错误'
  }

  // 通用请求方法
  public request<T = any>(config: CustomRequestConfig): Promise<T> {
    return this.instance(config)
  }

  public get<T = any>(url: string, params?: object, config?: CustomRequestConfig): Promise<T> {
    return this.instance.get(url, { params, ...config })
  }

  public post<T = any>(url: string, data?: object, config?: CustomRequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  public put<T = any>(url: string, data?: object, config?: CustomRequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  public delete<T = any>(url: string, params?: object, config?: CustomRequestConfig): Promise<T> {
    return this.instance.delete(url, { params, ...config })
  }
}

// 创建请求实例
const request = new Request(DEFAULT_CONFIG)

export default request
