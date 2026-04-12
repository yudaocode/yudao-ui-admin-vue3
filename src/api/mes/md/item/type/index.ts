import request from '@/config/axios'

// MES 物料产品分类 VO
export interface MdItemTypeVO {
  id: number // 分类编号
  parentId: number // 父分类编号
  code: string // 分类编码
  name: string // 分类名称
  itemOrProduct: string // 物料/产品标识
  sort: number // 显示排序
  status: number // 状态
  remark: string // 备注
}

// MES 物料产品分类 API
export const MdItemTypeApi = {
  // 查询物料产品分类列表
  getItemTypeList: async (params?: any) => {
    return await request.get({ url: `/mes/md/item-type/list`, params })
  },

  // 查询物料产品分类精简列表
  getItemTypeSimpleList: async () => {
    return await request.get({ url: `/mes/md/item-type/simple-list` })
  },

  // 查询物料产品分类详情
  getItemType: async (id: number) => {
    return await request.get({ url: `/mes/md/item-type/get?id=` + id })
  },

  // 新增物料产品分类
  createItemType: async (data: MdItemTypeVO) => {
    return await request.post({ url: `/mes/md/item-type/create`, data })
  },

  // 修改物料产品分类
  updateItemType: async (data: MdItemTypeVO) => {
    return await request.put({ url: `/mes/md/item-type/update`, data })
  },

  // 删除物料产品分类
  deleteItemType: async (id: number) => {
    return await request.delete({ url: `/mes/md/item-type/delete?id=` + id })
  }
}
