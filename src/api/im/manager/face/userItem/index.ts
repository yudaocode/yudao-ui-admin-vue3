import request from '@/config/axios'

export interface ImManagerFaceUserItemVO {
  id: number
  userId: number
  userNickname?: string
  url: string
  name?: string
  width?: number
  height?: number
  createTime?: Date
}

// 获得用户表情分页
export const getManagerFaceUserItemPage = (params: PageParam) => {
  return request.get({ url: '/im/manager/face-user-item/page', params })
}

// 删除用户表情
export const deleteManagerFaceUserItem = (id: number) => {
  return request.delete({ url: '/im/manager/face-user-item/delete', params: { id } })
}
