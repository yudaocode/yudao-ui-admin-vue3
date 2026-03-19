import request from '@/config/axios'

// MES 工艺路线工序 VO
export interface ProRouteProcessVO {
  id?: number // 编号
  routeId: number // 工艺路线编号
  processId: number // 工序编号
  processCode?: string // 工序编码
  processName?: string // 工序名称
  sort: number // 序号
  nextProcessId?: number // 下一道工序编号
  nextProcessName?: string // 下一道工序名称
  linkType: number // 与下一道工序关系
  prepareTime?: number // 准备时间（分钟）
  waitTime?: number // 等待时间（分钟）
  colorCode?: string // 甘特图显示颜色
  keyFlag?: number // 是否关键工序
  checkFlag?: boolean // 是否质检工序
  remark?: string // 备注
  createTime?: Date // 创建时间
}

// MES 工艺路线工序 API
export const ProRouteProcessApi = {
  // 按工艺路线查询工序列表
  getRouteProcessListByRoute: async (routeId: number) => {
    return await request.get({ url: `/mes/pro/route-process/list-by-route?routeId=` + routeId })
  },

  // 按产品查询工序列表（自动查找关联的工艺路线）
  getRouteProcessListByProduct: async (productId: number) => {
    return await request.get({ url: `/mes/pro/route-process/list-by-product?productId=` + productId })
  },

  // 查询工艺路线工序详情
  getRouteProcess: async (id: number) => {
    return await request.get({ url: `/mes/pro/route-process/get?id=` + id })
  },

  // 按工艺路线+工序精确查询工序配置
  getRouteProcessByRouteAndProcess: async (routeId: number, processId: number) => {
    return await request.get({
      url: `/mes/pro/route-process/get-by-route-and-process`,
      params: { routeId, processId }
    })
  },

  // 新增工艺路线工序
  createRouteProcess: async (data: ProRouteProcessVO) => {
    return await request.post({ url: `/mes/pro/route-process/create`, data })
  },

  // 修改工艺路线工序
  updateRouteProcess: async (data: ProRouteProcessVO) => {
    return await request.put({ url: `/mes/pro/route-process/update`, data })
  },

  // 删除工艺路线工序
  deleteRouteProcess: async (id: number) => {
    return await request.delete({ url: `/mes/pro/route-process/delete?id=` + id })
  }
}
