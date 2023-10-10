import http from '@/api'
import qs from 'qs'
/**
 * @name 文件分享
 */
// *
export const shareFile = <T>(data: any) => {
  return http.post<T>(`/user-file-share`, data)
}

/**
 * @name 检查分享权限
 */
// *
export const checkFileValid = (id: number, params: any) => {
  return http.get(`/user-file-share/check/${id}`, params)
}
/**
 * @name 获取分享的文件列表
 */
// *
export const getShareList = (id: number, params: any) => {
  return http.get(`/user-file-share/list/${id}`, params)
}
// * 文件下载
export const shareDownloadFile = (id: number, params: any) => {
  return http.get(`/user-file-share/auth/${id}/download`, params, { responseType: 'blob' })
}

/**
 * @name 获取分享的文件列表
 */
// *
export const getSharePage = (params: any) => {
  return http.get(`/user-file-share/page`, params)
}
/**
 * @name 让文件分享失效
 */
// *
export const loseShare = (params: any) => {
  return http.put(`/user-file-share/lose`, qs.stringify(params, { arrayFormat: 'repeat' }))
}
