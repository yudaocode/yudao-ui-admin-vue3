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

// 查询六星总览
export const getStarOverview = async (params) => {
  return await request.get({ url: '/school/star/overview', params})
}

// 导入六星文件
export const updateFile = (data: any) => {
  return request.upload({ url: '/school/star/import', data })
}

// 导出采购订单 Excel
export const exportSixStarOverview = async (params: any) => {
  return await request.download({ url: `/school/star/export-excel`, params })
}
