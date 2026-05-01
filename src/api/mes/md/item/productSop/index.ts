import request from '@/config/axios'

// MES 产品SOP VO
export interface MdProductSopVO {
  id?: number // SOP 编号
  itemId: number // 物料产品 ID
  sort: number // 排列顺序
  processId?: number // 工序 ID
  title: string // 标题
  description?: string // 详细描述
  url?: string // 图片地址
  remark?: string // 备注
  createTime?: Date // 创建时间
  // ========== 关联展示字段 ==========
  processCode?: string // 工序编号
  processName?: string // 工序名称
}

// MES 产品SOP API
export const MdProductSopApi = {
  // 创建产品SOP
  createProductSop: async (data: MdProductSopVO) => {
    return await request.post({ url: `/mes/md/product-sop/create`, data })
  },

  // 更新产品SOP
  updateProductSop: async (data: MdProductSopVO) => {
    return await request.put({ url: `/mes/md/product-sop/update`, data })
  },

  // 删除产品SOP
  deleteProductSop: async (id: number) => {
    return await request.delete({ url: `/mes/md/product-sop/delete?id=` + id })
  },

  // 获得产品SOP
  getProductSop: async (id: number) => {
    return await request.get({ url: `/mes/md/product-sop/get?id=` + id })
  },

  // 获得产品SOP分页
  getProductSopPage: async (params: any) => {
    return await request.get({ url: `/mes/md/product-sop/page`, params })
  },

  // 根据物料产品编号获得产品SOP列表
  getProductSopListByItemId: async (itemId: number) => {
    return await request.get({ url: `/mes/md/product-sop/list-by-item-id?itemId=` + itemId })
  }
}
