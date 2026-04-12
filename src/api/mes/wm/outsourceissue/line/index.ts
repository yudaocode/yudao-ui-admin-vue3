import request from '@/config/axios'

// MES 外协发料单行 VO
export interface WmOutsourceIssueLineVO {
  id: number
  issueId: number
  materialStockId: number
  itemId: number
  itemCode: string
  itemName: string
  specification: string
  unitMeasureName: string
  quantity: number
  batchId: number
  batchCode: string
  remark: string
  createTime: string
}

// MES 外协发料单行 API
export const WmOutsourceIssueLineApi = {
  // 查询外协发料单行分页
  getOutsourceIssueLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/outsource-issue-line/page', params })
  },

  // 查询外协发料单行详情
  getOutsourceIssueLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/outsource-issue-line/get?id=' + id })
  },

  // 新增外协发料单行
  createOutsourceIssueLine: async (data: WmOutsourceIssueLineVO) => {
    return await request.post({ url: '/mes/wm/outsource-issue-line/create', data })
  },

  // 修改外协发料单行
  updateOutsourceIssueLine: async (data: WmOutsourceIssueLineVO) => {
    return await request.put({ url: '/mes/wm/outsource-issue-line/update', data })
  },

  // 删除外协发料单行
  deleteOutsourceIssueLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/outsource-issue-line/delete?id=' + id })
  }
}
