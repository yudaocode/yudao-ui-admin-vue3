import request from '@/config/axios'

export type CodegenTableVO = {
  id: number
  tableId: number
  isParentMenuIdValid: boolean
  dataSourceConfigId: number
  scene: number
  tableName: string
  tableComment: string
  remark: string
  moduleName: string
  businessName: string
  className: string
  classComment: string
  author: string
  createTime: Date
  updateTime: Date
  templateType: number
  parentMenuId: number
}

export type CodegenColumnVO = {
  id: number
  tableId: number
  columnName: string
  dataType: string
  columnComment: string
  nullable: number
  primaryKey: number
  autoIncrement: boolean
  ordinalPosition: number
  javaType: string
  javaField: string
  dictType: string
  example: string
  createOperation: number
  updateOperation: number
  listOperation: number
  listOperationCondition: string
  listOperationResult: number
  htmlType: string
}

export type DatabaseTableVO = {
  name: string
  comment: string
}

export type CodegenDetailVO = {
  table: CodegenTableVO
  columns: CodegenColumnVO[]
}

export type CodegenPreviewVO = {
  filePath: string
  code: string
}

export type CodegenUpdateReqVO = {
  table: CodegenTableVO | any
  columns: CodegenColumnVO[]
}

export type CodegenCreateListReqVO = {
  dataSourceConfigId: number
  tableNames: string[]
}

// 查询列表代码生成表定义
export const getCodegenTableList = (dataSourceConfigId: number) => {
  return request.get({ url: '/infra/codegen/table/list?dataSourceConfigId=' + dataSourceConfigId })
}

// 查询列表代码生成表定义
export const getCodegenTablePage = (params: PageParam) => {
  return request.get({ url: '/infra/codegen/table/page', params })
}

// 查询详情代码生成表定义
export const getCodegenTable = (id: number) => {
  return request.get({ url: '/infra/codegen/detail?tableId=' + id })
}

// 新增代码生成表定义
export const createCodegenTable = (data: CodegenCreateListReqVO) => {
  return request.post({ url: '/infra/codegen/create', data })
}

// 修改代码生成表定义
export const updateCodegenTable = (data: CodegenUpdateReqVO) => {
  return request.put({ url: '/infra/codegen/update', data })
}

// 基于数据库的表结构，同步数据库的表和字段定义
export const syncCodegenFromDB = (id: number) => {
  return request.put({ url: '/infra/codegen/sync-from-db?tableId=' + id })
}

// 预览生成代码
export const previewCodegen = (id: number) => {
  return request.get({ url: '/infra/codegen/preview?tableId=' + id })
}

// 下载生成代码
export const downloadCodegen = (id: number) => {
  return request.download({ url: '/infra/codegen/download?tableId=' + id })
}

// 获得表定义
export const getSchemaTableList = (params) => {
  return request.get({ url: '/infra/codegen/db/table/list', params })
}

// 基于数据库的表结构，创建代码生成器的表定义
export const createCodegenList = (data) => {
  return request.post({ url: '/infra/codegen/create-list', data })
}

// 删除代码生成表定义
export const deleteCodegenTable = (id: number) => {
  return request.delete({ url: '/infra/codegen/delete?tableId=' + id })
}
