import request from '@/config/axios'

// MES 质检方案 VO
export interface QcTemplateVO {
  id: number // 编号
  code: string // 方案编号
  name: string // 方案名称
  types: number[] // 检测种类
  status: number // 状态
  remark: string // 备注
}

// MES 质检方案 API
export const QcTemplateApi = {
  // 查询质检方案分页
  getTemplatePage: async (params: any) => {
    return await request.get({ url: `/mes/qc/template/page`, params })
  },

  // 查询质检方案精简列表
  getTemplateSimpleList: async () => {
    return await request.get({ url: `/mes/qc/template/simple-list` })
  },

  // 查询质检方案详情
  getTemplate: async (id: number) => {
    return await request.get({ url: `/mes/qc/template/get?id=` + id })
  },

  // 新增质检方案
  createTemplate: async (data: QcTemplateVO) => {
    return await request.post({ url: `/mes/qc/template/create`, data })
  },

  // 修改质检方案
  updateTemplate: async (data: QcTemplateVO) => {
    return await request.put({ url: `/mes/qc/template/update`, data })
  },

  // 删除质检方案
  deleteTemplate: async (id: number) => {
    return await request.delete({ url: `/mes/qc/template/delete?id=` + id })
  },

  // 导出质检方案 Excel
  exportTemplate: async (params: any) => {
    return await request.download({ url: `/mes/qc/template/export-excel`, params })
  }
}
