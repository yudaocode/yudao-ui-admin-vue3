import request from '@/config/axios'

// MES 过程检验单 VO
export interface QcIpqcVO {
  id: number // 编号
  code: string // 检验单编号
  name: string // 检验单名称
  type: string // IPQC 检验类型
  templateId: number // 检验模板 ID
  sourceDocId: number // 来源单据 ID
  sourceDocType: string // 来源单据类型
  sourceDocCode: string // 来源单据编号
  sourceLineId: number // 来源单据行 ID
  workOrderId: number // 生产工单 ID
  workOrderCode: string // 工单编号（关联查询）
  workOrderName: string // 工单名称（关联查询）
  taskId: number // 生产任务 ID
  workstationId: number // 工位 ID
  workstationName: string // 工位名称（关联查询）
  processId: number // 工序 ID
  processName: string // 工序名称（关联查询）
  itemId: number // 产品物料 ID
  itemCode: string // 产品物料编码（关联查询）
  itemName: string // 产品物料名称（关联查询）
  itemSpecification: string // 规格型号（关联查询）
  unitName: string // 单位名称（关联查询）
  checkQuantity: number // 检测数量
  qualifiedQuantity: number // 合格品数量
  unqualifiedQuantity: number // 不合格品数量
  laborScrapQuantity: number // 工废数量
  materialScrapQuantity: number // 料废数量
  otherScrapQuantity: number // 其他废品数量
  criticalRate: number // 致命缺陷率（%）
  majorRate: number // 严重缺陷率（%）
  minorRate: number // 轻微缺陷率（%）
  criticalQuantity: number // 致命缺陷数量
  majorQuantity: number // 严重缺陷数量
  minorQuantity: number // 轻微缺陷数量
  checkResult: number // 检测结果
  inspectDate: Date // 检测日期
  inspectorUserId: number // 检测人员用户 ID
  inspectorNickname: string // 检测人员昵称（关联查询）
  status: number // 状态
  remark: string // 备注
}

// MES 过程检验单 API
export const QcIpqcApi = {
  // 查询过程检验单分页
  getIpqcPage: async (params: any) => {
    return await request.get({ url: `/mes/qc/ipqc/page`, params })
  },

  // 查询过程检验单详情
  getIpqc: async (id: number) => {
    return await request.get({ url: `/mes/qc/ipqc/get?id=` + id })
  },

  // 新增过程检验单
  createIpqc: async (data: QcIpqcVO) => {
    return await request.post({ url: `/mes/qc/ipqc/create`, data })
  },

  // 修改过程检验单
  updateIpqc: async (data: QcIpqcVO) => {
    return await request.put({ url: `/mes/qc/ipqc/update`, data })
  },

  // 完成过程检验单
  completeIpqc: async (id: number) => {
    return await request.put({ url: `/mes/qc/ipqc/complete?id=` + id })
  },

  // 删除过程检验单
  deleteIpqc: async (id: number) => {
    return await request.delete({ url: `/mes/qc/ipqc/delete?id=` + id })
  },

  // 导出过程检验单 Excel
  exportIpqc: async (params: any) => {
    return await request.download({ url: `/mes/qc/ipqc/export-excel`, params })
  }
}
