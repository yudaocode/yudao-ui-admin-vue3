import request from '@/config/axios'

// 装箱单 VO
export interface WmPackageVO {
  id: number
  code: string
  parentId?: number
  packageDate: number
  salesOrderCode?: string
  invoiceCode?: string
  clientId?: number
  clientCode?: string
  clientName?: string
  clientNickname?: string
  length?: number
  width?: number
  height?: number
  sizeUnitId?: number
  sizeUnitName?: string
  netWeight?: number
  grossWeight?: number
  weightUnitId?: number
  weightUnitName?: string
  inspectorUserId?: number
  inspectorName?: string
  status: number
  remark?: string
  createTime: string
}

// 装箱单 API
export const WmPackageApi = {
  // 创建装箱单
  createPackage: async (data: WmPackageVO) => {
    return await request.post({ url: '/mes/wm/package/create', data })
  },

  // 修改装箱单
  updatePackage: async (data: WmPackageVO) => {
    return await request.put({ url: '/mes/wm/package/update', data })
  },

  // 删除装箱单
  deletePackage: async (id: number) => {
    return await request.delete({ url: '/mes/wm/package/delete?id=' + id })
  },

  // 获取装箱单详情
  getPackage: async (id: number) => {
    return await request.get<WmPackageVO>({ url: '/mes/wm/package/get?id=' + id })
  },

  // 分页查询装箱单
  getPackagePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/package/page', params })
  },

  // 完成装箱单
  finishPackage: async (id: number) => {
    return await request.put({ url: '/mes/wm/package/finish?id=' + id })
  },

  // 添加子箱
  addChildPackage: async (parentId: number, childId: number) => {
    return await request.put({
      url: '/mes/wm/package/add-child-package',
      params: { parentId, childId }
    })
  },

  // 移除子箱
  removeChildPackage: async (childId: number) => {
    return await request.put({ url: '/mes/wm/package/remove-child-package?childId=' + childId })
  },

  // 可添加为子箱的装箱单精简列表（无父箱 + 已完成状态，用于选择父箱）
  getChildablePackageSimpleList: async () => {
    return await request.get<WmPackageVO[]>({ url: '/mes/wm/package/childable-simple-list' })
  }
}
