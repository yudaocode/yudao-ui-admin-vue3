import request from '@/config/axios'

export interface PermissionVO {
  id?: number // 数据权限编号
  userId: number // 用户编号
  bizType: number // Crm 类型
  bizId: number // Crm 类型数据编号
  level: number // 权限级别
  deptName?: string // 部门名称
  nickname?: string // 用户昵称
  postNames?: string[] // 岗位名称数组
  createTime?: Date
  ids?: number[]
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
  CRM_BUSINESS = 4, // 商机
  CRM_CONTRACT = 5, // 合同
  CRM_PRODUCT = 6, // 产品
  CRM_RECEIVABLE = 7, // 回款
  CRM_RECEIVABLE_PLAN = 8 // 回款计划
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
export const deletePermissionBatch = async (val: number[]) => {
  return await request.delete({ url: '/crm/permission/delete?ids=' + val.join(',') })
}

// 删除自己的数据权限（退出团队）
export const deleteSelfPermission = async (id: number) => {
  return await request.delete({ url: '/crm/permission/delete-self?id=' + id })
}
