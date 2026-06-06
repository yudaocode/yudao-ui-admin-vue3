import request from '@/config/axios'

// 个人表情
export interface ImFaceUserItemVO {
  id: number
  url: string
  name?: string
  width: number
  height: number
}

// 添加个人表情请求
export interface ImFaceUserItemSaveReqVO {
  url: string
  name?: string
  width: number
  height: number
}

// 获取我的个人表情列表
export const getFaceUserItemList = () => {
  return request.get<ImFaceUserItemVO[]>({ url: '/im/face-user-item/list' })
}

// 添加个人表情
export const createFaceUserItem = (data: ImFaceUserItemSaveReqVO) => {
  return request.post<number>({ url: '/im/face-user-item/create', data })
}

// 删除个人表情
export const deleteFaceUserItem = (id: number) => {
  return request.delete({ url: '/im/face-user-item/delete', params: { id } })
}
