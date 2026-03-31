import request from '@/config/axios'

// MES 生产工单 VO
export interface ProWorkOrderVO {
  id: number // 编号
  code: string // 工单编码
  name: string // 工单名称
  type: number // 工单类型
  orderSourceType: number // 来源类型
  orderSourceCode: string // 来源单据编号
  productId: number // 产品编号
  productName: string // 产品名称
  productCode: string // 产品编码
  productSpec: string // 规格型号
  unitMeasureName: string // 单位名称
  quantity: number // 生产数量
  quantityProduced: number // 已生产数量
  quantityChanged: number // 调整数量
  quantityScheduled: number // 已排产数量
  clientId: number // 客户编号
  clientCode: string // 客户编码
  clientName: string // 客户名称
  vendorId: number // 供应商编号
  vendorName: string // 供应商名称
  vendorCode: string // 供应商编码
  batchCode: string // 批次号
  requestDate: Date // 需求日期
  parentId: number // 父工单编号
  parentCode: string // 父工单编码
  finishDate: Date // 完成时间
  cancelDate: Date // 取消时间
  status: number // 工单状态
  remark: string // 备注
}

// MES 生产工单 API
export const ProWorkOrderApi = {
  // 查询生产工单分页
  getWorkOrderPage: async (params: any) => {
    return await request.get({ url: `/mes/pro/work-order/page`, params })
  },

  // 查询生产工单详情
  getWorkOrder: async (id: number) => {
    return await request.get({ url: `/mes/pro/work-order/get?id=` + id })
  },

  // 新增生产工单
  createWorkOrder: async (data: ProWorkOrderVO) => {
    return await request.post({ url: `/mes/pro/work-order/create`, data })
  },

  // 修改生产工单
  updateWorkOrder: async (data: ProWorkOrderVO) => {
    return await request.put({ url: `/mes/pro/work-order/update`, data })
  },

  // 删除生产工单
  deleteWorkOrder: async (id: number) => {
    return await request.delete({ url: `/mes/pro/work-order/delete?id=` + id })
  },

  // 导出生产工单 Excel
  exportWorkOrder: async (params: any) => {
    return await request.download({ url: `/mes/pro/work-order/export-excel`, params })
  },

  // 完成工单
  finishWorkOrder: async (id: number) => {
    return await request.put({ url: `/mes/pro/work-order/finish?id=` + id })
  },

  // 取消工单
  cancelWorkOrder: async (id: number) => {
    return await request.put({ url: `/mes/pro/work-order/cancel?id=` + id })
  },

  // 确认工单
  confirmWorkOrder: async (id: number) => {
    return await request.put({ url: `/mes/pro/work-order/confirm?id=` + id })
  },

  // 获得工单精简列表（下拉选项）
  getWorkOrderSimpleList: async (type?: number) => {
    return await request.get({ url: `/mes/pro/work-order/simple-list`, params: { type } })
  }
}
