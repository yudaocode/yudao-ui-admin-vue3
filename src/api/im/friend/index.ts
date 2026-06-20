import request from '@/config/axios'

// IM 好友 Response VO
export interface ImFriendRespVO {
  id: number // 关系记录编号
  friendUserId: number // 好友的用户编号
  silent?: boolean // 是否免打扰
  displayName?: string // 好友展示备注（仅自己可见）
  displayNamePinyin?: string // 备注的拼音（小写无空格，前端按首字母分桶 / 拼音搜索）
  addSource?: number // 添加来源；参见 ImFriendAddSourceEnum
  pinned?: boolean // 是否置顶联系人
  blocked?: boolean // 是否拉黑
  status?: number // 好友状态（0=正常，1=已删除）
  addTime?: string // 添加好友时间
  deleteTime?: string // 删除好友时间
  updateTime?: number // 最近更新时间（毫秒时间戳，增量拉取游标用）
  // 聚合字段（自 AdminUser）
  nickname?: string // 好友昵称
  nicknamePinyin?: string // 昵称的拼音（小写无空格，前端按首字母分桶 / 拼音搜索）
  avatar?: string // 好友头像
}

// IM 好友更新 Request VO
export interface ImFriendUpdateReqVO {
  friendUserId: number // 好友的用户编号
  silent?: boolean // 是否免打扰
  displayName?: string // 好友展示备注
  pinned?: boolean // 是否置顶联系人
}

// 获得当前登录用户的好友列表
export const getMyFriendList = () => {
  return request.get<ImFriendRespVO[]>({ url: '/im/friend/list' })
}

// 增量拉取当前用户的好友关系（重连 / 离线补偿）
export const pullMyFriendList = (params: {
  lastUpdateTime?: number
  lastId?: number
  limit: number
}) => {
  return request.get<ImFriendRespVO[]>({ url: '/im/friend/pull', params })
}

// 获得好友详情
export const getFriend = (friendUserId: number | string) => {
  return request.get<ImFriendRespVO>({ url: '/im/friend/get', params: { friendUserId } })
}

// 删除好友（单向软删除）
export const deleteFriend = (friendUserId: number | string, clear: boolean) => {
  return request.delete<boolean>({
    url: '/im/friend/delete',
    params: { friendUserId, clear }
  })
}

// 更新好友信息（备注 / 免打扰 / 联系人置顶）
export const updateFriend = (data: ImFriendUpdateReqVO) => {
  return request.put<boolean>({ url: '/im/friend/update', data })
}

// 拉黑好友（必须先是好友；单边屏蔽对方私聊消息）
export const blockFriend = (friendUserId: number | string) => {
  return request.put<boolean>({ url: '/im/friend/block', params: { friendUserId } })
}

// 移出黑名单
export const unblockFriend = (friendUserId: number | string) => {
  return request.put<boolean>({ url: '/im/friend/unblock', params: { friendUserId } })
}
