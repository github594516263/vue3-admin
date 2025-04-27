// axios配置  可自行根据项目进行更改，只需更改该文件即可，其他文件可以不动
import { VAxios } from './Axios'
import { AxiosTransform } from './axiosTransform'
import axios, { type AxiosResponse } from 'axios'
import { checkStatus, debounceCreateMessage } from './checkStatus'
import { ContentTypeEnum, RequestEnum, StatusEnum } from '@/enums/httpEnum'

import { is, isArray, isString } from '@/utils/is'
import { setObjToUrlParams } from '@/utils/urlUtils'

import type { RequestOptions, Result } from './types'
//import { useUserStore } from '@/store/modules/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message-box/style/css'

const isDev = import.meta.env.MODE === 'development'

/**
 * @description: 数据处理，方便区分多种处理方式
 */
const transform: AxiosTransform = {
  /**
   * @description: 处理请求数据
   */
  transformRequestData: (res: AxiosResponse<Result>, options: RequestOptions) => {
    const {
      isTransformResponse = true,
      isShowSuccessMsg = false,
      isShowErrorMsg = true,
      successMessageText,
      errorMessageText,
    } = options
    if (res?.status !== 200) {
      const status = res?.status ?? -1
      const statusText = res?.statusText ?? '网络请求发生异常'
      isDev &&
        ElMessage({
          type: 'error',
          message: 'status: ' + status + ',' + ' statusText: ' + statusText,
        })
      throw new Error('status: ' + status + ',' + ' statusText: ' + statusText)
    }

    if (!res.data) {
      const msg = 'data为空，服务异常，没有数据返回！'
      isDev &&
        ElMessage({
          type: 'error',
          message: res.config.url + msg,
        })
      throw new Error(res.config.url + msg) // TODO 没有生效？
    }

    //  这里 success, errCode, errMessage, data为 后台统一的字段，需要在 basicModel.ts内修改为项目自己的接口返回格式
    const { success, errCode, errMessage, data } = res.data

    // 是否显示正确后的提示信息，发生错误无论如何均要提示
    if (success) {
      isShowSuccessMsg &&
        ElMessage({
          type: 'success',
          message: successMessageText || errMessage?.trim() || '网络请求成功！',
        })
    } else {
      isShowErrorMsg &&
        ElMessage({
          type: 'error',
          message: errorMessageText || errMessage?.trim() || '网络请求失败！',
        })
    }

    // 不进行任何处理，直接返回
    // 用于页面代码可能需要直接获取success, errCode, errMessage, data这些信息时开启
    if (!isTransformResponse) {
      return res.data
    }

    // 接口请求成功，直接返回结果
    if (success) {
      return data
    }

    // return Promise.reject(new Error(errMessage.trim() ?? '发生未知异常'))
  },

  // 请求之前处理config
  beforeRequestHook: (config, options) => {
    const { apiUrl, urlPrefix, joinParamsToUrl, isParseToJson = true } = options

    config.url = isDev ? `${urlPrefix}${config.url}` : `${apiUrl || ''}${config.url}`

    if (config.method === RequestEnum.GET) {
      const now = new Date().getTime()
      if (!isString(config.params)) {
        config.data = {
          // 给 get 请求加上时间戳参数，避免从缓存中拿数据。
          params: Object.assign(config.params || {}, {
            _t: now,
          }),
        }
      } else {
        // 兼容restful风格
        config.url = config.url + config.params + `?_t=${now}`
        config.params = {}
      }
    } else {
      config.data = config.params
      config.params = {}
      if (joinParamsToUrl) {
        config.url = setObjToUrlParams(config.url as string, config.data)
        delete config.data
      }
    }
    return config
  },

  /**
   * @description: 请求拦截器处理
   */
  requestInterceptors: (config) => {
    // 请求之前处理config
    // const user = useUserStore()
    // const token = user.token
    //if (token) {
    //  config.headers.Authorization = token
    //}

    return config
  },

  /**
   * @description: 响应错误处理
   */
  responseInterceptorsCatch: (error: any) => {
    const { response, code, message } = error || {}
    const msg: string =
      response && response.data && response.data.errMessage ? response.data.errMessage : ''
    const err: string = error.toString()
    try {
      if (code === 'ECONNABORTED' && message.indexOf('timeout') !== -1) {
        ElMessage({
          type: 'error',
          message: '接口请求超时,请刷新页面重试!',
        })
        return
      }
      if (err && err.includes('Network Error')) {
        console.error('请检查您的网络连接是否正常')
        return
      }
    } catch (error: any) {
      throw new Error(error)
    }
    // 请求是否被取消
    const isCancel = axios.isCancel(error)
    if (!isCancel) {
      checkStatus(error.response && error.response.status, msg)
    } else {
      console.warn(error, '请求被取消！')
    }
    return error
  },
}

// 获取接口地址
export const getBaseUrl = () => {
  const mode = import.meta.env.MODE
  // 如果是开发模式，则使用代理地址
  if (mode === 'development') {
    console.log('url:', import.meta.env.VITE_APP_API_URL)
    return import.meta.env.VITE_APP_API_URL
  } else {
    return `${location.origin}/ctms`
  }
}

const Axios = new VAxios({
  timeout: 30 * 1000,
  // 基础接口地址
  // baseURL: 'http://172.16.81.63:8090',
  // 接口可能会有通用的地址部分，可以统一抽取出来
  // prefixUrl: prefix,
  headers: { 'Content-Type': ContentTypeEnum.JSON },
  // 数据处理方式
  transform,
  // 配置项，下面的选项都可以在独立的接口请求中覆盖
  requestOptions: {
    // 默认将prefix 添加到url
    joinPrefix: true,
    // url默认前缀，代理时使用
    urlPrefix: '/api',
    // 需要对返回数据进行处理
    isTransformResponse: true,
    // post请求的时候添加参数到url
    joinParamsToUrl: false,
    // 格式化提交参数时间
    formatDate: true,
    // 消息提示类型
    errorMessageMode: 'none',
    // 接口地址
    apiUrl: getBaseUrl(),
  },
  withCredentials: false,
})

export default Axios
