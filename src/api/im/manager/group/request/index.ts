import request from '@/config/axios'

export interface ImManagerGroupRequestVO {
  id: number
  groupId: number
  groupName?: string
  userId: number
  userNickname?: string
  inviterUserId?: number
  inviterNickname?: string
  applyContent?: string
  addSource?: number
  handleResult: number
  handleUserId?: number
  handleNickname?: string
  handleContent?: string
  handleTime?: Date
  createTime: Date
}

// 获得加群申请分页
export const getManagerGroupRequestPage = (params: PageParam) => {
  return request.get({ url: '/im/manager/group-request/page', params })
}
