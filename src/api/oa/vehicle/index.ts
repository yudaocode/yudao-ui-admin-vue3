import request from '@/config/axios'

export interface VehicleVO {
  id?: number // 编号
  no?: string // 车牌号
  name?: string // 车辆名称
  deptId?: number // 所属部门编号
  deptName?: string // 所属部门名称
  type?: string // 车型
  category?: string // 车辆分类
  brandModel?: string // 品牌型号
  seatCount?: number // 座位数
  barePrice?: number // 裸车价格（元）
  compulsoryInsuranceExpireTime?: string // 交强险到期时间
  commercialInsuranceExpireTime?: string // 商业险到期时间
  inspectionExpireTime?: string // 年检到期时间
  picUrl?: string // 车辆照片 URL
  status?: number // 车辆信息管理状态
  sort?: number // 显示顺序
  remark?: string // 备注
  createTime?: Date // 创建时间
}

// 查询车辆分页
export const getVehiclePage = (params: PageParam) => {
  return request.get({ url: '/oa/vehicle/page', params })
}

// 查询车辆详情
export const getVehicle = (id: number) => {
  return request.get({ url: '/oa/vehicle/get', params: { id } })
}

// 新增车辆
export const createVehicle = (data: VehicleVO) => {
  return request.post({ url: '/oa/vehicle/create', data })
}

// 修改车辆
export const updateVehicle = (data: VehicleVO) => {
  return request.put({ url: '/oa/vehicle/update', data })
}

// 删除车辆
export const deleteVehicle = (id: number) => {
  return request.delete({ url: '/oa/vehicle/delete', params: { id } })
}
