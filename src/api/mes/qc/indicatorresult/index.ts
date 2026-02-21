import request from '@/config/axios'

// MES 检验结果 VO
export interface QcIndicatorResultVO {
  id: number // 编号
  code: string // 样品编号
  qcId: number // 关联质检单ID
  qcType: number // 质检类型
  itemId: number // 产品物料ID
  sn: string // 物资SN
  remark: string // 备注
  createTime: Date // 创建时间
  // 关联查询字段
  qcCode: string // 质检单编号
  qcName: string // 质检单名称
  itemCode: string // 产品物料编码
  itemName: string // 产品物料名称
  itemSpecification: string // 规格型号
  unitName: string // 单位名称
  // 子表
  items: QcIndicatorResultDetailVO[] // 检验结果明细列表
}

// MES 检验结果明细 VO
export interface QcIndicatorResultDetailVO {
  id: number // 编号
  resultId: number // 关联检验结果ID
  indicatorId: number // 检测指标ID
  value: string // 检测值（统一存为字符串）
  remark: string // 备注
  // 关联查询字段
  indicatorCode: string // 检测指标编码
  indicatorName: string // 检测指标名称
  indicatorType: string // 检测指标类型
  valueType: number // 质检值类型（关联查询）
  valueSpecification: string // 值属性（关联查询）
  toolName: string // 检测工具名称
  checkMethod: string // 检测方法
  standardValue: number // 标准值
  unitMeasureName: string // 计量单位名称
  maxThreshold: number // 误差上限
  minThreshold: number // 误差下限
}

// MES 检验结果 API
export const QcIndicatorResultApi = {
  // 查询检验结果分页
  getResultPage: async (params: any) => {
    return await request.get({ url: `/mes/qc/indicator-result/page`, params })
  },

  // 查询检验结果详情（含明细）
  getResult: async (id: number) => {
    return await request.get({ url: `/mes/qc/indicator-result/get?id=` + id })
  },

  // 新增检验结果
  createResult: async (data: any) => {
    return await request.post({ url: `/mes/qc/indicator-result/create`, data })
  },

  // 修改检验结果
  updateResult: async (data: any) => {
    return await request.put({ url: `/mes/qc/indicator-result/update`, data })
  },

  // 删除检验结果
  deleteResult: async (id: number) => {
    return await request.delete({ url: `/mes/qc/indicator-result/delete?id=` + id })
  },

  // 获取空值检测项模板（新建结果时用）
  getDetailTemplate: async (qcId: number, qcType: number) => {
    return await request.get({ url: `/mes/qc/indicator-result/detail-template`, params: { qcId, qcType } })
  }
}
