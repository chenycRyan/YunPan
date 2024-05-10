import { createApp } from 'vue'
import App from './App.vue'
// reset style sheet
import '@/styles/reset.scss'
// CSS common style sheet
import '@/styles/common.scss'
// iconfont css
import '@/assets/iconfont/iconfont.scss'
// font css
import '@/assets/fonts/font.scss'
// element plus
import ElementPlus from 'element-plus'
import locale from 'element-plus/es/locale/lang/zh-cn'
// element icons
import * as Icons from '@element-plus/icons-vue'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
// element css
import 'element-plus/dist/index.css'
// element dark(内置暗黑模式)
import 'element-plus/theme-chalk/dark/css-vars.css'
// custom element dark(自定义暗黑模式)
import '@/styles/theme/element-dark.scss'
// custom element css
import '@/styles/element.scss'
// custom directives
import directives from '@/directives/index'
// pinia store
import pinia from '@/stores/index'
// vue Router
import router from '@/routers/index'
// svg icons
import 'virtual:svg-icons-register'
const app = createApp(App)

// 注册element Icons组件
Object.keys(Icons).forEach(key => {
  app.component(key, Icons[key as keyof typeof Icons])
})

app.use(pinia).use(router).use(directives).use(ElementPlus, { locale }).mount('#app')
