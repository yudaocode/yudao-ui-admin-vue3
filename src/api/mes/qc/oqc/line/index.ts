import request from '@/config/axios'

// MES 出货检验单行 VO
export interface QcOqcLineVO {
  id: number // 编号
  oqcId: number // 出货检验单 ID
  indicatorId: number // 检测指标 ID
  indicatorCode: string // 检测指标编码（关联查询）
  indicatorName: string // 检测指标名称（关联查询）
  indicatorType: string // 检测指标类型（关联查询）
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

// MES 出货检验单行 API
export const QcOqcLineApi = {
  // 查询出货检验单行分页
  getOqcLinePage: async (params: any) => {
    return await request.get({ url: `/mes/qc/oqc/line/page`, params })
  },

  // 查询出货检验单行详情
  getOqcLine: async (id: number) => {
    return await request.get({ url: `/mes/qc/oqc/line/get?id=` + id })
  }
}
