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
  mutedAll?: boolean // 是否全群禁言
  bannedReason?: string
  bannedTime?: Date
  dissolvedTime?: Date
  createTime: Date
}

export interface ImManagerGroupMemberVO {
  userId: number
  nickname?: string
  avatar?: string
  displayUserName?: string
  groupRemark?: string
  silent?: boolean
  status: number
  role?: number // 成员角色，参见 ImGroupMemberRole 枚举
  joinTime?: Date
  quitTime?: Date
  muteEndTime?: Date // 禁言到期时间
}

// 获得群分页
export const getManagerGroupPage = (params: PageParam) => {
  return request.get({ url: '/im/manager/group/page', params })
}

// 获得群详情
export const getManagerGroup = (id: number) => {
  return request.get({ url: '/im/manager/group/get', params: { id } })
}

// 封禁群
export const banManagerGroup = (data: { id: number; reason: string }) => {
  return request.put({ url: '/im/manager/group/ban', data })
}

// 解封群
export const unbanManagerGroup = (id: number) => {
  return request.put({ url: '/im/manager/group/unban', params: { id } })
}

// 解散群
export const dissolveManagerGroup = (id: number) => {
  return request.delete({ url: '/im/manager/group/dissolve', params: { id } })
}

// 获得群成员列表（含已退群成员，由前端按需过滤）
export const getManagerGroupMemberList = (groupId: number) => {
  return request.get({ url: '/im/manager/group/member/list', params: { groupId } })
}
