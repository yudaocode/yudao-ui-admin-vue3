import request from '@/config/axios'
import type { CodegenUpdateReqVO, CodegenCreateListReqVO } from './types'

// 查询列表代码生成表定义
export const getCodegenTablePage = (params) => {
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

// 基于 SQL 建表语句，同步数据库的表和字段定义
export const syncCodegenFromSQL = (id: number, sql: string) => {
  return request.put({ url: '/infra/codegen/sync-from-sql?tableId=' + id + '&sql=' + sql })
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
