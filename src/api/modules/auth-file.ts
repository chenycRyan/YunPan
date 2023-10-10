import http from '@/api'

/**
 * @data 根据群组分配文件夹
 * { "depIds": [],
     "fileCategoryIds": [],
     "type": "ZERO"
   }
 */
//
export const batchFolderByDep = (data: any) => {
  return http.put(`/user-file-auth/batch/category/dep`, data)
}
/**
 * @data 根据用户分配文件夹
 */
//
export const batchFolderByUser = (data: any) => {
  return http.put(`/user-file-auth/batch/category/user`, data)
}
/**
 * @data 批量文件分配到部门
 */
//
export const batchFileByDep = (data: any) => {
  return http.put(`/user-file-auth/batch/dep`, data)
}
/**
 * @data  批量文件分配到人
 */
//
export const batchFileByUser = (data: any) => {
  return http.put(`/user-file-auth/batch/user`, data)
}

/**
 * @data
 */
//
export const getFileUser = (data: any) => {
  return http.get(`/user-file-auth/list`, data)
}
