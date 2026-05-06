import request from '@/config/axios'

// MES 来料检验单 VO
export interface QcIqcVO {
  id: number // 编号
  code: string // 检验单编号
  name: string // 检验单名称
  templateId: number // 检验模板 ID
  sourceDocType: number // 来源单据类型
  sourceDocId: number // 来源单据 ID
  sourceLineId: number // 来源单据行 ID
  vendorId: number // 供应商 ID
  vendorNickname: string // 供应商简称（关联查询）
  vendorBatch: string // 供应商批次号
  itemId: number // 产品物料 ID
  itemCode: string // 产品物料编码（关联查询）
  itemName: string // 产品物料名称（关联查询）
  itemSpecification: string // 规格型号（关联查询）
  unitName: string // 单位名称（关联查询）
  receivedQuantity: number // 本次接收数量
  checkQuantity: number // 本次检测数量
  qualifiedQuantity: number // 合格品数量
  unqualifiedQuantity: number // 不合格品数量
  criticalRate: number // 致命缺陷率（%）
  majorRate: number // 严重缺陷率（%）
  minorRate: number // 轻微缺陷率（%）
  criticalQuantity: number // 致命缺陷数量
  majorQuantity: number // 严重缺陷数量
  minorQuantity: number // 轻微缺陷数量
  checkResult: string // 检测结果
  receiveDate: Date // 来料日期
  inspectDate: Date // 检测日期
  inspector: string // 检测人员
  status: number // 状态
  remark: string // 备注
}

// MES 来料检验单 API
export const QcIqcApi = {
  // 查询来料检验单分页
  getIqcPage: async (params: any) => {
    return await request.get({ url: `/mes/qc/iqc/page`, params })
  },

  // 查询来料检验单详情
  getIqc: async (id: number) => {
    return await request.get({ url: `/mes/qc/iqc/get?id=` + id })
  },

  // 新增来料检验单
  createIqc: async (data: QcIqcVO) => {
    return await request.post({ url: `/mes/qc/iqc/create`, data })
  },

  // 修改来料检验单
  updateIqc: async (data: QcIqcVO) => {
    return await request.put({ url: `/mes/qc/iqc/update`, data })
  },

  // 完成来料检验单
  finishIqc: async (id: number) => {
    return await request.put({ url: `/mes/qc/iqc/finish?id=` + id })
  },

  // 删除来料检验单
  deleteIqc: async (id: number) => {
    return await request.delete({ url: `/mes/qc/iqc/delete?id=` + id })
  },

  // 导出来料检验单 Excel
  exportIqc: async (params: any) => {
    return await request.download({ url: `/mes/qc/iqc/export-excel`, params })
  }
}
