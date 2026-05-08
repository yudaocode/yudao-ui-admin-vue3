import request from '@/config/axios'
import type { ImGroupMessageRespVO } from '@/api/im/home/message/group'

// 群 Response VO
export interface ImGroupRespVO {
  id: number // 编号
  name: string // 群名称
  ownerUserId: number // 群主用户编号
  avatar?: string // 群头像
  notice?: string // 群公告
  banned?: boolean // 是否封禁
  mutedAll?: boolean // 是否全群禁言
  joinApproval?: boolean // 进群是否需群主 / 管理员审批
  bannedTime?: string // 封禁时间
  status: number // 群状态（0=正常，1=已解散）
  dissolvedTime?: string // 解散时间
  createTime?: string // 创建时间
  pinnedMessages?: ImGroupMessageRespVO[] // 群置顶消息列表（后端关联回填，仅当登录用户是群成员时非空）
}

// 群消息置顶 / 取消置顶 Request VO
export interface ImGroupMessagePinReqVO {
  groupId: number // 群编号
  messageId: number // 消息编号
}

// 群创建 Request VO
export interface ImGroupCreateReqVO {
  name: string // 群名称
  memberUserIds?: number[] // 初始成员用户编号列表（建群同时邀请的好友，不含创建者自己）
  joinApproval?: boolean // 进群是否需审批；不传默认 false 自由进群
}

// 群更新 Request VO
export interface ImGroupUpdateReqVO {
  id: number // 群编号
  name?: string // 群名称
  avatar?: string // 群头像
  notice?: string // 群公告
  joinApproval?: boolean // 进群是否需审批
}

// 添加 / 撤销群管理员 Request VO
export interface ImGroupAdminReqVO {
  groupId: number // 群编号
  userIds: number[] // 目标用户编号列表
}

// 群主转让 Request VO
export interface ImGroupTransferOwnerReqVO {
  groupId: number // 群编号
  newOwnerUserId: number // 新群主用户编号
}

// 获得当前登录用户的群列表
export const getMyGroupList = () => {
  return request.get<ImGroupRespVO[]>({ url: '/im/group/list' })
}

// 获得群详情
export const getGroup = (id: number | string) => {
  return request.get<ImGroupRespVO>({ url: '/im/group/get', params: { id } })
}

// 创建群
export const createGroup = (data: ImGroupCreateReqVO) => {
  return request.post<ImGroupRespVO>({ url: '/im/group/create', data })
}

// 更新群
export const updateGroup = (data: ImGroupUpdateReqVO) => {
  return request.put<ImGroupRespVO>({ url: '/im/group/update', data })
}

// 解散群
export const dissolveGroup = (id: number | string) => {
  return request.delete<boolean>({ url: '/im/group/dissolve', params: { id } })
}

// 添加群管理员（仅群主可调）
export const addGroupAdmin = (data: ImGroupAdminReqVO) => {
  return request.put<boolean>({ url: '/im/group/add-admin', data })
}

// 撤销群管理员（仅群主可调）
export const removeGroupAdmin = (data: ImGroupAdminReqVO) => {
  return request.put<boolean>({ url: '/im/group/remove-admin', data })
}

// 转让群主（仅老群主可调；旧群主转让后降为普通成员）
export const transferGroupOwner = (data: ImGroupTransferOwnerReqVO) => {
  return request.put<boolean>({ url: '/im/group/transfer-owner', data })
}

// 置顶群消息（仅群主 / 管理员可调）
export const pinGroupMessage = (data: ImGroupMessagePinReqVO) => {
  return request.put<boolean>({ url: '/im/group/pin-message', data })
}

// 取消置顶群消息（仅群主 / 管理员可调）
export const unpinGroupMessage = (data: ImGroupMessagePinReqVO) => {
  return request.put<boolean>({ url: '/im/group/unpin-message', data })
}

// 全群禁言 / 取消（仅群主 / 管理员可调）
export const muteAll = (data: { groupId: number; mutedAll: boolean }) => {
  return request.put<boolean>({ url: '/im/group/mute-all', data })
}

// 禁言成员
export const muteMember = (data: { groupId: number; userId: number; mutedSeconds: number }) => {
  return request.put<boolean>({ url: '/im/group/mute-member', data })
}

// 取消成员禁言
export const cancelMuteMember = (data: { groupId: number; userId: number }) => {
  return request.put<boolean>({ url: '/im/group/cancel-mute-member', data })
}
