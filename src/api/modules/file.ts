import http from '@/api'
import qs from 'qs'
import axios from 'axios'
const source = axios.CancelToken.source()

export { source }
// * 查询列表
export const getFileList = (params: any) => {
  const obj: { [key: string]: any } = {}
  Object.keys(params).forEach(item => {
    if (params[item] !== null) {
      obj[item] = params[item]
    }
  })
  return http.get(`/file-folder/auth/list`, obj)
}
/**
 * @name 文件上传
 */
// * 文件上传
export const uploadFile = (id: number, type: string, data: any) => {
  let str = `?type=${type}`
  if (id) str = str + `&fileCategoryId=${id}`
  return http.post(`/file-folder/folder/upload${str}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
// * 文件下载
export const downloadFile = (id: any) => {
  return http.get(`/user-file-auth/auth/${id}/download`, {}, { responseType: 'blob' })
}
// * 文件下载
export const downloadFileToZip = (params: any) => {
  return http.get(`/file/download/zip?${qs.stringify(params, { arrayFormat: 'repeat' })}`, {}, { responseType: 'blob' })
}
// * 文件下载
export const getFileOrion = (id: any) => {
  return http.get(`/user-file-auth/auth/${id}/download`)
}
// * 文件删除
export const batchDeleteFile = (data: any, flag: boolean = true) => {
  return http.delete(`/file-folder/batch`, null, {
    data: {
      flag: flag,
      ids: data
    }
  })
}
// * 文件批量移动
export const batchMoveFile = (data: any) => {
  return http.put(`/file-folder/batch/move`, data)
}
// * 文件拷贝到其他的文件夹
export const batchCopyFile = (data: any) => {
  return http.post(`/file-folder/batch/copy`, data)
}
// * 重命名文件
export const renameFile = (data: any) => {
  return http.post(`/file-folder/update`, data)
}
// * 检查文件是否存在
export const checkFileByMd5 = (params: any) => {
  return http.get(`/file/check`, params)
}
interface chunkForm {
  chunkSize: string
  chunkTotal: string
  fileName: string
  fileSize: string
  index: string
  md5: string
  type: string
}
// * 上传切片文件
export const uploadChunkFile = (chunkForm: chunkForm, data: any) => {
  let str = `?type=${chunkForm.type}`
  if (chunkForm.chunkSize) str = str + `&chunkSize=${chunkForm.chunkSize}`
  if (chunkForm.chunkTotal) str = str + `&chunkTotal=${chunkForm.chunkTotal}`
  if (chunkForm.fileName) str = str + `&fileName=${chunkForm.fileName}`
  if (chunkForm.fileSize) str = str + `&fileSize=${chunkForm.fileSize}`
  if (chunkForm.index) str = str + `&index=${chunkForm.index}`
  if (chunkForm.md5) str = str + `&md5=${chunkForm.md5}`
  return http.post(`/file/upload/chunk${str}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
// * 绑定大文件到文件夹
export const bindBigFile = (fileCategoryId: string, fileId: string) => {
  let str = `?fileId=${fileId}`
  if (fileCategoryId) str = str + `&fileCategoryId=${fileCategoryId}`
  return http.post(`/file-folder/folder/big/upload${str}`)
}

interface downloadForm {
  chunkSize: number
  chunkTotal: number
  fileName: string
  index: number
  md5: string
}
// * 文件下载
export const downloadBigFile = (data: downloadForm) => {
  return http.post(`/file/big/download`, data, { responseType: 'blob' })
}

/**
 * @name 小文件上传
 */
// * 小文件上传
export const uploadSmallFile = (formData: any) => {
  return http.post(`/file/upload/ffmpeg`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * @name 小文件下载接口
 */
// * 小文件下载
export const downLoadSmallFile = (params: any, config: any) => {
  return http.get(`/file/download/ffmpeg`, params, {
    responseType: 'blob',
    ...config
  })
}

/**
 * @name 小文件新增接口
 */
// * 小文件上传
export const addSmallFile = (data: any) => {
  return http.post(`/file`, data)
}

/**
 * 查询文件列表
 */
export const getFilesList = (params: Object) => {
  return http.get(`/file-folder/list/`, params)
}
/**
 * 添加浏览历史
 */
export const addBrowserHistory = (id: any) => {
  return http.post(`/file-folder/history/` + id)
}
/**
 * 查询浏览记录
 */
export const getBrowserHistoryList = () => {
  return http.get(`/file-folder/history`)
}
/**
 * 收藏文件
 */
export const starFile = (id: any) => {
  return http.post(`/file-folder/star/` + id)
}
/**
 * 取消收藏文件
 */
export const cancelStarFile = (id: any) => {
  return http.put(`/file-folder/un-star/` + id)
}
/**
 * 浏览历史统计
 */
export const browserHistoryDate = () => {
  return http.get(`/file-folder/statistics/history`)
}
/**
 * 浏览历史统计
 */
export const starHistoryDate = () => {
  return http.get(`/file-folder/statistics/star`)
}

/**
 * 文件格式校验
 */
export const checkFileType = (formData: any) => {
  return http.post(`/file/check-file-type`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 文件操作日志分页列表
 */
export const getfileLogPage = (params: any) => {
  return http.get(`/file-log/page`, params)
}
/**
 * 文件操作日志列表
 */
export const getfileLogList = (params: any) => {
  return http.get(`/file-log/list`, params)
}
/**
 * 删除文件操作日志
 */
export const deletefileLogById = (id: number) => {
  return http.delete(`/file-log/` + id)
}

/**
 * 增加文件操作日志
 * @params {Object} level: 'info', message: 'string', type:'CREATE_FILE'
 */
export const addfileLogById = (params: object) => {
  return http.post(`/file-log`, params)
}
/**
 * 文件溯源
 *
 */
export const getFileTraces = (formData: FormData) => {
  return http.post(`/file/get/file-type`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
