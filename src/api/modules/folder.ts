import http from '@/api'
// * 获取文件夹下的子文件夹
export const getFolderList = <U extends Object, T>(params: U) => {
  return http.get<T>(`/file-category/auth/list`, params)
}

// * 获取文件夹下的子文件夹
export const getSonFolder = <T>(params: any) => {
  return http.get<T>(`/file-category/batch/son`, params)
}
// * 文件夹批量删除(假删)
export const batchDeleteFolder = (data: any, flag: boolean = true) => {
  return http.delete(`/file-category/batch`, null, {
    data: {
      flag: flag,
      ids: data
    }
  })
}
// * 文件夹批量删除(真删)
export const batchDeleteFolderTrue = (data: any) => {
  return http.delete(`/file-folder/batch/true`, null, {
    data
  })
}
// * 文件夹批量移动
export const batchMoveFolder = (data: any) => {
  return http.post(`/file-category/batch/move`, data)
}
// * 文件夹批量复制
export const batchCopyFolder = (data: any) => {
  return http.post(`/file-category/batch/copy`, data)
}
// * 文件夹创建
export const addFolder = (data: any) => {
  return http.post(`/file-category`, data)
}
// * 修改文件夹-重命名/移动/权限
export const modifyFolder = (data: any) => {
  return http.post(`/file-category/update`, data)
}
// * 批量公开修改文件夹权限
export const batchSetFolder = (ids: string, currentId: number) => {
  return http.post(`/file-category/update/common?ids=${ids}&currentId=${currentId}`)
}

// * 批量添加文件夹
export const batchAddFolder = (data: any) => {
  return http.post(`/file-category/path/batch/son`, data)
}

// * 查询文件下的各类文件数量
export const calculateFolder = (id: number) => {
  return http.get(`/file-category/calculate?id=${id}`)
}

// * 查询公用文件
export const getCommomFolder = () => {
  return http.get(`/file-category/find/common`)
}
