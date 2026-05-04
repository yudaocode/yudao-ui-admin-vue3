import request from '@/config/axios'

// TODO DONE @AI：路径迁移到 api/im/friend/request/index.ts，与 api/im/group/member 这种嵌套结构对齐
// IM 好友申请 Response VO
export interface ImFriendRequestRespVO {
  id: number // 申请编号
  fromUserId: number // 发起方用户编号
  toUserId: number // 接收方用户编号
  handleResult: number // 处理结果；0=未处理；1=同意；2=拒绝
  applyContent?: string // 申请理由
  handleContent?: string // 处理理由（接收方拒绝时可选填）
  addSource?: number // 添加来源；参见 ImFriendAddSourceEnum
  handleTime?: string // 处理时间
  createTime: string // 申请创建时间
  // 聚合字段（自 AdminUser）
  fromNickname?: string // 发起方昵称
  fromAvatar?: string // 发起方头像
  toNickname?: string // 接收方昵称
  toAvatar?: string // 接收方头像
}

// IM 好友申请发起 Request VO
export interface ImFriendRequestApplyReqVO {
  toUserId: number // 接收方用户编号
  applyContent?: string // 申请理由
  displayName?: string // 对接收方的备注（仅自己可见）
  addSource?: number // 添加来源
}

// 发起好友申请
export const applyFriendRequest = (data: ImFriendRequestApplyReqVO) => {
  return request.post<number | null>({ url: '/im/friend-request/apply', data })
}

// 同意好友申请
export const agreeFriendRequest = (id: number | string) => {
  return request.put<boolean>({ url: '/im/friend-request/agree', params: { id } })
}

// 拒绝好友申请
export const refuseFriendRequest = (id: number | string, handleContent?: string) => {
  return request.put<boolean>({
    url: '/im/friend-request/refuse',
    params: { id, handleContent }
  })
}

// 查询「我相关」的好友申请列表（含我发起的、别人加我的）
export const getMyFriendRequestList = () => {
  return request.get<ImFriendRequestRespVO[]>({ url: '/im/friend-request/list' })
}
