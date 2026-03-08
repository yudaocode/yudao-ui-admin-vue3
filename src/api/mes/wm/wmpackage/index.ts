import request from '@/config/axios'
// TODO @AI：拆成两个，一个 index.ts，一个 linde/index.ts 两个；

// ==================== 装箱单主表 ====================

// 装箱单保存请求 VO
// TODO @AI：不需要独立的 SaveReqVO；直接用 WmPackageRespVO
export interface WmPackageSaveReqVO {
    id?: number
    code: string
    parentId?: number
    packageDate: number
    soCode?: string
    invoiceCode?: string
    clientId?: number
    length?: number
    width?: number
    height?: number
    sizeUnitId?: number
    netWeight?: number
    grossWeight?: number
    weightUnitId?: number
    inspectorUserId?: number
    status?: number
    remark?: string
}

// 装箱单响应 VO
export interface WmPackageRespVO {
    id: number
    code: string
    parentId?: number
    packageDate: number
    soCode?: string
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
    // TODO @AI：后端不用返回 children；前端根据 parentId 直接 handleTree 就好了
    children?: WmPackageRespVO[]
    createTime: string
}

// 装箱单 API
export const WmPackageApi = {
    // 创建装箱单
    createPackage: async (data: WmPackageSaveReqVO) => {
        return await request.post({ url: '/mes/wm/package/create', data })
    },

    // 修改装箱单
    updatePackage: async (data: WmPackageSaveReqVO) => {
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

    // 导出装箱单 Excel
    exportPackage: async (params: any) => {
        return await request.download({ url: '/mes/wm/package/export-excel', params })
    },

    // 完成装箱单
    finishPackage: async (id: number) => {
        return await request.put({ url: '/mes/wm/package/finish?id=' + id })
    },

    // 获取装箱单树形结构
    getPackageTree: async (params?: any) => {
        return await request.get({ url: '/mes/wm/package/tree', params })
    }
}

// ==================== 装箱明细 ====================

// 装箱明细保存请求 VO
export interface WmPackageLineSaveReqVO {
    id?: number
    packageId: number
    materialStockId?: number
    itemId: number
    quantity: number
    workOrderId?: number
    warehouseId?: number
    locationId?: number
    areaId?: number
    expireDate?: number
    remark?: string
}

// 装箱明细响应 VO
export interface WmPackageLineRespVO {
    id: number
    packageId: number
    materialStockId?: number
    itemId: number
    itemCode?: string
    itemName?: string
    specification?: string
    unitMeasureName?: string
    quantity: number
    workOrderId?: number
    workOrderCode?: string
    batchCode?: string
    warehouseId?: number
    warehouseName?: string
    locationId?: number
    locationName?: string
    areaId?: number
    areaName?: string
    expireDate?: number
    remark?: string
    createTime: string
}

// 装箱明细 API
export const WmPackageLineApi = {
    // 创建装箱明细
    createPackageLine: async (data: WmPackageLineSaveReqVO) => {
        return await request.post({ url: '/mes/wm/package-line/create', data })
    },

    // 修改装箱明细
    updatePackageLine: async (data: WmPackageLineSaveReqVO) => {
        return await request.put({ url: '/mes/wm/package-line/update', data })
    },

    // 删除装箱明细
    deletePackageLine: async (id: number) => {
        return await request.delete({ url: '/mes/wm/package-line/delete?id=' + id })
    },

    // 获取装箱明细详情
    getPackageLine: async (id: number) => {
        return await request.get<WmPackageLineRespVO>({ url: '/mes/wm/package-line/get?id=' + id })
    },

    // 分页查询装箱明细
    getPackageLinePage: async (params: any) => {
        return await request.get({ url: '/mes/wm/package-line/page', params })
    },

    // 根据装箱单 ID 获取明细列表
    getPackageLineListByPackageId: async (packageId: number) => {
        return await request.get({ url: '/mes/wm/package-line/list-by-package-id', params: { packageId } })
    }
}
