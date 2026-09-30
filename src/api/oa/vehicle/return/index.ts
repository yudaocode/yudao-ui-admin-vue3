import request from '@/config/axios'

export interface VehicleReturnVO {
  id?: number // 编号
  no?: string // 还车申请单号（后端生成）
  applyId?: number // 用车申请编号
  vehicleId?: number // 车辆编号
  userId?: number // 申请人编号
  deptId?: number // 申请部门编号
  actualStartTime?: string // 实际出车时间
  startLocation?: string // 实际出车地点
  reason?: string // 用车事由
  passenger?: string // 随行人
  actualReturnTime?: string // 实际回车时间
  returnLocation?: string // 实际回车地点
  status?: number // 审批状态
  processInstanceId?: string // 流程实例编号
  remark?: string // 还车说明
  fileUrls: string[] // 附件地址列表
  userName?: string // 申请人姓名
  deptName?: string // 申请部门
  applyNo?: string // 用车申请单号
  vehicleNo?: string // 车牌号
  createTime?: Date // 创建时间
}

// 查询本人还车申请分页
export const getVehicleReturnPage = (params: PageParam) => {
  return request.get({ url: '/oa/vehicle-return/page', params })
}

// 查询还车申请详情
export const getVehicleReturn = (id: number) => {
  return request.get({ url: '/oa/vehicle-return/get', params: { id } })
}

// 新增还车申请草稿
export const createVehicleReturn = (data: VehicleReturnVO) => {
  return request.post({ url: '/oa/vehicle-return/create', data })
}

// 修改还车申请草稿
export const updateVehicleReturn = (data: VehicleReturnVO) => {
  return request.put({ url: '/oa/vehicle-return/update', data })
}

// 删除还车申请草稿
export const deleteVehicleReturn = (id: number) => {
  return request.delete({ url: '/oa/vehicle-return/delete', params: { id } })
}

// 提交还车申请
export const submitVehicleReturn = (id: number) => {
  return request.put({ url: '/oa/vehicle-return/submit', params: { id } })
}

// 取消还车申请
export const cancelVehicleReturn = (id: number) => {
  return request.put({ url: '/oa/vehicle-return/cancel', params: { id } })
}
