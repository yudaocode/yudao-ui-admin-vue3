import request from '@/config/axios'

// MES 质检方案-产品关联 VO
export interface QcTemplateItemVO {
  id: number // 编号
  templateId: number // 质检方案ID
  itemId: number // 产品物料ID
  quantityCheck: number // 最低检测数
  quantityUnqualified: number // 最大不合格数
  criticalRate: number // 最大致命缺陷率（%）
  majorRate: number // 最大严重缺陷率（%）
  minorRate: number // 最大轻微缺陷率（%）
  remark: string // 备注
  // JOIN mes_md_item
  itemCode: string // 物料编码
  itemName: string // 物料名称
  specification: string // 规格型号
  unitMeasureName: string // 计量单位名称
}

// MES 质检方案-产品关联 API
export const QcTemplateItemApi = {
  // 查询产品关联分页
  getTemplateItemPage: async (params: any) => {
    return await request.get({ url: `/mes/qc/template/item/page`, params })
  },

  // 查询产品关联详情
  getTemplateItem: async (id: number) => {
    return await request.get({ url: `/mes/qc/template/item/get?id=` + id })
  },

  // 新增产品关联
  createTemplateItem: async (data: QcTemplateItemVO) => {
    return await request.post({ url: `/mes/qc/template/item/create`, data })
  },

  // 修改产品关联
  updateTemplateItem: async (data: QcTemplateItemVO) => {
    return await request.put({ url: `/mes/qc/template/item/update`, data })
  },

  // 删除产品关联
  deleteTemplateItem: async (id: number) => {
    return await request.delete({ url: `/mes/qc/template/item/delete?id=` + id })
  }
}
