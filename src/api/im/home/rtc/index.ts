import request from '@/config/axios'
import type {
  ImCallEndReasonValue,
  ImCallParticipantStatusValue
} from '@/views/im/utils/constants'

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
  room: string
  inviteeIds: number[]
}

/** 通话会话 VO；invite / join / accept / refreshToken 共用 */
export interface ImRtcCallRespVO {
  /** 业务通话编号（同时作为 LiveKit 房间名） */
  room: string
  livekitUrl: string
  token?: string
  scene: number
  mediaType: number
  status: number
  inviterId: number
  groupId?: number
  inviteeIds?: number[]
  joinedUserIds?: number[]
}

/** RTC_CALL 通话信令载荷（通话信令统一入口）；status 区分子类型（复用参与者状态枚举）；走 ImPrivateMessageDTO.content 仅推参与方 */
export interface ImRtcCallNotification {
  /** 信令对应的参与者状态变迁；取值参见 ImCallParticipantStatus */
  status: ImCallParticipantStatusValue
  /** 业务通话编号（同时作为 LiveKit 房间名） */
  room: string
  conversationType: number
  mediaType: number
  groupId?: number
  /** INVITE 专属 */
  livekitUrl?: string
  /** INVITE 专属 */
  token?: string
  /** INVITE 专属 */
  inviterUserId?: number
  /** INVITE 专属 */
  inviterNickname?: string
  /** INVITE 专属 */
  inviterAvatar?: string
  /** ACCEPT / REJECT / CANCEL / HUNGUP 专属 */
  operatorUserId?: number
  /** 操作者昵称；按需展示，普通文案不依赖 */
  operatorNickname?: string
  /** 操作者头像；按需展示，普通文案不依赖 */
  operatorAvatar?: string
}

/** RTC_PARTICIPANT_CONNECTED 通话参与者加入载荷；LiveKit webhook participant_joined 转推；callStore +userId 进 joinedUserIds；群聊场景非邀请成员靠 mediaType/inviterUserId 字段首次填充胶囊条 */
export interface ImRtcParticipantConnectedNotification {
  room: string
  userId: number
  conversationType: number
  groupId?: number
  mediaType?: number
  inviterUserId?: number
}

/** RTC_PARTICIPANT_DISCONNECTED 通话参与者离开载荷；LiveKit webhook participant_left 转推；callStore -userId 出 joinedUserIds */
export interface ImRtcParticipantDisconnectedNotification {
  room: string
  userId: number
  conversationType: number
  groupId?: number
}

/** RTC_CALL_START 通话开始载荷；仅群聊；入消息流；前端渲染聊天 tip「{inviterNickname} 发起了{voice/video}通话」；与 END 两段式配对 */
export interface ImRtcCallStartNotification {
  room: string
  conversationType: number
  mediaType: number
  inviterUserId: number
  inviterNickname?: string
  inviterAvatar?: string
}

/** RTC_CALL_END 通话结束载荷；入消息流；私聊渲染准气泡，群聊渲染 tip「{voice/video}通话已结束 [时长 X]」 */
export interface ImRtcCallEndNotification {
  room: string
  conversationType: number
  mediaType: number
  endReason: ImCallEndReasonValue
  durationSeconds?: number
  /** 操作者用户编号；HANGUP/CANCEL/REJECT 触发人；webhook 兜底为 null */
  operatorUserId?: number
  /** 操作者昵称；按需展示，普通文案不依赖 */
  operatorNickname?: string
  /** 操作者头像；按需展示，普通文案不依赖 */
  operatorAvatar?: string
}

/** 群活跃通话查询响应；不含 token */
export interface ImRtcGroupCallRespVO {
  room: string
  groupId: number
  mediaType: number
  inviterId: number
  joinedUserIds?: number[]
  inviteeIds?: number[]
}

/** 发起新通话；同好友对 / 同群已有进行中通话直接抛错（群场景应改走 joinCall） */
export const inviteCall = (data: ImRtcCallInviteReqVO) => {
  return request.post<ImRtcCallRespVO>({ url: '/im/rtc/invite', data })
}

/** 加入已有群通话；用于胶囊条「加入」按钮 */
export const joinCall = (room: string) => {
  return request.post<ImRtcCallRespVO>({ url: '/im/rtc/join', params: { room } })
}

/** 通话中添加成员；仅群通话可用 */
export const inviteMoreCall = (data: ImRtcCallInviteMoreReqVO) => {
  return request.post<boolean>({ url: '/im/rtc/invite-more', data })
}

/** 接听通话 */
export const acceptCall = (room: string) => {
  return request.post<ImRtcCallRespVO>({ url: '/im/rtc/accept', params: { room } })
}

/** 拒绝通话 */
export const rejectCall = (room: string) => {
  return request.post<boolean>({ url: '/im/rtc/reject', params: { room } })
}

/** 取消邀请；主叫接通前调用 */
export const cancelCall = (room: string) => {
  return request.post<boolean>({ url: '/im/rtc/cancel', params: { room } })
}

/** 离开通话；接通后调用 */
export const leaveCall = (room: string) => {
  return request.post<boolean>({ url: '/im/rtc/leave', params: { room } })
}

/** 重新签发 Token；客户端重连或 Token 过期续期 */
export const refreshCallToken = (room: string) => {
  return request.get<ImRtcCallRespVO>({ url: '/im/rtc/refresh-token', params: { room } })
}

/** 查询当前进行中的通话；目前仅群聊场景（胶囊条），后端 API 已留扩展点；返回 null 表示无活跃通话 */
export const getActiveCall = (groupId: number) => {
  return request.get<ImRtcGroupCallRespVO | null>({
    url: '/im/rtc/get-active-call',
    params: { groupId }
  })
}
