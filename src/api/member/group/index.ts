import request from '@/config/axios'

export interface GroupVO {
  id: number
  name: string
  remark: string
  status: number
}

// 查询用户分组列表
export const getGroupPage = async (params: any) => {
  return await request.get({ url: `/member/group/page`, params })
}

// 查询用户分组详情
export const getGroup = async (id: number) => {
  return await request.get({ url: `/member/group/get?id=` + id })
}

// 新增用户分组
export const createGroup = async (data: GroupVO) => {
  return await request.post({ url: `/member/group/create`, data })
}

// 查询用户分组 - 精简信息列表
export const getSimpleGroupList = async () => {
  return await request.get({ url: `/member/group/list-all-simple` })
}

// 修改用户分组
export const updateGroup = async (data: GroupVO) => {
  return await request.put({ url: `/member/group/update`, data })
}

// 删除用户分组
export const deleteGroup = async (id: number) => {
  return await request.delete({ url: `/member/group/delete?id=` + id })
}
