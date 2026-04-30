import request from '@/config/axios'

// IM 好友 Response VO
export interface ImFriendRespVO {
  id: number // 关系记录编号
  friendUserId: number // 好友的用户编号
  muted?: boolean // 是否免打扰
  displayName?: string // 好友展示备注（仅自己可见）
  displayNamePinyin?: string // 备注的拼音（小写无空格，前端按首字母分桶 / 拼音搜索）
  status?: number // 好友状态（0=正常，1=已删除）
  addTime?: string // 添加好友时间
  deleteTime?: string // 删除好友时间
  // 聚合字段（自 AdminUser）
  nickname?: string // 好友昵称
  nicknamePinyin?: string // 昵称的拼音（小写无空格，前端按首字母分桶 / 拼音搜索）
  avatar?: string // 好友头像
}

// IM 好友更新 Request VO
export interface ImFriendUpdateReqVO {
  friendUserId: number // 好友的用户编号
  muted?: boolean // 是否免打扰
  displayName?: string // 好友展示备注
}

// 获得当前登录用户的好友列表
export const getMyFriendList = () => {
  return request.get<ImFriendRespVO[]>({ url: '/im/friend/list' })
}

// 获得好友详情
export const getFriend = (friendUserId: number | string) => {
  return request.get<ImFriendRespVO>({ url: '/im/friend/get', params: { friendUserId } })
}

// 添加好友（双向建立关系）
export const addFriend = (friendUserId: number | string) => {
  return request.post<boolean>({ url: '/im/friend/add', params: { friendUserId } })
}

// 删除好友（双向软删除）
export const deleteFriend = (friendUserId: number | string) => {
  return request.delete<boolean>({ url: '/im/friend/delete', params: { friendUserId } })
}

// 更新好友信息
export const updateFriend = (data: ImFriendUpdateReqVO) => {
  return request.put<boolean>({ url: '/im/friend/update', data })
}
