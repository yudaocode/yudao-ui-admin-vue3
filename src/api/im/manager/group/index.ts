import request from '@/config/axios'

export interface ImManagerGroupVO {
  id: number
  name: string
  avatar?: string
  notice?: string
  ownerUserId: number
  ownerNickname?: string
  memberCount?: number
  status: number
  banned: boolean
  bannedReason?: string
  bannedTime?: Date
  dissolvedTime?: Date
  createTime: Date
}

export interface ImManagerGroupMemberVO {
  userId: number
  nickname?: string
  avatar?: string
  joinTime?: Date
}

// 获得群分页
export const getManagerGroupPage = (params: PageParam) => {
  return request.get({ url: '/im/manager/group/page', params })
}

// 获得群详情
export const getManagerGroup = (id: number) => {
  return request.get({ url: '/im/manager/group/get?id=' + id })
}

// 封禁群
export const banManagerGroup = (data: { id: number; reason: string }) => {
  return request.put({ url: '/im/manager/group/ban', data })
}

// 解封群
export const unbanManagerGroup = (id: number) => {
  return request.put({ url: '/im/manager/group/unban?id=' + id })
}

// 获得群成员列表
export const getManagerGroupMemberList = (groupId: number) => {
  return request.get({ url: '/im/manager/group/member/list?groupId=' + groupId })
}
