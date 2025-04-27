import 'element-plus/es/components/message/style/css'
//import { LOGIN_URL } from '@/config/config'
//import { useUserStore } from '@/store/modules/user'
import router from '@/router/index'
import { debounce } from 'xe-utils'

// ElMessage单例化
export function createMessage(options: any): void {
  // 如果存在消息关闭消息
  ElMessage.closeAll()
  ElMessage(options)
}

export const debounceCreateMessage = debounce(createMessage, 500)

export function checkStatus(status: number, msg: string): void {
  switch (status) {
    case 400:
      debounceCreateMessage({ type: 'error', message: msg })
      break
    // 401: 未登录
    // 未登录则跳转登录页面，并携带当前页面的路径
    // 在登录成功后返回当前页面，这一步需要在登录页操作。
    case 401:
      //const user = useUserStore()
      //user.setToken('')
      //router.replace(LOGIN_URL)
      debounceCreateMessage({
        type: 'error',
        message: msg || '用户没有权限（令牌、手机号、验证码错误）!',
      })
      setTimeout(() => location.reload(), 2000) // 2s钟后刷新页面强制跳转登录页面
      break
    case 403:
      debounceCreateMessage({ type: 'error', message: '用户得到授权，但是访问是被禁止的。!' })
      break
    // 404请求不存在
    case 404:
      debounceCreateMessage({ type: 'error', message: '网络请求错误,未找到该资源!' })
      break
    case 405:
      debounceCreateMessage({ type: 'error', message: '网络请求错误,请求方法未允许!' })
      break
    case 408:
      debounceCreateMessage({ type: 'error', message: '网络请求超时!' })
      break
    case 500:
      debounceCreateMessage({ type: 'error', message: '服务器错误!' })
      break
    case 501:
      debounceCreateMessage({ type: 'error', message: '网络未实现!' })
      break
    case 502:
      debounceCreateMessage({ type: 'error', message: '网络错误!' })
      break
    case 503:
      debounceCreateMessage({ type: 'error', message: '服务不可用，服务器暂时过载或维护!' })
      break
    case 504:
      debounceCreateMessage({ type: 'error', message: '网络超时!' })
      break
    case 505:
      debounceCreateMessage({ type: 'error', message: 'http版本不支持该请求!' })
      break
    default:
      debounceCreateMessage({ type: 'error', message: msg })
  }
}
