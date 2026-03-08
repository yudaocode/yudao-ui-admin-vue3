import request from '@/config/axios'

// 装箱单响应 VO
// TODO @AI：VO 改成 WmPackageVO
export interface WmPackageRespVO {
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
    createPackage: async (data: WmPackageRespVO) => {
        return await request.post({ url: '/mes/wm/package/create', data })
    },

    // 修改装箱单
    updatePackage: async (data: WmPackageRespVO) => {
        return await request.put({ url: '/mes/wm/package/update', data })
    },

    // 删除装箱单
    deletePackage: async (id: number) => {
        return await request.delete({ url: '/mes/wm/package/delete?id=' + id })
    },

    // 获取装箱单详情
    getPackage: async (id: number) => {
        return await request.get<WmPackageRespVO>({ url: '/mes/wm/package/get?id=' + id })
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
    // TODO @AI：addChildPackage，且接口地址改成 /mes/wm/package/add-child-package
    addSubPackage: async (parentId: number, childId: number) => {
        return await request.put({ url: '/mes/wm/package/add-sub-package', params: { parentId, childId } })
    },

    // 移除子箱
    // TODO @AI：removeChildPackage，且接口地址改成 /mes/wm/package/remove-child-package
    removeSubPackage: async (childId: number) => {
        return await request.put({ url: '/mes/wm/package/remove-sub-package?childId=' + childId })
    },

    // 获取装箱单精简列表（无父箱 + 已完成状态，用于选择父箱）
    // TODO @AI：改成 getChildablePackageSimpleList，且接口地址改成 /mes/wm/package/childable-simple-list；注释改成 可添加为子箱的装箱单精简列表（无父箱 + 已完成状态，用于选择父箱）
    getPackageSimpleList: async () => {
        return await request.get<WmPackageRespVO[]>({ url: '/mes/wm/package/simple-list' })
    }
}
