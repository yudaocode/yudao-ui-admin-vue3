import request from '@/config/axios'

export interface SupplyApplyItemVO {
  id?: number // 编号
  applyId?: number // 申请编号
  itemId?: number // 用品编号
  itemName?: string // 物品名称
  model?: string // 规格型号
  unit?: string // 计量单位
  manageType?: number // 管理类型
  applyQuantity?: number // 申请数量
  issuedQuantity?: number // 实发数量
  returnedQuantity?: number // 已归还数量
  status?: number // 状态
  issueUserId?: number // 发放人编号
  issueUserName?: string // 发放人
  issueTime?: string // 发放时间
  issueRemark?: string // 发放备注
  returnRemark?: string // 归还备注
  no?: string // 申请单号
  creatorName?: string // 申请人
  deptName?: string // 申请部门
  useType?: number // 使用类型
  createTime?: string // 申请时间
}

// 查询领用发放分页
export const getSupplyApplyItemPage = (params: PageParam) => {
  return request.get({ url: '/oa/supply-issue/page', params })
}

// 发放用品
export const issueSupplyApplyItem = (data: SupplyApplyItemVO) => {
  return request.put({ url: '/oa/supply-issue/issue', data })
}

// 确认归还用品
export const returnSupplyApplyItem = (id: number, quantity: number, returnRemark?: string) => {
  return request.put({ url: '/oa/supply-issue/return', data: { id, quantity, returnRemark } })
}
