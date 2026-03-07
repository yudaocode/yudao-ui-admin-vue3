import request from '@/config/axios'

// MES 条码清单 VO
export interface WmBarcodeVO {
  id?: number
  configId?: number
  format?: number
  bizType?: number
  content?: string
  bizId?: number
  bizCode?: string
  bizName?: string
  status: number
  remark: string
  createTime?: Date
}

// MES 条码 API
export const WmBarcodeApi = {
  // 查询条码分页
  getBarcodePage: async (params: any) => {
    return await request.get({ url: '/mes/wm/barcode/page', params })
  },

  // 查询条码详情
  getBarcode: async (id: number) => {
    return await request.get({ url: '/mes/wm/barcode/get?id=' + id })
  },

  // 根据业务对象获取条码
  getBarcodeByBusiness: async (bizType: number, bizId: number) => {
    return await request.get({
      url: '/mes/wm/barcode/get-by-business',
      params: { bizType, bizId }
    })
  },

  // 新增条码
  createBarcode: async (data: WmBarcodeVO) => {
    return await request.post({ url: '/mes/wm/barcode/create', data })
  },

  // 修改条码
  updateBarcode: async (data: WmBarcodeVO) => {
    return await request.put({ url: '/mes/wm/barcode/update', data })
  },

  // 删除条码
  deleteBarcode: async (id: number) => {
    return await request.delete({ url: '/mes/wm/barcode/delete?id=' + id })
  },

  // 导出条码 Excel
  exportBarcode: async (params: any) => {
    return await request.download({ url: '/mes/wm/barcode/export-excel', params })
  },

  // 生成条码内容
  generateBarcodeContent: async (bizType: number, bizCode: string) => {
    return await request.get({
      url: '/mes/wm/barcode/generate-content',
      params: { bizType, bizCode }
    })
  }
}