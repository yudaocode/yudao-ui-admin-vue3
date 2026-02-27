import request from '@/config/axios'

// MES 仓库 VO
export interface WmWarehouseVO {
  id: number
  code: string
  name: string
  address: string
  area: number
  chargeUserId: number
  frozen: boolean
  remark: string
  createTime: string
}

// MES 仓库 API
export const WmWarehouseApi = {
  // 查询仓库分页
  getWarehousePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/warehouse/page', params })
  },

  // 查询仓库精简列表
  getWarehouseSimpleList: async () => {
    return await request.get({ url: '/mes/wm/warehouse/simple-list' })
  },

  // 查询仓库详情
  getWarehouse: async (id: number) => {
    return await request.get({ url: '/mes/wm/warehouse/get?id=' + id })
  },

  // 新增仓库
  createWarehouse: async (data: WmWarehouseVO) => {
    return await request.post({ url: '/mes/wm/warehouse/create', data })
  },

  // 修改仓库
  updateWarehouse: async (data: WmWarehouseVO) => {
    return await request.put({ url: '/mes/wm/warehouse/update', data })
  },

  // 删除仓库
  deleteWarehouse: async (id: number) => {
    return await request.delete({ url: '/mes/wm/warehouse/delete?id=' + id })
  },
}
