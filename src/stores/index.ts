import { defineStore, createPinia } from 'pinia'
import { GlobalState, ThemeConfigProps } from './interface'
import { DEFAULT_PRIMARY } from '@/config/config'
import piniaPersistConfig from '@/config/piniaPersist'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import { login, getAuthInfo } from '@/api/modules/user'
import { ElMessage } from 'element-plus'
// defineStore 调用后返回一个函数，调用该函数获得 Store 实体
export const GlobalStore = defineStore({
  // id: 必须的，在所有 Store 中唯一
  id: 'GlobalState',
  // state: 返回对象的函数
  state: (): GlobalState => ({
    ffmpeg: null,
    fetchFile: null,
    // token
    token: '',

    //用户信息
    userInfo: {
      user_id: null,
      user_phone: null,
      user_name: '',
      real_name: '',
      avatar: '',
      roles: []
    },
    // element组件大小
    assemblySize: 'default',
    // language
    language: 'zh-cn',
    // themeConfig
    themeConfig: {
      // 布局切换 ==>  纵向：vertical | 经典：classic | 横向：transverse | 分栏：columns
      layout: 'vertical',
      // 默认 primary 主题颜色
      primary: DEFAULT_PRIMARY,
      // 深色模式
      isDark: false,
      // 灰色模式
      isGrey: false,
      // 色弱模式
      isWeak: false,
      // 折叠菜单
      isCollapse: false,
      // 面包屑导航
      breadcrumb: true,
      // 面包屑导航图标
      breadcrumbIcon: true,
      // 标签页
      tabs: true,
      // 标签页图标
      tabsIcon: true,
      // 页脚
      footer: false,
      // 当前页面是否全屏
      maximize: false
    }
  }),
  getters: {
    isAdmin: state => {
      console.log(state.userInfo.roles)
      return state.userInfo.roles && state.userInfo.roles.includes('Admin')
    },
    isManage: state => {
      console.log(state.userInfo.roles)
      return state.userInfo.roles && state.userInfo.roles.includes('Manage')
    }
  },
  actions: {
    getFfmpeg() {
      this.fetchFile = fetchFile
      this.ffmpeg = createFFmpeg({
        corePath: './static/ffmpeg-core.js',
        log: false
      })
      if (!this.ffmpeg.isLoaded()) {
        this.ffmpeg.load().catch((err: any) => {
          console.log(err)
          ElMessage.warning('当前浏览器内存已满，请关闭浏览器后重新访问!')
        })
      }
    },
    // setToken
    setToken(token: string) {
      this.token = token
    },
    // setRoles
    setRoles(roles: string[]) {
      this.userInfo.roles = roles
    },
    // setUserInfo
    setUserInfo(userInfo: any) {
      this.userInfo = userInfo
    },
    // setAssemblySizeSize
    setAssemblySizeSize(assemblySize: string) {
      this.assemblySize = assemblySize
    },
    // updateLanguage
    updateLanguage(language: string) {
      this.language = language
    },
    // setThemeConfig
    setThemeConfig(themeConfig: ThemeConfigProps) {
      this.themeConfig = themeConfig
    },
    getUserAuth() {
      getAuthInfo().then((auth: any) => {
        const roles = auth.roles.map((item: any) => item.name)

        this.setRoles(roles)
      })
    },
    async userLogin(userName: string, password: string) {
      await login({ userName, password }).then((res: any) => {
        this.setToken(res.access_token)
        const userInfo = {
          user_id: res.userId,
          user_name: res.userName,
          real_name: res.realName,
          user_phone: res.phone,
          avatar: ''
        }

        this.setUserInfo(userInfo)
      })
    }
  },
  persist: piniaPersistConfig('GlobalState')
})

// piniaPersist(持久化)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia
