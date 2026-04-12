import request from '@/config/axios'

// MES 缺陷类型 VO
export interface QcDefectVO {
  id: number // 编号
  code: string // 缺陷编码
  name: string // 缺陷描述
  type: number // 检测项类型
  level: number // 缺陷等级
  remark: string // 备注
}

// MES 缺陷类型 API
export const QcDefectApi = {
  // 查询缺陷类型分页
  getDefectPage: async (params: any) => {
    return await request.get({ url: `/mes/qc/defect/page`, params })
  },

  // 查询缺陷类型精简列表
  getDefectSimpleList: async () => {
    return await request.get({ url: `/mes/qc/defect/simple-list` })
  },

  // 查询缺陷类型详情
  getDefect: async (id: number) => {
    return await request.get({ url: `/mes/qc/defect/get?id=` + id })
  },

  // 新增缺陷类型
  createDefect: async (data: QcDefectVO) => {
    return await request.post({ url: `/mes/qc/defect/create`, data })
  },

  // 修改缺陷类型
  updateDefect: async (data: QcDefectVO) => {
    return await request.put({ url: `/mes/qc/defect/update`, data })
  },

  // 删除缺陷类型
  deleteDefect: async (id: number) => {
    return await request.delete({ url: `/mes/qc/defect/delete?id=` + id })
  },

  // 导出缺陷类型 Excel
  exportDefect: async (params: any) => {
    return await request.download({ url: `/mes/qc/defect/export-excel`, params })
  }
}
