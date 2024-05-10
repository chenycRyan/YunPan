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
 * @data 根据文件/文件夹查询已分配的人员
 */
//
export const getFileUser = (data: any) => {
  return http.get(`/user-file-auth/list`, data)
}
/**
 * @data  文件夹批量分配不同账户不同权限
 */
//
export const batchFolders = (data: any) => {
  return http.put(`/user-file-auth/batch/category/user/enhance`, data)
}
/**
 * @data  文件批量分配不同账户不同权限
 */
//
export const batchFiles = (data: any) => {
  return http.put(`/user-file-auth/batch/user/enhance`, data)
}

/**
 * @data  删除单个用户的权限
 */
//
export const deleteUserAuth = (fileCategoryIds: string, userId: number) => {
  return http.delete(`/user-file-auth/delete/category?fileCategoryIds=${fileCategoryIds}&userId=${userId}`)
}
