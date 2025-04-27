import type { AxiosRequestConfig } from 'axios'
import { AxiosTransform } from './axiosTransform'
//import { BasicResModel } from '@/api/model/basicModel'

export interface CreateAxiosOptions extends AxiosRequestConfig {
  prefixUrl?: string
  transform?: AxiosTransform
  requestOptions?: RequestOptions
}

export interface RequestOptions {
  // 请求参数拼接到url
  joinParamsToUrl?: boolean
  // 格式化请求参数时间
  formatDate?: boolean
  //  是否处理请求结果
  isTransformResponse?: boolean
  // 是否显示成功提示信息
  isShowSuccessMsg?: boolean
  // 是否显示错误提示信息
  isShowErrorMsg?: boolean
  // 是否解析成JSON
  isParseToJson?: boolean
  // 成功的文本信息
  successMessageText?: string
  // 错误的文本信息
  errorMessageText?: string
  // 是否加入url
  joinPrefix?: boolean
  // url前缀
  urlPrefix?: string
  // 接口地址， 不填则使用默认apiUrl
  apiUrl?: string | boolean | undefined
  // 错误消息提示类型
  errorMessageMode?: 'none' | 'modal'
}

export interface Result<T = any> {
  message: string
  code: number | string
  data: T
  currentPage: number | string
  pageSize: number | string
  startPage: number | string
  status: number | string
  totalPage: number | string
  totalRows: number | string
}
