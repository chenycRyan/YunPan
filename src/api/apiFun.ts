import http from '@/api'
interface IPage {
  content: any
  totalElements: number
  size: number
}
interface APIFun {
  addItem: (data: any) => Promise<unknown>
  update: (data: any) => Promise<unknown>
  deleteItem: (id: number) => Promise<unknown>
  findById: (id: number) => Promise<unknown>
  findList: <T>(params?: any) => Promise<T>
  findPage: (params: any) => Promise<IPage>
}
function isBlank(value: any) {
  return value === null || value === ''
}
function filterParam(param: { [key: string]: any }) {
  const obj: { [key: string]: any } = {}
  Object.keys(param).forEach(item => {
    if ((Array.isArray(param[item]) && param[item].length) || !isBlank(param[item])) {
      obj[item] = param[item]
    }
  })
  return obj
}

export const apiFun = (moduleUrl: string): APIFun => {
  const url = moduleUrl
  const addItem = (data: any) => {
    return http.post(url, data)
  }

  const update = (data: any) => {
    return http.post(`${url}/update`, data)
  }

  const deleteItem = (id: number) => {
    return http.delete(`${url}/${id}`)
  }

  const findById = (id: number) => {
    return http.get(`${url}/${id}`)
  }

  const findList = <T>(params?: any) => {
    if (typeof params === 'object') {
      params = filterParam(params)
    }

    return http.get<T>(`${url}/list`, params)
  }

  const findPage = (params: any) => {
    params = filterParam(params)
    params.sort = 'createdTime,DESC'
    return http.get<IPage>(`${url}/page`, params)
  }
  return {
    addItem,
    update,
    deleteItem,
    findById,
    findList,
    findPage
  }
}
