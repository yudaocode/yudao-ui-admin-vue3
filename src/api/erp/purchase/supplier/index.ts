import request from '@/config/axios'

// ERP 供应商 VO
export interface SupplierVO {
  id: number // 供应商编号
  name: string // 供应商名称
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

// ERP 供应商 API
export const SupplierApi = {
  // 查询供应商分页
  getSupplierPage: async (params: any) => {
    return await request.get({ url: `/erp/supplier/page`, params })
  },

  // 获得供应商精简列表
  getSupplierSimpleList: async () => {
    return await request.get({ url: `/erp/supplier/simple-list` })
  },

  // 查询供应商详情
  getSupplier: async (id: number) => {
    return await request.get({ url: `/erp/supplier/get?id=` + id })
  },

  // 新增供应商
  createSupplier: async (data: SupplierVO) => {
    return await request.post({ url: `/erp/supplier/create`, data })
  },

  // 修改供应商
  updateSupplier: async (data: SupplierVO) => {
    return await request.put({ url: `/erp/supplier/update`, data })
  },

  // 删除供应商
  deleteSupplier: async (id: number) => {
    return await request.delete({ url: `/erp/supplier/delete?id=` + id })
  },

  // 导出供应商 Excel
  exportSupplier: async (params) => {
    return await request.download({ url: `/erp/supplier/export-excel`, params })
  }
}
