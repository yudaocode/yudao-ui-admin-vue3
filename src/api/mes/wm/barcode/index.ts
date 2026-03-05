import request from '@/config/axios'

// MES 条码清单 VO
// TODO @AI：拆分成 index.ts，和 config/index.ts；
// TODO @AI：WM 前缀，类似别的模块，要添加下；
export interface BarcodeVO {
  id: number
  configId: number
  format: number
  bizType: number
  content: string
  bizId: number
  bizCode: string
  bizName: string
  status: number
  remark: string
  createTime: string
}

// MES 条码配置 VO
// TODO @AI：WM 前缀，类似别的模块，要添加下；
export interface BarcodeConfigVO {
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

// MES 条码 API
// TODO @AI：WM 前缀，类似别的模块，要添加下；
export const BarcodeApi = {
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
  createBarcode: async (data: BarcodeVO) => {
    return await request.post({ url: '/mes/wm/barcode/create', data })
  },

  // 修改条码
  updateBarcode: async (data: BarcodeVO) => {
    return await request.put({ url: '/mes/wm/barcode/update', data })
  },

  // 删除条码
  deleteBarcode: async (id: number) => {
    return await request.delete({ url: '/mes/wm/barcode/delete?id=' + id })
  }
}

// MES 条码配置 API
export const BarcodeConfigApi = {
  // 查询条码配置分页
  getBarcodeConfigPage: async (params: any) => {
    return await request.get({ url: '/mes/wm/barcode-config/page', params })
  },

  // 查询条码配置详情
  getBarcodeConfig: async (id: number) => {
    return await request.get({ url: '/mes/wm/barcode-config/get?id=' + id })
  },

  // 新增条码配置
  createBarcodeConfig: async (data: BarcodeConfigVO) => {
    return await request.post({ url: '/mes/wm/barcode-config/create', data })
  },

  // 修改条码配置
  updateBarcodeConfig: async (data: BarcodeConfigVO) => {
    return await request.put({ url: '/mes/wm/barcode-config/update', data })
  },

  // 删除条码配置
  deleteBarcodeConfig: async (id: number) => {
    return await request.delete({ url: '/mes/wm/barcode-config/delete?id=' + id })
  }
}
