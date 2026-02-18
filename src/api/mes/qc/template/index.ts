import request from '@/config/axios'

// MES 质检方案 VO
export interface QcTemplateVO {
  id: number // 编号
  code: string // 方案编号
  name: string // 方案名称
  types: number[] // 检测种类
  enableFlag: boolean // 是否启用
  remark: string // 备注
}

// MES 质检方案-检测指标项 VO
// TODO @AI：拆成多个，参考别的 api ts；
export interface QcTemplateIndicatorVO {
  id: number // 编号
  templateId: number // 质检方案ID
  indicatorId: number // 质检指标ID
  checkMethod: string // 检测方法
  standardValue: number // 标准值
  unitMeasureId: number // 计量单位ID
  thresholdMax: number // 误差上限
  thresholdMin: number // 误差下限
  docUrl: string // 说明图URL
  remark: string // 备注
  // JOIN mes_qc_indicator
  indicatorCode: string // 检测项编码
  indicatorName: string // 检测项名称
  indicatorType: string // 检测项类型（字典 mes_index_type）
  indicatorTool: string // 检测工具
  // JOIN mes_md_unit_measure
  unitMeasureName: string // 计量单位名称
}

// MES 质检方案-产品关联 VO
// TODO @AI：拆成多个，参考别的 api ts；
export interface QcTemplateItemVO {
  id: number // 编号
  templateId: number // 质检方案ID
  itemId: number // 产品物料ID
  quantityCheck: number // 最低检测数
  quantityUnqualified: number // 最大不合格数
  criticalRate: number // 最大致命缺陷率（%）
  majorRate: number // 最大严重缺陷率（%）
  minorRate: number // 最大轻微缺陷率（%）
  remark: string // 备注
  // JOIN mes_md_item
  itemCode: string // 物料编码
  itemName: string // 物料名称
  specification: string // 规格型号
  unitMeasureName: string // 计量单位名称
}

// MES 质检方案 API
export const QcTemplateApi = {
  // ========== 质检方案主表 ==========

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
  },

  // ========== 质检方案-检测指标项 ==========

  // 查询检测指标项分页
  getTemplateIndicatorPage: async (params: any) => {
    return await request.get({ url: `/mes/qc/template/indicator/page`, params })
  },

  // 查询检测指标项详情
  getTemplateIndicator: async (id: number) => {
    return await request.get({ url: `/mes/qc/template/indicator/get?id=` + id })
  },

  // 新增检测指标项
  createTemplateIndicator: async (data: QcTemplateIndicatorVO) => {
    return await request.post({ url: `/mes/qc/template/indicator/create`, data })
  },

  // 修改检测指标项
  updateTemplateIndicator: async (data: QcTemplateIndicatorVO) => {
    return await request.put({ url: `/mes/qc/template/indicator/update`, data })
  },

  // 删除检测指标项
  deleteTemplateIndicator: async (id: number) => {
    return await request.delete({ url: `/mes/qc/template/indicator/delete?id=` + id })
  },

  // ========== 质检方案-产品关联 ==========

  // 查询产品关联分页
  getTemplateItemPage: async (params: any) => {
    return await request.get({ url: `/mes/qc/template/item/page`, params })
  },

  // 查询产品关联详情
  getTemplateItem: async (id: number) => {
    return await request.get({ url: `/mes/qc/template/item/get?id=` + id })
  },

  // 新增产品关联
  createTemplateItem: async (data: QcTemplateItemVO) => {
    return await request.post({ url: `/mes/qc/template/item/create`, data })
  },

  // 修改产品关联
  updateTemplateItem: async (data: QcTemplateItemVO) => {
    return await request.put({ url: `/mes/qc/template/item/update`, data })
  },

  // 删除产品关联
  deleteTemplateItem: async (id: number) => {
    return await request.delete({ url: `/mes/qc/template/item/delete?id=` + id })
  }
}
