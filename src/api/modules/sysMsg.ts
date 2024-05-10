import http from '@/api'

/**
 * 获取系统消息列表
 */
export function getMsgPage(params: any) {
  return http.get(`/notice/user/page`, params)
}
/**
 * 获取消息详情
 * @param {*} id
 * @param {*} params
 * @returns
 */
export function getDetail(id: number, params: any) {
  return http.get(`/notice/${id}`, params)
}

/**
 * 读取公告
 * @param {*} id
 * @param {*} data
 * @returns
 */
export function readMsg(id: number, data: any) {
  return http.put(`/notice/read/${id}`, data)
}
/**
 * 全部已读
 * @param {*} data
 * @returns
 */
export function readAll(data: any) {
  return http.put(`/notice/read`, data)
}

export function publishMsg(data: any) {
  return http.post(`/notice/publish`, data)
}

export function modifyMsg(data: any) {
  return http.put(`/notice/${data.id}`, data)
}

export function deleteMsg(id: number) {
  return http.delete(`/notice/${id}`)
}
export function resetPublish(id: number) {
  return http.put(`/notice/${id}/resetPublish`)
}
