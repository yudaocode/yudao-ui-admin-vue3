import request from '@/config/axios'

// TODO @AI：参考别的 api 文件，需要有一些注释
export interface ProRouteProcessVO {
  id?: number
  routeId: number
  processId: number
  processCode?: string
  processName?: string
  sort: number
  nextProcessId?: number
  nextProcessName?: string
  linkType: number
  prepareTime?: number
  waitTime?: number
  colorCode?: string
  keyFlag?: number
  checkFlag?: number
  remark?: string
  createTime?: Date
}

export const ProRouteProcessApi = {
  getRouteProcessListByRoute: async (routeId: number) => {
    return await request.get({ url: `/mes/pro/route-process/list-by-route?routeId=` + routeId })
  },
  getRouteProcess: async (id: number) => {
    return await request.get({ url: `/mes/pro/route-process/get?id=` + id })
  },
  createRouteProcess: async (data: ProRouteProcessVO) => {
    return await request.post({ url: `/mes/pro/route-process/create`, data })
  },
  updateRouteProcess: async (data: ProRouteProcessVO) => {
    return await request.put({ url: `/mes/pro/route-process/update`, data })
  },
  deleteRouteProcess: async (id: number) => {
    return await request.delete({ url: `/mes/pro/route-process/delete?id=` + id })
  }
}
