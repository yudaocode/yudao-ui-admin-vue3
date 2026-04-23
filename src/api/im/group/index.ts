import request from '@/config/axios'

// 群 Response VO
export interface ImGroupRespVO {
  id: number // 编号
  name: string // 群名称
  ownerUserId: number // 群主用户编号
  avatar?: string // 群头像
  notice?: string // 群公告
  banned?: boolean // 是否封禁
  bannedTime?: string // 封禁时间
  status: number // 群状态（0=正常，1=已解散）
  dissolvedTime?: string // 解散时间
  createTime?: string // 创建时间
}

// 群创建 Request VO
export interface ImGroupCreateReqVO {
  name: string // 群名称
}

// 群更新 Request VO
export interface ImGroupUpdateReqVO {
  id: number // 群编号
  name?: string // 群名称
  avatar?: string // 群头像
  notice?: string // 群公告
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
