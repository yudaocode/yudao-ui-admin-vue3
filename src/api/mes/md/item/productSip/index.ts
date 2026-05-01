import request from '@/config/axios'

// MES 产品SIP VO
export interface MdProductSipVO {
  id?: number // SIP 编号
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

// MES 产品SIP API
export const MdProductSipApi = {
  // 创建产品SIP
  createProductSip: async (data: MdProductSipVO) => {
    return await request.post({ url: `/mes/md/product-sip/create`, data })
  },

  // 更新产品SIP
  updateProductSip: async (data: MdProductSipVO) => {
    return await request.put({ url: `/mes/md/product-sip/update`, data })
  },

  // 删除产品SIP
  deleteProductSip: async (id: number) => {
    return await request.delete({ url: `/mes/md/product-sip/delete?id=` + id })
  },

  // 获得产品SIP
  getProductSip: async (id: number) => {
    return await request.get({ url: `/mes/md/product-sip/get?id=` + id })
  },

  // 获得产品SIP分页
  getProductSipPage: async (params: any) => {
    return await request.get({ url: `/mes/md/product-sip/page`, params })
  },

  // 根据物料产品编号获得产品SIP列表
  getProductSipListByItemId: async (itemId: number) => {
    return await request.get({ url: `/mes/md/product-sip/list-by-item-id?itemId=` + itemId })
  }
}
