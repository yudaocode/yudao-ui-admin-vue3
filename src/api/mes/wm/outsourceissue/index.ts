import request from '@/config/axios'

// MES 外协发料单 VO
export interface WmOutsourceIssueVO {
  id: number
  code: string
  name: string
  vendorId: number
  vendorCode: string
  vendorName: string
  workorderId: number
  workorderCode: string
  workorderName: string
  issueDate: string
  status: number
  remark: string
  createTime: string
}

// MES 外协发料单 API
export const WmOutsourceIssueApi = {
  // 查询外协发料单分页
  getOutsourceIssuePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/outsource-issue/page', params })
  },

  // 查询外协发料单详情
  getOutsourceIssue: async (id: number) => {
    return await request.get({ url: '/mes/wm/outsource-issue/get?id=' + id })
  },

  // 新增外协发料单
  createOutsourceIssue: async (data: WmOutsourceIssueVO) => {
    return await request.post({ url: '/mes/wm/outsource-issue/create', data })
  },

  // 修改外协发料单
  updateOutsourceIssue: async (data: WmOutsourceIssueVO) => {
    return await request.put({ url: '/mes/wm/outsource-issue/update', data })
  },

  // 删除外协发料单
  deleteOutsourceIssue: async (id: number) => {
    return await request.delete({ url: '/mes/wm/outsource-issue/delete?id=' + id })
  },

  // 提交到待拣货
  submitOutsourceIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/outsource-issue/submit?id=' + id })
  },

  // 执行拣货
  stockOutsourceIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/outsource-issue/stock?id=' + id })
  },

  // 完成外协发料出库
  finishOutsourceIssue: async (id: number) => {
    return await request.put({ url: '/mes/wm/outsource-issue/finish?id=' + id })
  },

  // 导出外协发料单 Excel
  exportOutsourceIssue: async (params: any) => {
    return await request.download({ url: '/mes/wm/outsource-issue/export-excel', params })
  }
}
