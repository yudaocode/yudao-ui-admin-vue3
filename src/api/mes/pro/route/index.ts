import request from '@/config/axios'

// MES 工艺路线 VO
export interface ProRouteVO {
  id?: number // 编号
  code: string // 工艺路线编码
  name: string // 工艺路线名称
  description?: string // 工艺路线说明
  status?: number // 状态
  remark?: string // 备注
  createTime?: Date // 创建时间
}

// MES 工艺路线 API
export const ProRouteApi = {
  // 查询工艺路线分页
  getRoutePage: async (params: any) => {
    return await request.get({ url: `/mes/pro/route/page`, params })
  },

  // 查询工艺路线精简列表
  getRouteSimpleList: async () => {
    return await request.get({ url: `/mes/pro/route/simple-list` })
  },

  // 查询工艺路线详情
  getRoute: async (id: number) => {
    return await request.get({ url: `/mes/pro/route/get?id=` + id })
  },

  // 新增工艺路线
  createRoute: async (data: ProRouteVO) => {
    return await request.post({ url: `/mes/pro/route/create`, data })
  },

  // 修改工艺路线
  updateRoute: async (data: ProRouteVO) => {
    return await request.put({ url: `/mes/pro/route/update`, data })
  },

  // 修改工艺路线状态
  updateRouteStatus: async (id: number, status: number) => {
    return await request.put({ url: `/mes/pro/route/update-status?id=` + id + `&status=` + status })
  },

  // 删除工艺路线
  deleteRoute: async (id: number) => {
    return await request.delete({ url: `/mes/pro/route/delete?id=` + id })
  },

  // 导出工艺路线 Excel
  exportRoute: async (params: any) => {
    return await request.download({ url: `/mes/pro/route/export-excel`, params })
  }
}
