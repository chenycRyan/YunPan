import http from '@/api'

/**
 * @data 群组更新
 */
//
export const updateDepartment = (id: number, data: any) => {
  return http.put(`/departments/${id}`, data)
}
/**
 * @data 群组更新
 */
//
export const batchUpdateMember = (data: any) => {
  return http.put(`/departments/batch/user`, data)
}
/**
 * @data 获取自己的群组
 */
//
export const getAuthDepartment = () => {
  return http.get(`/departments/auth/list`)
}
