import request from '@/config/axios'

export interface VehicleApplyVO {
  id?: number // 编号
  no?: string // 申请单号
  vehicleId?: number // 车辆编号
  vehicleNo?: string // 车牌号
  userId?: number // 申请人编号
  deptId?: number // 申请部门编号
  startTime?: string // 预计出车时间
  endTime?: string // 预计回车时间
  startLocation?: string // 出车地点
  endLocation?: string // 预计回车地点
  reason?: string // 用车事由
  passenger?: string // 随行人
  status?: number // 审批状态
  returnStatus?: number // 还车状态
  processInstanceId?: string // 流程实例编号
  remark?: string // 备注
  fileUrls: string[] // 附件地址列表
  userName?: string // 申请人姓名
  deptName?: string // 申请部门
  createTime?: Date // 创建时间
}

// 查询本人用车申请分页
export const getVehicleApplyPage = (params: PageParam) => {
  return request.get({ url: '/oa/vehicle-apply/page', params })
}

// 查询本人用车申请详情
export const getVehicleApply = (id: number) => {
  return request.get({ url: '/oa/vehicle-apply/get', params: { id } })
}

// 查询可申请的车辆分页
export const getAvailableVehiclePage = (params: PageParam) => {
  return request.get({ url: '/oa/vehicle-apply/vehicle-page', params })
}

// 新增用车申请草稿
export const createVehicleApply = (data: VehicleApplyVO) => {
  return request.post({ url: '/oa/vehicle-apply/create', data })
}

// 修改用车申请草稿
export const updateVehicleApply = (data: VehicleApplyVO) => {
  return request.put({ url: '/oa/vehicle-apply/update', data })
}

// 删除用车申请草稿
export const deleteVehicleApply = (id: number) => {
  return request.delete({ url: '/oa/vehicle-apply/delete', params: { id } })
}

// 提交用车申请
export const submitVehicleApply = (id: number) => {
  return request.put({ url: '/oa/vehicle-apply/submit', params: { id } })
}

// 取消用车申请
export const cancelVehicleApply = (id: number) => {
  return request.put({ url: '/oa/vehicle-apply/cancel', params: { id } })
}
