import request from '@/config/axios'

// ERP 其它入库单 VO
export interface StockInVO {
  id: number // 入库编号
  no: string // 入库单号
  supplierId: number // 供应商编号
  inTime: Date // 入库时间
  totalCount: number // 合计数量
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
}

// TODO 芋艿：稍后清理字段
// ERP 其它入库单 API
export const StockInApi = {
  // 查询ERP 其它入库单分页
  getStockInPage: async (params: any) => {
    return await request.get({ url: `/erp/stock-in/page`, params })
  },

  // 查询ERP 其它入库单详情
  getStockIn: async (id: number) => {
    return await request.get({ url: `/erp/stock-in/get?id=` + id })
  },

  // 新增ERP 其它入库单
  createStockIn: async (data: StockInVO) => {
    return await request.post({ url: `/erp/stock-in/create`, data })
  },

  // 修改ERP 其它入库单
  updateStockIn: async (data: StockInVO) => {
    return await request.put({ url: `/erp/stock-in/update`, data })
  },

  // 删除ERP 其它入库单
  deleteStockIn: async (id: number) => {
    return await request.delete({ url: `/erp/stock-in/delete?id=` + id })
  },

  // 导出ERP 其它入库单 Excel
  exportStockIn: async (params) => {
    return await request.download({ url: `/erp/stock-in/export-excel`, params })
  },

  // ==================== 子表（ERP 其它入库单项） ====================

  // 获得ERP 其它入库单项列表
  getStockInItemListByInId: async (inId) => {
    return await request.get({ url: `/erp/stock-in/stock-in-item/list-by-in-id?inId=` + inId })
  }
}
