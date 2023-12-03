import request from '@/config/axios'

export interface UReportDataVO {
  id: number
  name: string
  status: number
  content: string
  remark: string
}

// 查询Ureport2报表分页
export const getUReportDataPage = async (params) => {
  return await request.get({ url: `/report/ureport-data/page`, params })
}

// 查询Ureport2报表详情
export const getUReportData = async (id: number) => {
  return await request.get({ url: `/report/ureport-data/get?id=` + id })
}

// 新增Ureport2报表
export const createUReportData = async (data: UReportDataVO) => {
  return await request.post({ url: `/report/ureport-data/create`, data })
}

// 修改Ureport2报表
export const updateUReportData = async (data: UReportDataVO) => {
  return await request.put({ url: `/report/ureport-data/update`, data })
}

// 删除Ureport2报表
export const deleteUReportData = async (id: number) => {
  return await request.delete({ url: `/report/ureport-data/delete?id=` + id })
}

// 导出Ureport2报表 Excel
export const exportUReportData = async (params) => {
  return await request.download({ url: `/report/ureport-data/export-excel`, params })
}
