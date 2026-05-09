import request from '@/config/axios'

/** 会话场景；对齐后端 ImConversationTypeEnum */
export const ImCallScene = {
  PRIVATE: 1,
  GROUP: 2
} as const

/** 媒体类型；对齐后端 ImCallMediaTypeEnum */
export const ImCallMediaType = {
  VOICE: 1,
  VIDEO: 2
} as const

/** 通话状态；对齐后端 ImCallStatusEnum */
export const ImCallStatus = {
  INVITING: 10,
  ONGOING: 20,
  ENDED: 30
} as const

/** 通话结束原因；对齐后端 ImCallEndReasonEnum */
export const ImCallEndReason = {
  HANGUP: 1,
  REJECT: 2,
  CANCEL: 3,
  TIMEOUT: 4,
  BUSY: 5,
  ERROR: 9
} as const

/** 发起通话请求 VO */
export interface ImRtcCallInviteReqVO {
  scene: number
  mediaType: number
  peerUserId?: number
  groupId?: number
  /** 群通话场景：前端选定的子集；为空回退到群活跃成员 */
  inviteeIds?: number[]
}

/** 通话中添加成员请求 VO */
export interface ImRtcCallInviteMoreReqVO {
  roomName: string
  inviteeIds: number[]
}

/** 通话会话 VO；invite / accept / refreshToken / getActiveSessions 共用 */
export interface ImRtcCallRespVO {
  callId: string
  roomName: string
  livekitUrl: string
  token?: string
  scene: number
  mediaType: number
  status: number
  inviterId: number
  groupId?: number
  inviteeIds?: number[]
  joinedUserIds?: number[]
  newCreated?: boolean
}

/** RTC_INVITE 信令载荷；payload 走 ImPrivateMessageDTO.content（JSON 字符串） */
export interface ImRtcInviteNotification {
  callId: string
  roomName: string
  livekitUrl: string
  token: string
  scene: number
  mediaType: number
  inviterId: number
  inviterNickname?: string
  inviterAvatar?: string
  groupId?: number
}

/** RTC_ACCEPT 信令载荷 */
export interface ImRtcAcceptNotification {
  callId: string
  roomName: string
  acceptorId: number
}

/** RTC_END 信令载荷 */
export interface ImRtcEndNotification {
  callId: string
  roomName: string
  operatorId?: number
  reason: number
  durationSeconds?: number
}

/** RTC_GROUP_STARTED / RTC_GROUP_UPDATED / RTC_GROUP_ENDED 共用载荷 */
export interface ImRtcGroupNotification {
  callId: string
  roomName: string
  groupId: number
  mediaType: number
  inviterId: number
  joinedUserIds?: number[]
  inviteeIds?: number[]
}

/** 群活跃通话查询响应；不含 token */
export interface ImRtcGroupCallRespVO {
  callId: string
  roomName: string
  groupId: number
  mediaType: number
  inviterId: number
  joinedUserIds?: number[]
  inviteeIds?: number[]
}

/** 发起通话；同好友对 / 群已有进行中通话则返回该会话并标记 newCreated=false */
export const inviteCall = (data: ImRtcCallInviteReqVO) => {
  return request.post<ImRtcCallRespVO>({ url: '/im/rtc/invite', data })
}

/** 通话中添加成员；仅群通话可用 */
export const inviteMoreCall = (data: ImRtcCallInviteMoreReqVO) => {
  return request.post<boolean>({ url: '/im/rtc/invite-more', data })
}

/** 接听通话 */
export const acceptCall = (roomName: string) => {
  return request.post<ImRtcCallRespVO>({ url: '/im/rtc/accept', params: { roomName } })
}

/** 拒绝通话 */
export const rejectCall = (roomName: string) => {
  return request.post<boolean>({ url: '/im/rtc/reject', params: { roomName } })
}

/** 取消邀请；主叫接通前调用 */
export const cancelCall = (roomName: string) => {
  return request.post<boolean>({ url: '/im/rtc/cancel', params: { roomName } })
}

/** 离开通话；接通后调用 */
export const leaveCall = (roomName: string) => {
  return request.post<boolean>({ url: '/im/rtc/leave', params: { roomName } })
}

/** 重新签发 Token；客户端重连或 Token 过期续期 */
export const refreshCallToken = (roomName: string) => {
  return request.get<ImRtcCallRespVO>({ url: '/im/rtc/refresh-token', params: { roomName } })
}

/** 查询当前用户活跃通话；冷启动 / 推送点开恢复 */
export const getActiveCallSessions = () => {
  return request.get<ImRtcCallRespVO[]>({ url: '/im/rtc/active-sessions' })
}

/** 查询群当前进行中的通话；用于群聊顶部胶囊条；返回 null 表示无活跃通话 */
export const getGroupActiveCall = (groupId: number) => {
  return request.get<ImRtcGroupCallRespVO | null>({
    url: '/im/rtc/group-active-call',
    params: { groupId }
  })
}
