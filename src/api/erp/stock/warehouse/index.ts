import request from '@/config/axios'

// ERP 仓库 VO
export interface WarehouseVO {
  id: number // 仓库编号
  name: string // 仓库名称
  address: string // 仓库地址
  sort: number // 排序
  remark: string // 备注
  principal: string // 负责人
  warehousePrice: number // 仓储费，单位：元
  truckagePrice: number // 搬运费，单位：元
  status: number // 开启状态
  defaultStatus: boolean // 是否默认
}

// ERP 仓库 API
export const WarehouseApi = {
  // 查询仓库分页
  getWarehousePage: async (params: any) => {
    return await request.get({ url: `/erp/warehouse/page`, params })
  },

  // 查询仓库精简列表
  getWarehouseSimpleList: async () => {
    return await request.get({ url: `/erp/warehouse/simple-list` })
  },

  // 查询仓库详情
  getWarehouse: async (id: number) => {
    return await request.get({ url: `/erp/warehouse/get?id=` + id })
  },

  // 新增仓库
  createWarehouse: async (data: WarehouseVO) => {
    return await request.post({ url: `/erp/warehouse/create`, data })
  },

  // 修改仓库
  updateWarehouse: async (data: WarehouseVO) => {
    return await request.put({ url: `/erp/warehouse/update`, data })
  },

  // 修改仓库默认状态
  updateWarehouseDefaultStatus: async (id: number, defaultStatus: boolean) => {
    return await request.put({
      url: `/erp/warehouse/update-default-status`,
      params: {
        id,
        defaultStatus
      }
    })
  },

  // 删除仓库
  deleteWarehouse: async (id: number) => {
    return await request.delete({ url: `/erp/warehouse/delete?id=` + id })
  },

  // 导出仓库 Excel
  exportWarehouse: async (params) => {
    return await request.download({ url: `/erp/warehouse/export-excel`, params })
  }
}
