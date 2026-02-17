import request from '@/config/axios'

// MES 生产工单 VO
export interface ProWorkorderVO {
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
  unitMeasureId: number // 单位编号
  unitMeasureName: string // 单位名称
  quantity: number // 生产数量
  quantityProduced: number // 已生产数量
  quantityChanged: number // 调整数量
  quantityScheduled: number // 已排产数量
  clientId: number // 客户编号
  clientName: string // 客户名称
  vendorId: number // 供应商编号
  vendorName: string // 供应商名称
  batchCode: string // 批次号
  requestDate: Date // 需求日期
  parentId: number // 父工单编号
  ancestors: string // 所有父节点编号
  finishDate: Date // 完成时间
  cancelDate: Date // 取消时间
  status: number // 工单状态
  remark: string // 备注
}

// MES 生产工单 API
export const ProWorkorderApi = {
  // 查询生产工单分页
  getWorkorderPage: async (params: any) => {
    return await request.get({ url: `/mes/pro/workorder/page`, params })
  },

  // 查询生产工单详情
  getWorkorder: async (id: number) => {
    return await request.get({ url: `/mes/pro/workorder/get?id=` + id })
  },

  // 新增生产工单
  createWorkorder: async (data: ProWorkorderVO) => {
    return await request.post({ url: `/mes/pro/workorder/create`, data })
  },

  // 修改生产工单
  updateWorkorder: async (data: ProWorkorderVO) => {
    return await request.put({ url: `/mes/pro/workorder/update`, data })
  },

  // 删除生产工单
  deleteWorkorder: async (id: number) => {
    return await request.delete({ url: `/mes/pro/workorder/delete?id=` + id })
  },

  // 导出生产工单 Excel
  exportWorkorder: async (params: any) => {
    return await request.download({ url: `/mes/pro/workorder/export-excel`, params })
  },

  // 完成工单
  finishWorkorder: async (id: number) => {
    return await request.put({ url: `/mes/pro/workorder/finish?id=` + id })
  },

  // 取消工单
  cancelWorkorder: async (id: number) => {
    return await request.put({ url: `/mes/pro/workorder/cancel?id=` + id })
  }
}
