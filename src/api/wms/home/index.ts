import request from '@/config/axios'

// WMS 首页统计查询参数
export interface WmsHomeStatisticsReqVO {
  warehouseId?: number
  goodsLimit?: number
  warehouseLimit?: number
}

// WMS 首页单据状态统计 VO
export interface WmsHomeOrderStatusVO {
  status: number
  count: number
}

// WMS 首页单据汇总统计 VO
export interface WmsHomeOrderSummaryVO {
  type: number
  total: number
  statuses: WmsHomeOrderStatusVO[]
}

// WMS 首页单据趋势 VO
export interface WmsHomeOrderTrendVO {
  time: string | number
  receiptCount: number
  shipmentCount: number
  movementCount: number
  checkCount: number
}

// WMS 首页商品库存排行 VO
export interface WmsHomeInventoryItemRankVO {
  id: number
  name: string
  quantity: number
}

// WMS 首页仓库库存排行 VO
export interface WmsHomeInventoryWarehouseRankVO {
  id: number
  name: string
  quantity: number
}

// WMS 首页库存汇总统计 VO
export interface WmsHomeInventorySummaryVO {
  totalQuantity: number
  goodsShareList: WmsHomeInventoryItemRankVO[]
  warehouseDistributionList: WmsHomeInventoryWarehouseRankVO[]
}

// WMS 首页统计 API
export const WmsHomeStatisticsApi = {
  // 获得首页单据汇总统计
  getOrderSummary: async (params?: WmsHomeStatisticsReqVO): Promise<WmsHomeOrderSummaryVO[]> => {
    return await request.get({ url: `/wms/home-statistics/order-summary`, params })
  },

  // 获得首页单据趋势
  getOrderTrend: async (
    days?: number,
    params?: WmsHomeStatisticsReqVO
  ): Promise<WmsHomeOrderTrendVO[]> => {
    return await request.get({
      url: `/wms/home-statistics/order-trend`,
      params: { ...params, days }
    })
  },

  // 获得首页库存汇总统计
  getInventorySummary: async (
    params?: WmsHomeStatisticsReqVO
  ): Promise<WmsHomeInventorySummaryVO> => {
    return await request.get({ url: `/wms/home-statistics/inventory-summary`, params })
  }
}
