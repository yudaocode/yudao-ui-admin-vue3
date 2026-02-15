import request from '@/config/axios'

// MES 物料产品 VO
export interface MdItemVO {
  id: number // 物料编号
  code: string // 物料编码
  name: string // 物料名称
  specification: string // 规格型号
  unitMeasureId: number // 计量单位编号
  unitMeasureName?: string // 计量单位名称
  itemTypeId: number // 物料分类编号
  itemTypeName?: string // 物料分类名称
  itemOrProduct?: string // 物料/产品标识
  status: number // 状态
  safeStockFlag: boolean // 是否启用安全库存
  minStock: number // 最低库存量
  maxStock: number // 最高库存量
  highValue: boolean // 是否高值物料
  batchFlag: boolean // 是否启用批次管理
  remark: string // 备注
}

// MES 物料产品 API
export const MdItemApi = {
  // 查询物料产品分页
  getItemPage: async (params: any) => {
    return await request.get({ url: `/mes/md/item/page`, params })
  },

  // 查询物料产品精简列表
  getItemSimpleList: async () => {
    return await request.get({ url: `/mes/md/item/simple-list` })
  },

  // 查询物料产品详情
  getItem: async (id: number) => {
    return await request.get({ url: `/mes/md/item/get?id=` + id })
  },

  // 新增物料产品
  createItem: async (data: MdItemVO) => {
    return await request.post({ url: `/mes/md/item/create`, data })
  },

  // 修改物料产品
  updateItem: async (data: MdItemVO) => {
    return await request.put({ url: `/mes/md/item/update`, data })
  },

  // 删除物料产品
  deleteItem: async (id: number) => {
    return await request.delete({ url: `/mes/md/item/delete?id=` + id })
  },

  // 导出物料产品 Excel
  exportItem: async (params: any) => {
    return await request.download({ url: `/mes/md/item/export-excel`, params })
  },

  // 下载物料导入模板
  importTemplate: async () => {
    return await request.download({ url: `/mes/md/item/get-import-template` })
  }
}
