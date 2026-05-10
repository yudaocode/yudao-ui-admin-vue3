import request from '@/config/axios'

// WMS 库区 VO
export interface WarehouseAreaVO {
  id?: number
  code?: string
  name?: string
  warehouseId?: number
  warehouseName?: string
  remark?: string
  createTime?: Date
}

// WMS 库区 API
export const WarehouseAreaApi = {
  // 查询库区分页
  getWarehouseAreaPage: async (params: any) => {
    return await request.get({ url: '/wms/warehouse-area/page', params })
  },

  // 查询库区精简列表
  getWarehouseAreaSimpleList: async (warehouseId?: number) => {
    return await request.get({ url: '/wms/warehouse-area/simple-list', params: { warehouseId } })
  },

  // 查询库区详情
  getWarehouseArea: async (id: number) => {
    return await request.get({ url: '/wms/warehouse-area/get?id=' + id })
  },

  // 新增库区
  createWarehouseArea: async (data: WarehouseAreaVO) => {
    return await request.post({ url: '/wms/warehouse-area/create', data })
  },

  // 修改库区
  updateWarehouseArea: async (data: WarehouseAreaVO) => {
    return await request.put({ url: '/wms/warehouse-area/update', data })
  },

  // 删除库区
  deleteWarehouseArea: async (id: number) => {
    return await request.delete({ url: '/wms/warehouse-area/delete?id=' + id })
  },

  // 导出库区
  exportWarehouseArea: async (params) => {
    return await request.download({ url: '/wms/warehouse-area/export-excel', params })
  }
}
