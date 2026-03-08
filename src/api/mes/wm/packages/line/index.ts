import request from '@/config/axios'

export interface WmPackageLineVO {
    id?: number
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
    expireDate?: number
    remark?: string
    createTime?: string
}

// 装箱明细 API
export const WmPackageLineApi = {
    // 创建装箱明细
    createPackageLine: async (data: WmPackageLineVO) => {
        return await request.post({ url: '/mes/wm/package-line/create', data })
    },

    // 修改装箱明细
    updatePackageLine: async (data: WmPackageLineVO) => {
        return await request.put({ url: '/mes/wm/package-line/update', data })
    },

    // 删除装箱明细
    deletePackageLine: async (id: number) => {
        return await request.delete({ url: '/mes/wm/package-line/delete?id=' + id })
    },

    // 获取装箱明细详情
    getPackageLine: async (id: number) => {
        return await request.get<WmPackageLineVO>({ url: '/mes/wm/package-line/get?id=' + id })
    },

    // 分页查询装箱明细
    getPackageLinePage: async (params: any) => {
        return await request.get({ url: '/mes/wm/package-line/page', params })
    }
    // DONE @AI：这个接口不需要；是不是前后端都删除掉
}
