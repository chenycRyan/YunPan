import http from '@/api'
import qs from 'qs'
/**
 * 用户登录
 * @export restPassword
 * @param {*}userId
 */
export const login = (data: any) => {
  return http.post('/users/common/login', data)
}
/**
 * 用户登录
 * @export restPassword
 * @param {*}userId
 */
export const getAuthInfo = () => {
  return http.get('/users/common/auth-info')
}
/**
 * 分配角色
 * @export restPassword
 * @param {*}userId
 */
export const setRoles = (id: number, data: any) => {
  return http.put(`users/admin/${id}/roles`, data)
}
/**
 * 重置密码
 * @export restPassword
 * @param {*}userId
 */
export function restPassword(userId: number) {
  return http.put(`/users/admin/${userId}/default-password`)
}
/**
 * 获取用户列表
 * @export getUserPage
 * @param {*}params
 */
export function getUserPage<T>(params: any) {
  return http.get<T>(`/users/admin/page`, params)
}
/**
 * 获取用户列表
 * @export getUserPage
 * @param {*}params
 */
export function getUserList<T>(params: any) {
  return http.get<T>(`/users/admin/list/users`, params)
}
/**
 * 添加用户
 * @param {*} data 添加用户
 */
export function addUser(data: any) {
  return http.post(`/users/admin`, data)
}
/**
 * 修改用户信息
 * @export modifyUserInfo
 * @param {*}userId
 */
export function modifyUserInfo(userId: number, data: any) {
  return http.put(`/users/common/${userId}/base-info`, data)
}
/**
 * 用户注册
 * @export registerUser
 * @param {*}data
 */
export function registerUser(data: any) {
  return http.post(`/users/common/register`, data)
}
/**
 * 用户注册
 * @export registerUser
 * @param {*}data
 */
export function updateUserPassword(id: number, data: any) {
  return http.put(`/users/common/${id}/password`, data)
}
/**
 * 用户冻结
 * @export lockUser
 * @param {*}id
 */
export function lockUser(id: number) {
  return http.put(`/users/admin/${id}/lock`)
}
/**
 * 用户解冻
 * @export unLockUser
 * @param {*}id
 */
export function unLockUser(id: number) {
  return http.put(`/users/admin/${id}/unlock`)
}
/**
 * 在线用户查询
 * @export onlineUserPage
 * @param {*}params
 */
export function onlineUserPage(params: Object) {
  return http.get(`/users/common/online/page`, params)
}

/**
 * 获取超管人员
 * @export getAdminList
 * @param {*}
 */
export function getAdminList() {
  return http.get(`/users/admin/page?roleIds=103041&isDeleted=false&sort=createdTime,DESC`)
}
