import request from '@/config/axios'

// ERP 库存盘点单 VO
export interface StockCheckVO {
  id: number // 出库编号
  no: string // 出库单号
  outTime: Date // 出库时间
  totalCount: number // 合计数量
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
}

// ERP 库存盘点单 API
export const StockCheckApi = {
  // 查询库存盘点单分页
  getStockCheckPage: async (params: any) => {
    return await request.get({ url: `/erp/stock-check/page`, params })
  },

  // 查询库存盘点单详情
  getStockCheck: async (id: number) => {
    return await request.get({ url: `/erp/stock-check/get?id=` + id })
  },

  // 新增库存盘点单
  createStockCheck: async (data: StockCheckVO) => {
    return await request.post({ url: `/erp/stock-check/create`, data })
  },

  // 修改库存盘点单
  updateStockCheck: async (data: StockCheckVO) => {
    return await request.put({ url: `/erp/stock-check/update`, data })
  },

  // 更新库存盘点单的状态
  updateStockCheckStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/stock-check/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 删除库存盘点单
  deleteStockCheck: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/stock-check/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出库存盘点单 Excel
  exportStockCheck: async (params) => {
    return await request.download({ url: `/erp/stock-check/export-excel`, params })
  }
}
