import request from '@/config/axios'

export interface SupplyItemVO {
  id?: number // 编号
  deptId?: number // 所属部门
  name?: string // 物品名称
  no?: string // 物品编码
  category?: number // 类别
  manageType?: number // 管理类型
  model?: string // 规格型号
  unit?: string // 计量单位
  referencePrice?: number // 参考单价
  stockQuantity?: number // 库存数量
  minStockQuantity?: number // 最低库存
  picUrl?: string // 物品图片
  status?: number // 状态
  sort?: number // 显示顺序
  remark?: string // 备注
  deptName?: string // 所属部门
  createTime?: string // 创建时间
}

// 查询办公用品分页
export const getSupplyItemPage = (params: PageParam) => {
  return request.get({ url: '/oa/supply-item/page', params })
}

// 查询可领用物品分页
export const getSupplyItemSelectPage = (params: PageParam) => {
  return request.get({ url: '/oa/supply-item/select-page', params })
}

// 查询办公用品详情
export const getSupplyItem = (id: number) => {
  return request.get({ url: '/oa/supply-item/get', params: { id } })
}

// 新增办公用品
export const createSupplyItem = (data: SupplyItemVO) => {
  return request.post({ url: '/oa/supply-item/create', data })
}

// 修改办公用品
export const updateSupplyItem = (data: SupplyItemVO) => {
  return request.put({ url: '/oa/supply-item/update', data })
}

// 删除办公用品
export const deleteSupplyItem = (id: number) => {
  return request.delete({ url: '/oa/supply-item/delete', params: { id } })
}

// 办公用品入库
export const stockInSupplyItem = (id: number, quantity: number) => {
  return request.put({ url: '/oa/supply-item/stock-in', data: { id, quantity } })
}
