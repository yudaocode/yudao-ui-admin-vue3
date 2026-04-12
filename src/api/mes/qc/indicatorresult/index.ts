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
  // 关联查询字段（来自 indicator）
  indicatorName: string // 检测指标名称
  valueType: number // 质检值类型
  valueSpecification: string // 值属性
}

// MES 检验结果 API
export const QcIndicatorResultApi = {
  // 查询检验结果分页
  getResultPage: async (params: any) => {
    return await request.get({ url: `/mes/qc/indicator-result/page`, params })
  },

  // 查询检验结果明细（含检测项模板）：编辑传 id，新增不传
  getDetail: async (qcId: number, qcType: number, id?: number) => {
    return await request.get({
      url: `/mes/qc/indicator-result/get-detail`,
      params: { id, qcId, qcType }
    })
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
  }
}
