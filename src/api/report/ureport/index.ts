import request from '@/config/axios'

export interface UreportFileVO {
  id: number
  fileName: string
  status: number
  fileContent: string
  remark: string
}

// 查询Ureport2报表分页
export const getUreportFilePage = async (params) => {
  return await request.get({ url: `/report/ureport-file/page`, params })
}

// 查询Ureport2报表详情
export const getUreportFile = async (id: number) => {
  return await request.get({ url: `/report/ureport-file/get?id=` + id })
}

// 新增Ureport2报表
export const createUreportFile = async (data: UreportFileVO) => {
  return await request.post({ url: `/report/ureport-file/create`, data })
}

// 修改Ureport2报表
export const updateUreportFile = async (data: UreportFileVO) => {
  return await request.put({ url: `/report/ureport-file/update`, data })
}

// 删除Ureport2报表
export const deleteUreportFile = async (id: number) => {
  return await request.delete({ url: `/report/ureport-file/delete?id=` + id })
}

// 导出Ureport2报表 Excel
export const exportUreportFile = async (params) => {
  return await request.download({ url: `/report/ureport-file/export-excel`, params })
}