// import { GET, POST } from '@/utils/axios'
import http from '@/api'
export const getServeInfo = () => {
  return http.get('/server/monitor')
}

/**
 * 获取登录日志列表页面
 *
 * @param {*} params
 */
export function getLoginLogPageList(params: any) {
  return http.get(`/loginlog/page`, params)
}
