import request from '@/config/axios'

// WMS 仓库 VO
export interface WarehouseVO {
  id?: number
  code?: string
  name?: string
  remark?: string
  sort?: number
  createTime?: Date
}

// WMS 仓库 API
export const WarehouseApi = {
  // 查询仓库分页
  getWarehousePage: async (params: any) => {
    return await request.get({ url: '/wms/warehouse/page', params })
  },

  // 查询仓库精简列表
  getWarehouseSimpleList: async () => {
    return await request.get({ url: '/wms/warehouse/simple-list' })
  },

  // 查询仓库详情
  getWarehouse: async (id: number) => {
    return await request.get({ url: '/wms/warehouse/get?id=' + id })
  },

  // 新增仓库
  createWarehouse: async (data: WarehouseVO) => {
    return await request.post({ url: '/wms/warehouse/create', data })
  },

  // 修改仓库
  updateWarehouse: async (data: WarehouseVO) => {
    return await request.put({ url: '/wms/warehouse/update', data })
  },

  // 删除仓库
  deleteWarehouse: async (id: number) => {
    return await request.delete({ url: '/wms/warehouse/delete?id=' + id })
  },

  // 导出仓库
  exportWarehouse: async (params) => {
    return await request.download({ url: '/wms/warehouse/export-excel', params })
  }
}
