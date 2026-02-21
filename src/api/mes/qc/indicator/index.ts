import request from '@/config/axios'

// MES 质检指标 VO
export interface QcIndicatorVO {
  id: number // 编号
  code: string // 检测项编码
  name: string // 检测项名称
  type: string // 检测项类型
  tool: string // 检测工具
  resultType: number // 结果值类型
  resultSpecification: string // 结果值属性
  remark: string // 备注
}

// MES 质检指标 API
export const QcIndicatorApi = {
  // 查询质检指标分页
  getIndicatorPage: async (params: any) => {
    return await request.get({ url: `/mes/qc/indicator/page`, params })
  },

  // 查询质检指标精简列表
  getIndicatorSimpleList: async () => {
    return await request.get({ url: `/mes/qc/indicator/simple-list` })
  },

  // 查询质检指标详情
  getIndicator: async (id: number) => {
    return await request.get({ url: `/mes/qc/indicator/get?id=` + id })
  },

  // 新增质检指标
  createIndicator: async (data: QcIndicatorVO) => {
    return await request.post({ url: `/mes/qc/indicator/create`, data })
  },

  // 修改质检指标
  updateIndicator: async (data: QcIndicatorVO) => {
    return await request.put({ url: `/mes/qc/indicator/update`, data })
  },

  // 删除质检指标
  deleteIndicator: async (id: number) => {
    return await request.delete({ url: `/mes/qc/indicator/delete?id=` + id })
  },

  // 导出质检指标 Excel
  exportIndicator: async (params: any) => {
    return await request.download({ url: `/mes/qc/indicator/export-excel`, params })
  }
}
