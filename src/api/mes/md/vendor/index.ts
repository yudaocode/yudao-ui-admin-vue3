import request from '@/config/axios'

// MES 供应商 VO
export interface MdVendorVO {
  id: number // 供应商编号
  code: string // 供应商编码
  name: string // 供应商名称
  nickname: string // 供应商简称
  englishName: string // 供应商英文名称
  description: string // 供应商简介
  logo: string // 供应商LOGO地址
  level: string // 供应商等级
  score: number // 供应商评分
  address: string // 供应商地址
  website: string // 供应商官网地址
  email: string // 供应商邮箱地址
  telephone: string // 供应商电话
  contact1Name: string // 联系人1
  contact1Telephone: string // 联系人1-电话
  contact1Email: string // 联系人1-邮箱
  contact2Name: string // 联系人2
  contact2Telephone: string // 联系人2-电话
  contact2Email: string // 联系人2-邮箱
  creditCode: string // 统一社会信用代码
  status: number // 状态
  remark: string // 备注
}

// MES 供应商 API
export const MdVendorApi = {
  // 查询供应商分页
  getVendorPage: async (params: any) => {
    return await request.get({ url: `/mes/md-vendor/page`, params })
  },

  // 查询供应商精简列表
  getVendorSimpleList: async () => {
    return await request.get({ url: `/mes/md-vendor/simple-list` })
  },

  // 查询供应商详情
  getVendor: async (id: number) => {
    return await request.get({ url: `/mes/md-vendor/get?id=` + id })
  },

  // 新增供应商
  createVendor: async (data: MdVendorVO) => {
    return await request.post({ url: `/mes/md-vendor/create`, data })
  },

  // 修改供应商
  updateVendor: async (data: MdVendorVO) => {
    return await request.put({ url: `/mes/md-vendor/update`, data })
  },

  // 删除供应商
  deleteVendor: async (id: number) => {
    return await request.delete({ url: `/mes/md-vendor/delete?id=` + id })
  },

  // 导出供应商 Excel
  exportVendor: async (params: any) => {
    return await request.download({ url: `/mes/md-vendor/export-excel`, params })
  },

  // 下载供应商导入模板
  importTemplate: async () => {
    return await request.download({ url: `/mes/md-vendor/get-import-template` })
  }
}
