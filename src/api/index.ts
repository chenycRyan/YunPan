import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
// showFullScreenLoading
import { tryHideFullScreenLoading } from '@/config/serviceLoading'

import { ResultEnum } from '@/enums/httpEnum'
import { showMessage } from './status'
import { ElMessage } from 'element-plus'
import { GlobalStore } from '@/stores'
import { LOGIN_URL } from '@/config/config'
import router from '@/routers'

// 批量同类型异常请求，只提示一次
let eleMsg: any
const newMessage = (op: any) => {
  if (eleMsg) {
    eleMsg.close()
  }
  eleMsg = ElMessage(op)
}

const config = {
  // 默认地址请求地址，可在 .env 开头文件中修改
  baseURL: (window as any).appsetings.base_URL as string,
  // 设置超时时间（10s）
  timeout: ResultEnum.TIMEOUT as number,
  // 跨域时候允许携带凭证
  withCredentials: true
}

class RequestHttp {
  service: AxiosInstance
  public constructor(config: AxiosRequestConfig) {
    // 实例化axios
    this.service = axios.create(config)

    /**
     * @description 请求拦截器
     * 客户端发送请求 -> [请求拦截器] -> 服务器
     * token校验(JWT) : 接受服务器返回的token,存储到vuex/pinia/本地储存当中
     */
    this.service.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        const globalStore = GlobalStore()
        // * 如果当前请求不需要显示 loading,在 api 服务中通过指定的第三个参数: { headers: { noLoading: true } }来控制不显示loading，参见loginApi
        // config.headers!.noLoading || showFullScreenLoading()
        const token: string = globalStore.token
        let headers = { ...config.headers }
        if (token) headers = { ...config.headers, Authorization: `Bearer ${token}` }

        return { ...config, headers: headers }
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )

    /**
     * @description 响应拦截器
     *  服务器换返回信息 -> [拦截统一处理] -> 客户端JS获取到信息
     */
    this.service.interceptors.response.use(
      (response: AxiosResponse) => {
        const { data } = response
        tryHideFullScreenLoading()

        return data
      },
      async (error: AxiosError) => {
        tryHideFullScreenLoading()
        const { message, response, code } = error
        if (response && response.status == 415) {
          localStorage.clear()
          const globalStore = GlobalStore()
          globalStore.setToken('')
          newMessage({ message: '请先申请授权码, 通过审核后在此进行授权方可使用软件', type: 'error', duration: 6000 })
          router.push('/license')
          return
        } else if (response && response.status == 401) {
          localStorage.clear()
          const globalStore = GlobalStore()
          globalStore.setToken('')
          router.replace(LOGIN_URL)
          newMessage({ message: '用户状态已失效，请重新登录！', type: 'error' })
          router.push('/login')
          return
        }
        if (response || message) {
          console.log(response)
          console.log(response?.config.responseType)
          let msg
          if (response?.config.responseType === 'blob') {
            const reader = new FileReader()
            reader.readAsText(new Blob([response.data]), 'utf-8') // 按照utf-8编码解析
            reader.onload = res => {
              msg = res.target?.result
              newMessage({ message: msg, type: 'error' })
            }
          } else {
            msg = response
              ? response.data && typeof response.data == 'string'
                ? response.data
                : showMessage(response.status)
              : message
            if (msg.toString().length > 100 || !msg) msg = `服务器发生错误，错误代码：${code}`
            newMessage({ message: msg, type: 'error' })
          }
        }

        // 服务器结果都没有返回(可能服务器错误可能客户端断网)，断网处理:可以跳转到断网页面
        if (!window.navigator.onLine) router.replace('/500')
        return Promise.reject(error)
      }
    )
  }

  // * 常用请求方法封装
  get<T>(url: string, params?: object, _object = {}): Promise<T> {
    return this.service.get(url, { params, ..._object })
  }
  post<T>(url: string, params?: object, _object = {}): Promise<T> {
    return this.service.post(url, params, _object)
  }
  put<T>(url: string, params?: object, _object = {}): Promise<T> {
    return this.service.put(url, params, _object)
  }
  delete<T>(url: string, params?: any, _object = {}): Promise<T> {
    return this.service.delete(url, { params, ..._object })
  }
}

export default new RequestHttp(config)
