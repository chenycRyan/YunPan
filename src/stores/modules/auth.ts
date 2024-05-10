import { defineStore } from 'pinia'
import { AuthState } from '@/stores/interface'
import menuList from '@/assets/json/dynamicRouter.json'
import { getKeepAliveRouterName, getShowMenuList, getAllBreadcrumbList } from '@/utils'
import piniaPersistConfig from '@/config/piniaPersist'
// AuthStore
export const AuthStore = defineStore({
  id: 'AuthState',
  state: (): AuthState => ({
    // menuList 作为动态路由，不会做持久化存储
    authMenuList: [],
    // 当前页面的 router name，用来做按钮权限筛选
    routeName: ''
  }),
  getters: {
    // 后端返回的菜单列表
    authMenuListGet: state => state.authMenuList,
    // 后端返回的菜单列表 ==> 左侧菜单栏渲染，需要去除 isHide == true
    showMenuListGet: state => getShowMenuList(state.authMenuList),
    // 面包屑导航列表
    breadcrumbListGet: state => getAllBreadcrumbList(state.authMenuList),
    // 需要缓存的菜单 name，用作页面 keepAlive
    keepAliveRouterGet: state => getKeepAliveRouterName(state.authMenuList)
  },
  actions: {
    // getAuthMenuList
    async getAuthMenuList() {
      const { data } = menuList
      // @ts-expect-error
      this.authMenuList = data
    },
    // setRouteName
    async setRouteName(name: string) {
      this.routeName = name
    },
    getAdminMenuList(isAdmin: Boolean) {
      if (isAdmin) {
        this.authMenuList.forEach(ele => {
          if (ele.name === 'serviceMonitoring') {
            ele.meta.isHide = false
          }
        })
      }
      return getShowMenuList(this.authMenuList)
    }
  },
  persist: piniaPersistConfig('AuthState', ['authButtonList', 'routeName'])
})
