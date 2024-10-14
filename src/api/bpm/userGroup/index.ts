import request from '@/config/axios'

export type UserGroupVO = {
  id: number
  name: string
  description: string
  userIds: number[]
  status: number
  remark: string
  createTime: string
}

// 创建用户组
export const createUserGroup = async (data: UserGroupVO) => {
  return await request.post({
    url: '/bpm/user-group/create',
    data: data
  })
}

// 更新用户组
export const updateUserGroup = async (data: UserGroupVO) => {
  return await request.put({
    url: '/bpm/user-group/update',
    data: data
  })
}

// 删除用户组
export const deleteUserGroup = async (id: number) => {
  return await request.delete({ url: '/bpm/user-group/delete?id=' + id })
}

// 获得用户组
export const getUserGroup = async (id: number) => {
  return await request.get({ url: '/bpm/user-group/get?id=' + id })
}

// 获得用户组分页
export const getUserGroupPage = async (params) => {
  return await request.get({ url: '/bpm/user-group/page', params })
}

// 获取用户组精简信息列表
export const getUserGroupSimpleList = async (): Promise<UserGroupVO[]> => {
  return await request.get({ url: '/bpm/user-group/simple-list' })
}
