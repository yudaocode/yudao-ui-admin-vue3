import request from '@/config/axios'

// MES 条码配置 VO
export interface WmBarcodeConfigVO {
    id: number
    format: number
    bizType: number
    contentFormat: string
    contentExample: string
    autoGenerateFlag: boolean
    defaultTemplate: string
    status: number
    remark: string
    createTime: string
}

// MES 条码配置 API
export const WmBarcodeConfigApi = {
    // 查询条码配置分页
    getBarcodeConfigPage: async (params: any) => {
        return await request.get({ url: '/mes/wm/barcode-config/page', params })
    },

    // 查询条码配置详情
    getBarcodeConfig: async (id: number) => {
        return await request.get({ url: '/mes/wm/barcode-config/get?id=' + id })
    },

    // 新增条码配置
    createBarcodeConfig: async (data: WmBarcodeConfigVO) => {
        return await request.post({ url: '/mes/wm/barcode-config/create', data })
    },

    // 修改条码配置
    updateBarcodeConfig: async (data: WmBarcodeConfigVO) => {
        return await request.put({ url: '/mes/wm/barcode-config/update', data })
    },

    // 删除条码配置
    deleteBarcodeConfig: async (id: number) => {
        return await request.delete({ url: '/mes/wm/barcode-config/delete?id=' + id })
    }
}
