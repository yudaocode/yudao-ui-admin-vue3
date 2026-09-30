import request from '@/config/axios'
import type { SupplyApplyItemVO } from '../issue'

export interface SupplyApplyVO {
  id?: number // 编号
  applyTime?: string // 领用日期
  useType?: number // 使用类型
  pickupMethod?: number // 领取方式
  reason?: string // 申请事由
  fileUrls: string[] // 附件地址列表
  remark?: string // 备注
  no?: string // 申请单号
  creator?: string // 申请人编号
  creatorName?: string // 申请人
  deptId?: number // 申请部门编号
  deptName?: string // 申请部门
  status?: number // 单据状态
  processInstanceId?: string // 流程实例编号
  createTime?: string // 创建时间
  items?: SupplyApplyItemVO[] // 领用明细
}

// 查询本人领用申请分页
export const getSupplyApplyPage = (params: PageParam) => {
  return request.get({ url: '/oa/supply-apply/page', params })
}

// 查询领用申请详情
export const getSupplyApply = (id: number) => {
  return request.get({ url: '/oa/supply-apply/get', params: { id } })
}

// 新增领用申请
export const createSupplyApply = (data: SupplyApplyVO) => {
  return request.post({ url: '/oa/supply-apply/create', data })
}

// 修改领用申请
export const updateSupplyApply = (data: SupplyApplyVO) => {
  return request.put({ url: '/oa/supply-apply/update', data })
}

// 删除领用申请
export const deleteSupplyApply = (id: number) => {
  return request.delete({ url: '/oa/supply-apply/delete', params: { id } })
}

// 提交领用申请
export const submitSupplyApply = (id: number) => {
  return request.put({ url: '/oa/supply-apply/submit', params: { id } })
}

// 取消领用申请
export const cancelSupplyApply = (id: number) => {
  return request.put({ url: '/oa/supply-apply/cancel', params: { id } })
}
