import request from '@/config/axios'

// MES 转移单行 VO
export interface WmTransferLineVO {
  id: number
  transferId: number
  materialStockId: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitName?: string
  unitMeasureName?: string
  quantity: number
  batchId: number
  batchCode?: string
  fromWarehouseId: number
  fromWarehouseName?: string
  fromLocationId: number
  fromLocationName?: string
  fromAreaId: number
  fromAreaName?: string
  remark: string
  createTime?: string
}

// MES 转移单行 API
export const WmTransferLineApi = {
  // 查询转移单行列表
  getTransferLineList: async (transferId: number) => {
    return await request.get({ url: '/mes/wm/transfer-line/list', params: { transferId } })
  },

  // 查询转移单行详情
  getTransferLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/transfer-line/get?id=' + id })
  },

  // 新增转移单行
  createTransferLine: async (data: WmTransferLineVO) => {
    return await request.post({ url: '/mes/wm/transfer-line/create', data })
  },

  // 修改转移单行
  updateTransferLine: async (data: WmTransferLineVO) => {
    return await request.put({ url: '/mes/wm/transfer-line/update', data })
  },

  // 删除转移单行
  deleteTransferLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/transfer-line/delete?id=' + id })
  },

}
