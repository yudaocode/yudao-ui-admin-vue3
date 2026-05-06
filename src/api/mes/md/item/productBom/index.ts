import request from '@/config/axios'

// MES 产品BOM VO
export interface MdProductBomVO {
  id?: number // BOM 编号
  itemId: number // 物料产品 ID
  bomItemId: number // BOM 物料 ID
  quantity: number // 物料使用比例
  status?: number // 是否启用
  remark?: string // 备注
  createTime?: Date // 创建时间
  // ========== 关联展示字段 ==========
  bomItemCode?: string // BOM 物料编码
  bomItemName?: string // BOM 物料名称
  bomItemSpecification?: string // BOM 物料规格
  unitMeasureName?: string // 计量单位名称
  itemOrProduct?: string // 产品物料标识
}

// MES 产品BOM API
export const MdProductBomApi = {
  // 创建产品BOM
  createProductBom: async (data: MdProductBomVO) => {
    return await request.post({ url: `/mes/md/product-bom/create`, data })
  },

  // 更新产品BOM
  updateProductBom: async (data: MdProductBomVO) => {
    return await request.put({ url: `/mes/md/product-bom/update`, data })
  },

  // 删除产品BOM
  deleteProductBom: async (id: number) => {
    return await request.delete({ url: `/mes/md/product-bom/delete?id=` + id })
  },

  // 获得产品BOM
  getProductBom: async (id: number) => {
    return await request.get({ url: `/mes/md/product-bom/get?id=` + id })
  },

  // 获得产品BOM分页
  getProductBomPage: async (params: any) => {
    return await request.get({ url: `/mes/md/product-bom/page`, params })
  },

  // 根据物料产品编号获得产品BOM列表
  getProductBomListByItemId: async (itemId: number) => {
    return await request.get({ url: `/mes/md/product-bom/list-by-item-id?itemId=` + itemId })
  }
}
