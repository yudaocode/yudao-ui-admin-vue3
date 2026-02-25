import request from '@/config/axios'

// MES 退货检验单行 VO
export interface QcRqcLineVO {
  id: number // 编号
  rqcId: number // 退货检验单 ID
  indicatorId: number // 检测指标 ID
  indicatorCode: string // 检测指标编码（关联查询）
  indicatorName: string // 检测指标名称（关联查询）
  indicatorType: string // 检测指标类型（关联查询）
  tool: string // 检测工具
  checkMethod: string // 检测方法
  standardValue: number // 标准值
  unitMeasureId: number // 计量单位 ID
  unitMeasureName: string // 计量单位名称（关联查询）
  maxThreshold: number // 误差上限
  minThreshold: number // 误差下限
  criticalQuantity: number // 致命缺陷数量
  majorQuantity: number // 严重缺陷数量
  minorQuantity: number // 轻微缺陷数量
  remark: string // 备注
}

// MES 退货检验单行 API
export const QcRqcLineApi = {
  // 查询退货检验单行分页
  getRqcLinePage: async (params: any) => {
    return await request.get({ url: `/mes/qc/rqc/line/page`, params })
  },

  // 查询退货检验单行详情
  getRqcLine: async (id: number) => {
    return await request.get({ url: `/mes/qc/rqc/line/get?id=` + id })
  }
}
