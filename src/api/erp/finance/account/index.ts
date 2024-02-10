import request from '@/config/axios'

// ERP 结算账户 VO
export interface AccountVO {
  id: number // 结算账户编号
  no: string // 账户编码
  remark: string // 备注
  status: number // 开启状态
  sort: number // 排序
  defaultStatus: boolean // 是否默认
  name: string // 账户名称
}

// ERP 结算账户 API
export const AccountApi = {
  // 查询结算账户分页
  getAccountPage: async (params: any) => {
    return await request.get({ url: `/erp/account/page`, params })
  },

  // 查询结算账户精简列表
  getAccountSimpleList: async () => {
    return await request.get({ url: `/erp/account/simple-list` })
  },

  // 查询结算账户详情
  getAccount: async (id: number) => {
    return await request.get({ url: `/erp/account/get?id=` + id })
  },

  // 新增结算账户
  createAccount: async (data: AccountVO) => {
    return await request.post({ url: `/erp/account/create`, data })
  },

  // 修改结算账户
  updateAccount: async (data: AccountVO) => {
    return await request.put({ url: `/erp/account/update`, data })
  },

  // 修改结算账户默认状态
  updateAccountDefaultStatus: async (id: number, defaultStatus: boolean) => {
    return await request.put({
      url: `/erp/account/update-default-status`,
      params: {
        id,
        defaultStatus
      }
    })
  },

  // 删除结算账户
  deleteAccount: async (id: number) => {
    return await request.delete({ url: `/erp/account/delete?id=` + id })
  },

  // 导出结算账户 Excel
  exportAccount: async (params: any) => {
    return await request.download({ url: `/erp/account/export-excel`, params })
  }
}
