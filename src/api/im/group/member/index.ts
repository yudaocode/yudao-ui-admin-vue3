import request from '@/config/axios'

// 群成员 Response VO
export interface ImGroupMemberRespVO {
  id: number // 编号
  groupId: number // 群编号
  userId: number // 用户编号
  displayUserName?: string // 组内显示名（群主设置的备注）
  groupRemark?: string // 群备注（当前用户对群的备注）
  silent?: boolean // 是否免打扰
  status?: number // 成员状态（0=在群，1=退群）
  role?: number // 成员角色，参见 ImGroupMemberRole 枚举
  joinTime?: string // 入群时间
  quitTime?: string // 退群时间
  muteEndTime?: string // 禁言到期时间
  createTime?: string // 创建时间
  // 聚合字段（自 AdminUser）
  nickname?: string // 用户昵称
  avatar?: string // 用户头像
}

// 群成员邀请 Request VO
export interface ImGroupMemberInviteReqVO {
  groupId: number // 群编号
  memberUserIds: number[] // 被邀请的用户编号列表
}

// 群成员移除 Request VO
export interface ImGroupMemberRemoveReqVO {
  groupId: number // 群编号
  memberUserIds: number[] // 被移除的用户编号列表
}

// 群成员更新 Request VO
export interface ImGroupMemberUpdateReqVO {
  groupId: number // 群编号
  displayUserName?: string // 群内昵称
  groupRemark?: string // 群备注
  silent?: boolean // 是否免打扰
}

// 邀请用户加入群
export const inviteGroupMember = (data: ImGroupMemberInviteReqVO) => {
  return request.post<boolean>({ url: '/im/group/invite', data })
}

// 退出群
export const quitGroup = (groupId: number | string) => {
  return request.delete<boolean>({ url: '/im/group/quit', params: { groupId } })
}

// 移除群成员
export const removeGroupMember = (data: ImGroupMemberRemoveReqVO) => {
  return request.delete<boolean>({ url: '/im/group/kicking', data })
}

// 获得群成员详情
export const getGroupMember = (groupId: number, userId: number) => {
  return request.get<ImGroupMemberRespVO>({
    url: '/im/group-member/get',
    params: { groupId, userId }
  })
}

// 获得指定群的成员列表（聚合 AdminUser 昵称 / 头像）
export const getGroupMemberList = (groupId: number | string) => {
  return request.get<ImGroupMemberRespVO[]>({
    url: '/im/group-member/list',
    params: { groupId }
  })
}

// 更新群成员
export const updateGroupMember = (data: ImGroupMemberUpdateReqVO) => {
  return request.put<boolean>({ url: '/im/group-member/update', data })
}
