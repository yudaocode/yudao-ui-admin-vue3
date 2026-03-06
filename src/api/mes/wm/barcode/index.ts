import request from '@/config/axios'

// DONE @AI：拆分成 index.ts，和 config/index.ts；
// DONE @AI：WM 前缀，类似别的模块，要添加下；

// MES 条码清单 VO
export interface WmBarcodeVO {
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
  }
}

// 兼容旧引用
// TODO @AI：不用兼容就旧的。检查下，替换掉；然后下面删除掉；
/** @deprecated 使用 WmBarcodeVO 代替 */
export type BarcodeVO = WmBarcodeVO
/** @deprecated 使用 WmBarcodeApi 代替 */
export const BarcodeApi = WmBarcodeApi
/** @deprecated 使用 '@/api/mes/wm/barcode/config' 的 WmBarcodeConfigApi 代替 */
export { WmBarcodeConfigApi as BarcodeConfigApi } from './config'
export type { WmBarcodeConfigVO as BarcodeConfigVO } from './config'
