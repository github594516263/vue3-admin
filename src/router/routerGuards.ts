import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { AxiosCanceler } from '@/utils/axios/axiosCancel'
//import { useUserStore } from '@/store/modules/user'
//import { usePermissionStore } from '@/store/modules/permission'
//import { initDynamicRouter } from '@/router/modules/dynamicRouter'

//import { LOGIN_URL, WHITE_LIST } from '@/config/config'

const axiosCanceler = new AxiosCanceler()

NProgress.configure({
  easing: 'ease', // 动画方式
  speed: 500, // 递增进度条的速度
  showSpinner: false, // 是否显示加载ico
  trickleSpeed: 200, // 自动递增间隔
  minimum: 0.3, // 初始化时的最小百分比
})

export function createRouterGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    console.log('beforeEach', to.path, from.path)
    // 1.NProgress 开始
    NProgress.start()
    // 2.在跳转路由之前，清除所有的请求
    //axiosCanceler.removeAllPending()
    // 3.如果是白名单，直接放行
    //if (WHITE_LIST.includes(to.path)) return next()
    // 4.判断是否有 Token，没有重定向到 login
    //const user = useUserStore()
    //if (!user.token) return next({ path: LOGIN_URL, replace: true })
    // 5.如果没有菜单列表，就重新请求菜单列表并添加动态路由
    //const permission = usePermissionStore()
    //if (!permission.menuList.length) {
    //  await initDynamicRouter()
    //  return next({ ...to, replace: true })
    //}
    // 6.正常访问页面
    // if (to.path !== from.path) {
    //   next()
    // }
    next()
  })

  router.afterEach((to, from, failure) => {
    NProgress.done()
  })

  router.onError((error) => {
    NProgress.done()
  })
}
