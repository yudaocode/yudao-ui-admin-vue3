import request from '@/config/axios'

export interface PermissionVO {
  id?: number // 数据权限编号
  userId: number | undefined // 用户编号
  bizType: number | undefined // Crm 类型
  bizId: number | undefined // Crm 类型数据编号
  level: number | undefined // 权限级别
  deptName?: string // 部门名称
  nickname?: string // 用户昵称
  postNames?: string[] // 岗位名称数组
  createTime?: Date
}

/**
 * CRM 业务类型枚举
 *
 * @author HUIHUI
 */
export enum BizTypeEnum {
  CRM_LEADS = 1, // 线索
  CRM_CUSTOMER = 2, // 客户
  CRM_CONTACT = 3, // 联系人
  CRM_BUSINESS = 5, // 商机
  CRM_CONTRACT = 6 // 合同
}

/**
 * CRM 数据权限级别枚举
 */
export enum PermissionLevelEnum {
  OWNER = 1, // 负责人
  READ = 2, // 只读
  WRITE = 3 // 读写
}

// 获得数据权限列表（查询团队成员列表）
export const getPermissionList = async (params) => {
  return await request.get({ url: `/crm/permission/list`, params })
}

// 创建数据权限（新增团队成员）
export const createPermission = async (data: PermissionVO) => {
  return await request.post({ url: `/crm/permission/create`, data })
}

// 编辑数据权限（修改团队成员权限级别）
export const updatePermission = async (data) => {
  return await request.put({ url: `/crm/permission/update`, data })
}

// 删除数据权限（删除团队成员）
export const deletePermissionBatch = async (params) => {
  return await request.delete({ url: '/crm/permission/delete', params })
}

// 删除自己的数据权限（退出团队）
export const deleteSelfPermission = async (id) => {
  return await request.delete({ url: '/crm/permission/quit-team?id=' + id })
}

// TODO @puhui999：调整下位置
// 领取公海数据
export const receive = async (data: { bizType: number; bizId: number }) => {
  return await request.put({ url: `/crm/permission/receive`, data })
}

// TODO @puhui999：调整下位置
// 数据放入公海
export const putPool = async (data: { bizType: number; bizId: number }) => {
  return await request.put({ url: `/crm/permission/put-pool`, data })
}
