import request from '@/config/axios'

export interface RoleVO {
  id: number
  stuName: string
  type: number
  getStarTime: Date
}

export interface UpdateStatusReqVO {
  id: number
  status: number
}

// 查询六星列表
export const getStarPage = async (params: PageParam) => {
  return await request.get({ url: '/school/star/page', params })
}

// // 查询角色（精简)列表
// export const getSimpleRoleList = async (): Promise<RoleVO[]> => {
//   return await request.get({ url: '/system/role/simple-list' })
// }

// // 查询角色详情
// export const getRole = async (id: number) => {
//   return await request.get({ url: '/system/role/get?id=' + id })
// }

// // 新增角色
// export const createRole = async (data: RoleVO) => {
//   return await request.post({ url: '/system/role/create', data })
// }

// 修改角色
export const updateStar = async (data: RoleVO) => {
  return await request.put({ url: '/school/star/update', data })
}

// // 修改角色状态
// export const updateRoleStatus = async (data: UpdateStatusReqVO) => {
//   return await request.put({ url: '/system/role/update-status', data })
// }

// 删除六星
export const deleteStar = async (id: number) => {
  return await request.delete({ url: '/school/star/delete?id=' + id })
}

// // 导出角色
// export const exportRole = (params) => {
//   return request.download({
//     url: '/system/role/export-excel',
//     params
//   })
// }

// 导入六星文件
export const updateFile = (data: any) => {
  return request.upload({ url: '/school/star/import', data })
}
