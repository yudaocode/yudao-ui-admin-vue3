export type DictTypeVO = {
  id: number | undefined
  name: string
  type: string
  status: number | undefined
  remark: string
  createTime: Date
}

export type DictTypePageReqVO = {
  pageNo: number
  pageSize: number
  name: string
  type: string
  status: number | undefined
  createTime: Date[]
}

export type DictTypeExportReqVO = {
  name: string
  type: string
  status: number
  createTime: Date[]
}

export type DictDataVO = {
  id: number | undefined
  sort: number | undefined
  label: string
  value: string
  dictType: string
  status: number
  colorType: string
  cssClass: string
  remark: string
  createTime: Date | undefined
}
export type DictDataPageReqVO = {
  pageNo: number
  pageSize: number
  label: string
  dictType: string
  status: number | undefined
}

export type DictDataExportReqVO = {
  label: string
  dictType: string
  status: number
}
