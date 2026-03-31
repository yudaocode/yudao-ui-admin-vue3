import request from '@/config/axios'

// MES 生产流转卡 VO
export interface ProCardVO {
  id: number // 编号
  code: string // 流转卡编码
  workOrderId: number // 生产工单编号
  workOrderCode: string // 工单编码
  workOrderName: string // 工单名称
  batchCode: string // 批次号
  itemId: number // 产品物料编号
  itemCode: string // 产品编码
  itemName: string // 产品名称
  specification: string // 规格型号
  unitMeasureName: string // 单位名称
  transferedQuantity: number // 流转数量
  remark: string // 备注
}

// MES 生产流转卡 API
export const ProCardApi = {
  // 查询生产流转卡分页
  getCardPage: async (params: any) => {
    return await request.get({ url: `/mes/pro/card/page`, params })
  },

  // 查询生产流转卡详情
  getCard: async (id: number) => {
    return await request.get({ url: `/mes/pro/card/get?id=` + id })
  },

  // 新增生产流转卡
  createCard: async (data: ProCardVO) => {
    return await request.post({ url: `/mes/pro/card/create`, data })
  },

  // 修改生产流转卡
  updateCard: async (data: ProCardVO) => {
    return await request.put({ url: `/mes/pro/card/update`, data })
  },

  // 删除生产流转卡
  deleteCard: async (id: number) => {
    return await request.delete({ url: `/mes/pro/card/delete?id=` + id })
  },

  // 导出生产流转卡 Excel
  exportCard: async (params: any) => {
    return await request.download({ url: `/mes/pro/card/export-excel`, params })
  },

  // 获取生产流转卡精简列表
  getCardSimpleList: async () => {
    return await request.get<ProCardVO[]>({ url: `/mes/pro/card/simple-list` })
  }
}
