import request from '@/config/axios'

export interface PermissionVO {
  id: number // 数据权限编号
  userId: number // 用户编号
  bizType: number // Crm 类型
  bizId: number // Crm 类型数据编号
  level: number // 权限级别
  deptName: string // 部门名称
  nickname: string // 用户昵称
  postNames: string // 岗位名称数组
}

// 查询团队成员列表
export const getPermissionList = async (params) => {
  return await request.get({ url: `/crm/permission/list`, params })
}

// 新增团队成员
export const createPermission = async (data: PermissionVO) => {
  return await request.post({ url: `/crm/permission/add`, data })
}

// 修改团队成员
export const updatePermission = async (data: PermissionVO) => {
  return await request.put({ url: `/crm/permission/update`, data })
}

// 删除团队成员
export const deletePermission = async (params) => {
  return await request.delete({ url: '/crm/permission/delete', params })
}
