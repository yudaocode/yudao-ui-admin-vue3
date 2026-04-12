import request from '@/config/axios'

// MES 库区 VO
export interface WmWarehouseLocationVO {
  id: number
  code: string
  name: string
  warehouseId: number
  warehouseName: string
  area: number
  frozen: boolean
  remark: string
  createTime: string
}

// MES 库区 API
export const WmWarehouseLocationApi = {
  // 查询库区分页
  getWarehouseLocationPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/warehouse-location/page', params })
  },

  // 查询库区精简列表
  getWarehouseLocationSimpleList: async (warehouseId?: number) => {
    return await request.get({
      url: '/mes/wm/warehouse-location/simple-list',
      params: { warehouseId }
    })
  },

  // 查询库区详情
  getWarehouseLocation: async (id: number) => {
    return await request.get({ url: '/mes/wm/warehouse-location/get?id=' + id })
  },

  // 新增库区
  createWarehouseLocation: async (data: WmWarehouseLocationVO) => {
    return await request.post({ url: '/mes/wm/warehouse-location/create', data })
  },

  // 修改库区
  updateWarehouseLocation: async (data: WmWarehouseLocationVO) => {
    return await request.put({ url: '/mes/wm/warehouse-location/update', data })
  },

  // 删除库区
  deleteWarehouseLocation: async (id: number) => {
    return await request.delete({ url: '/mes/wm/warehouse-location/delete?id=' + id })
  },

  // 批量设置库区下所有库位的混放规则
  updateAreaByLocationId: async (
    locationId: number,
    allowItemMixing?: boolean,
    allowBatchMixing?: boolean
  ) => {
    return await request.put({
      url: '/mes/wm/warehouse-location/update-by-location-id',
      params: { locationId, allowItemMixing, allowBatchMixing }
    })
  }
}
