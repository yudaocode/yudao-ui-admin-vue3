import request from '@/config/axios'

// MES 客户 VO
export interface MdClientVO {
  id: number // 客户编号
  code: string // 客户编码
  name: string // 客户名称
  nickname: string // 客户简称
  englishName: string // 客户英文名称
  description: string // 客户简介
  logo: string // 客户LOGO地址
  type: number // 客户类型
  address: string // 客户地址
  website: string // 客户官网地址
  email: string // 客户邮箱地址
  telephone: string // 客户电话
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

// MES 客户 API
export const MdClientApi = {
  // 查询客户分页
  getClientPage: async (params: any) => {
    return await request.get({ url: `/mes/md-client/page`, params })
  },

  // 查询客户详情
  getClient: async (id: number) => {
    return await request.get({ url: `/mes/md-client/get?id=` + id })
  },

  // 新增客户
  createClient: async (data: MdClientVO) => {
    return await request.post({ url: `/mes/md-client/create`, data })
  },

  // 修改客户
  updateClient: async (data: MdClientVO) => {
    return await request.put({ url: `/mes/md-client/update`, data })
  },

  // 删除客户
  deleteClient: async (id: number) => {
    return await request.delete({ url: `/mes/md-client/delete?id=` + id })
  },

  // 导出客户 Excel
  exportClient: async (params: any) => {
    return await request.download({ url: `/mes/md-client/export-excel`, params })
  },

  // 下载客户导入模板
  importTemplate: async () => {
    return await request.download({ url: `/mes/md-client/get-import-template` })
  }
}
