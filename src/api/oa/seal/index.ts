import request from '@/config/axios'

export interface SealVO {
  id?: number // 编号
  deptId?: number // 所属部门编号
  deptName?: string // 所属部门
  no?: string // 印章编号
  name?: string // 印章名称
  type?: number // 印章类型
  category?: number // 印章分类
  keeperUserId?: number // 保管人用户编号
  keeperDeptId?: number // 保管部门编号
  status?: number // 印章台账状态
  purchaseTime?: string // 购买时间
  enableTime?: string // 启用时间
  disableTime?: string // 停用时间
  picUrl?: string // 印章照片地址
  keeperName?: string // 保管人
  keeperDeptName?: string // 保管部门
  sort?: number // 显示顺序
  remark?: string // 备注
  createTime?: Date // 创建时间
}

// 查询印章分页
export const getSealPage = (params: PageParam) => {
  return request.get({ url: '/oa/seal/page', params })
}

// 查询印章详情
export const getSeal = (id: number) => {
  return request.get({ url: '/oa/seal/get', params: { id } })
}

// 新增印章
export const createSeal = (data: SealVO) => {
  return request.post({ url: '/oa/seal/create', data })
}

// 修改印章
export const updateSeal = (data: SealVO) => {
  return request.put({ url: '/oa/seal/update', data })
}

// 删除印章
export const deleteSeal = (id: number) => {
  return request.delete({ url: '/oa/seal/delete', params: { id } })
}
