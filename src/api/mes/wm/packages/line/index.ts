import request from '@/config/axios'

// ==================== 装箱明细 ====================

// 装箱明细保存请求 VO
// TODO @AI：不要 save，直接用 WmPackageLineRespVO
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
// TODO @AI：VO 改成 WmPackageLineVO
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
    // TODO @AI：这个接口不需要；是不是前后端都删除掉
    getPackageLineListByPackageId: async (packageId: number) => {
        return await request.get({ url: '/mes/wm/package-line/list-by-package-id', params: { packageId } })
    }
}
