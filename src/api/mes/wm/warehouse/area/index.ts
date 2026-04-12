import request from '@/config/axios'

// MES 库位 VO
export interface WmWarehouseAreaVO {
  id: number
  code: string
  name: string
  warehouseId: number
  warehouseName: string
  locationId: number
  locationName: string
  area: number
  maxLoad: number
  positionX: number
  positionY: number
  positionZ: number
  status: number
  frozen: boolean
  allowItemMixing: boolean
  allowBatchMixing: boolean
  remark: string
  createTime: string
}

// MES 库位 API
export const WmWarehouseAreaApi = {
  // 查询库位分页
  getWarehouseAreaPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/warehouse-area/page', params })
  },

  // 查询库位精简列表
  getWarehouseAreaSimpleList: async (locationId?: number) => {
    return await request.get({ url: '/mes/wm/warehouse-area/simple-list', params: { locationId } })
  },

  // 查询库位详情
  getWarehouseArea: async (id: number) => {
    return await request.get({ url: '/mes/wm/warehouse-area/get?id=' + id })
  },

  // 新增库位
  createWarehouseArea: async (data: WmWarehouseAreaVO) => {
    return await request.post({ url: '/mes/wm/warehouse-area/create', data })
  },

  // 修改库位
  updateWarehouseArea: async (data: WmWarehouseAreaVO) => {
    return await request.put({ url: '/mes/wm/warehouse-area/update', data })
  },

  // 删除库位
  deleteWarehouseArea: async (id: number) => {
    return await request.delete({ url: '/mes/wm/warehouse-area/delete?id=' + id })
  }
}
