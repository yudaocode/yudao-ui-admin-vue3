import request from '@/config/axios'

// MES 生产入库单行 VO
export interface WmProductProduceLineVO {
  id?: number
  produceId: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  quantity: number
  batchCode?: string
  lotNumber?: string
  expireDate?: string
  qualityStatus?: number
  remark?: string
}

// MES 生产入库单行 API
export const WmProductProduceLineApi = {
  // 查询生产入库单行分页
  getProductProduceLinePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/product-produce-line/page', params })
  },

  // 查询生产入库单行详情
  getProductProduceLine: async (id: number) => {
    return await request.get({ url: '/mes/wm/product-produce-line/get?id=' + id })
  },

  // 新增生产入库单行
  createProductProduceLine: async (data: WmProductProduceLineVO) => {
    return await request.post({ url: '/mes/wm/product-produce-line/create', data })
  },

  // 修改生产入库单行
  updateProductProduceLine: async (data: WmProductProduceLineVO) => {
    return await request.put({ url: '/mes/wm/product-produce-line/update', data })
  },

  // 删除生产入库单行
  deleteProductProduceLine: async (id: number) => {
    return await request.delete({ url: '/mes/wm/product-produce-line/delete?id=' + id })
  },

  // 查询生产入库单行列表（按入库单编号）
  getProductProduceLineListByProduceId: async (produceId: number) => {
    return await request.get({ url: '/mes/wm/product-produce-line/list-by-produce', params: { produceId } })
  }
}
