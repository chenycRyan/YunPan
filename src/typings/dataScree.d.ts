// * File
declare namespace FileSpace {
  interface AuthVo {
    status: string
    type: string
  }
  interface RowItf {
    id: number
    name: string
    parentId: number
    time: string
    type: string
    parent?: RowItf
    auth?: string
    userFileAuthVo?: AuthVo
    [key: string]: any
  }
  interface FoldItf {
    id: number
    name: string
    lastUpdatedTime?: string
    parentId: number
    [key: string]: any
  }
  interface IdNameItf {
    id: number
    name?: string
    parent?: any
  }
}
// * File
declare namespace TableSpace {
  interface IPage {
    page: number
    size: number
    [key: string]: any
  }
  interface PageItf {
    content: any
    totalElements: number
    [key: string]: any
  }
  interface paramObj {
    [key: string]: any
  }
}
