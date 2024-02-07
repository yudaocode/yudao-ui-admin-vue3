import request from '@/config/axios'

// ERP 客户 VO
export interface CustomerVO {
  id: number // 客户编号
  name: string // 客户名称
  contact: string // 联系人
  mobile: string // 手机号码
  telephone: string // 联系电话
  email: string // 电子邮箱
  fax: string // 传真
  remark: string // 备注
  status: number // 开启状态
  sort: number // 排序
  taxNo: string // 纳税人识别号
  taxPercent: number // 税率
  bankName: string // 开户行
  bankAccount: string // 开户账号
  bankAddress: string // 开户地址
}

// ERP 客户 API
export const CustomerApi = {
  // 查询客户分页
  getCustomerPage: async (params: any) => {
    return await request.get({ url: `/erp/customer/page`, params })
  },

  // 查询客户精简列表
  getCustomerSimpleList: async () => {
    return await request.get({ url: `/erp/customer/simple-list` })
  },

  // 查询客户详情
  getCustomer: async (id: number) => {
    return await request.get({ url: `/erp/customer/get?id=` + id })
  },

  // 新增客户
  createCustomer: async (data: CustomerVO) => {
    return await request.post({ url: `/erp/customer/create`, data })
  },

  // 修改客户
  updateCustomer: async (data: CustomerVO) => {
    return await request.put({ url: `/erp/customer/update`, data })
  },

  // 删除客户
  deleteCustomer: async (id: number) => {
    return await request.delete({ url: `/erp/customer/delete?id=` + id })
  },

  // 导出客户 Excel
  exportCustomer: async (params) => {
    return await request.download({ url: `/erp/customer/export-excel`, params })
  }
}
