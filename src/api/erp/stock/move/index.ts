import request from '@/config/axios'

// ERP 库存调度单 VO
export interface StockMoveVO {
  id: number // 出库编号
  no: string // 出库单号
  outTime: Date // 出库时间
  totalCount: number // 合计数量
  totalPrice: number // 合计金额，单位：元
  status: number // 状态
  remark: string // 备注
}

// ERP 库存调度单 API
export const StockMoveApi = {
  // 查询库存调度单分页
  getStockMovePage: async (params: any) => {
    return await request.get({ url: `/erp/stock-move/page`, params })
  },

  // 查询库存调度单详情
  getStockMove: async (id: number) => {
    return await request.get({ url: `/erp/stock-move/get?id=` + id })
  },

  // 新增库存调度单
  createStockMove: async (data: StockMoveVO) => {
    return await request.post({ url: `/erp/stock-move/create`, data })
  },

  // 修改库存调度单
  updateStockMove: async (data: StockMoveVO) => {
    return await request.put({ url: `/erp/stock-move/update`, data })
  },

  // 更新库存调度单的状态
  updateStockMoveStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/erp/stock-move/update-status`,
      params: {
        id,
        status
      }
    })
  },

  // 删除库存调度单
  deleteStockMove: async (ids: number[]) => {
    return await request.delete({
      url: `/erp/stock-move/delete`,
      params: {
        ids: ids.join(',')
      }
    })
  },

  // 导出库存调度单 Excel
  exportStockMove: async (params) => {
    return await request.download({ url: `/erp/stock-move/export-excel`, params })
  }
}
