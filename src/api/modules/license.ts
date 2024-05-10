import http from '@/api'

export function setAuth(key: string) {
  return http.post(`/aes?param=${key}`)
}
export function getSystemAuth() {
  return http.get(`/aes/get`)
}
export function getAuthKey(params: any) {
  return http.get(`/aes/get/key`, params)
}
export function setLicense(data: any) {
  return http.post(`/license/submit`, data)
}

export function getLicense() {
  return http.get(`/license/baseInfo`)
}
export function getLicenseCode(data: any) {
  return http.post(`/license/apply`, data)
}
export function getOffLineCode(data: any) {
  return http.post(`/license/create/applyCode`, data)
}
//校验本地服务与阿里云通讯是否正常
export function getConnectFlag() {
  return http.get(`/net/connect`)
}
//申请禁用当前软件
export function disableApply() {
  return http.get(`/license/disable/apply`)
}
//检查当前软件是否被禁用
export function checkDisable() {
  return http.get(`/license/check/disable`)
}

//当前软件禁用通过后修改加密秘钥达到禁用的目的
export function changeEncryptData() {
  return http.get(`/license/change/encrypt/data`)
}
//申请禁用-阿里云审核通过-修改秘钥达到禁用（或者等10分钟后自动修改）
