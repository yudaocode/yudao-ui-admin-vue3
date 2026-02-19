import request from '@/config/axios'

// TODO @AI：indicator/index.ts 迁移过去；
// MES 质检方案-检测指标项 VO
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

// MES 质检方案-检测指标项 API
export const QcTemplateIndicatorApi = {
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
  }
}
