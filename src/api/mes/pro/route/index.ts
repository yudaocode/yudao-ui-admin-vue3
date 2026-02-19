import request from '@/config/axios'

// TODO @AI：参考别的 api 文件，需要有一些注释
export interface ProRouteVO {
  id?: number
  code: string
  name: string
  description?: string
  status: number
  remark?: string
  createTime?: Date
}

export const ProRouteApi = {
  getRoutePage: async (params: any) => {
    return await request.get({ url: `/mes/pro/route/page`, params })
  },
  getRouteSimpleList: async () => {
    return await request.get({ url: `/mes/pro/route/simple-list` })
  },
  getRoute: async (id: number) => {
    return await request.get({ url: `/mes/pro/route/get?id=` + id })
  },
  createRoute: async (data: ProRouteVO) => {
    return await request.post({ url: `/mes/pro/route/create`, data })
  },
  updateRoute: async (data: ProRouteVO) => {
    return await request.put({ url: `/mes/pro/route/update`, data })
  },
  deleteRoute: async (id: number) => {
    return await request.delete({ url: `/mes/pro/route/delete?id=` + id })
  },
  exportRoute: async (params: any) => {
    return await request.download({ url: `/mes/pro/route/export-excel`, params })
  }
}
