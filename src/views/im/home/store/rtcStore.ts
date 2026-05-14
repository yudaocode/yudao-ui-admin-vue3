import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ImRtcCallRespVO, ImRtcGroupCallRespVO } from '@/api/im/home/rtc'
import {
  ImRtcCallStage,
  ImRtcCallStatus,
  ImConversationType,
  type ImRtcCallEndReasonValue,
  type ImRtcParticipantStatusValue,
  type ImRtcCallStageValue
} from '../../utils/constants'

// RTC_CALL 通话信令载荷；按 status 区分子类型语义
export interface ImRtcCallNotification {
  status: ImRtcParticipantStatusValue
  room: string
  conversationType: number
  mediaType: number
  groupId?: number
  // INVITE 专属：被叫接通需要的 LiveKit 连接参数 + 主叫展示信息
  livekitUrl?: string
  token?: string
  inviterUserId?: number
  inviterNickname?: string
  inviterAvatar?: string
  // REJECT 专属：操作者展示信息（其它子类型走 RTC_CALL_END）
  operatorUserId?: number
  operatorNickname?: string
  operatorAvatar?: string
}

// RTC_PARTICIPANT_CONNECTED 通话参与者加入载荷（LiveKit webhook 转推）
export interface ImRtcParticipantConnectedNotification {
  room: string
  userId: number
  conversationType: number
  groupId?: number
  // 群聊场景非邀请成员首次填充胶囊条用
  mediaType?: number
  inviterUserId?: number
}

// RTC_PARTICIPANT_DISCONNECTED 通话参与者离开载荷（LiveKit webhook 转推）
export interface ImRtcParticipantDisconnectedNotification {
  room: string
  userId: number
  conversationType: number
  groupId?: number
}

// RTC_CALL_END 通话结束载荷（入消息流；私聊渲染准气泡，群聊渲染 tip）
export interface ImRtcCallEndNotification {
  room: string
  conversationType: number
  mediaType: number
  endReason: ImRtcCallEndReasonValue
  durationSeconds?: number
  // 操作者聚合字段：HANGUP/CANCEL/REJECT 触发人；webhook 兜底为 null
  operatorUserId?: number
  operatorNickname?: string
  operatorAvatar?: string
}

export const useRtcStore = defineStore('imRtc', () => {
  /** 当前阶段 */
  const stage = ref<ImRtcCallStageValue>(ImRtcCallStage.IDLE)
  /** 当前会话；invite / accept / refreshToken 拿到的完整信息 */
  const session = ref<ImRtcCallRespVO | null>(null)
  /** 来电载荷；仅 INCOMING 阶段使用；status 固定 INVITING，其它字段 INVITE 专属 */
  const incomingPayload = ref<ImRtcCallNotification | null>(null)
  /** 显示给对端的展示名（被叫端给主叫端用 / 主叫端给被叫端用） */
  const peerNickname = ref<string>('')
  const peerAvatar = ref<string>('')

  /** 是否处于通话相关阶段 */
  const isActive = computed(() => stage.value !== ImRtcCallStage.IDLE)

  /** 群活跃通话索引；groupId -> 群通话摘要；用于群聊顶部胶囊条 */
  const groupActiveCalls = ref<Map<number, ImRtcGroupCallRespVO>>(new Map())

  /**
   * 已退出 / 已拒绝的用户编号集合；群通话场景内 pending 占位渲染时排除；
   * 来源：参与者离开通知 + 群通话单人拒绝的 operatorUserId；通话结束（reset）时清空
   */
  const leftUserIds = ref<Set<number>>(new Set())

  /** 是否已记录某 userId 已退出 / 拒绝 */
  function isUserLeft(userId: number): boolean {
    return leftUserIds.value.has(userId)
  }

  /**
   * 主叫发起通话；按会话类型 + status 决定 stage；
   * 群通话：发起人直接进 RUNNING 多人卡片视图，房内可能只有自己，等其他人陆续加入；
   * 私聊：按 status 走；RUNNING（已加入已有通话场景）→ RUNNING；CREATED → INVITING 等被叫接通
   */
  function startInviting(s: ImRtcCallRespVO, peer: { nickname?: string; avatar?: string }) {
    // TODO @AI：是不是不叫 session，还是叫 call？然后 s 这个变量，是不是也改下，这个缩写有点怪；
    session.value = s
    peerNickname.value = peer.nickname || ''
    peerAvatar.value = peer.avatar || ''
    // 更新 stage 状态
    if (s.conversationType === ImConversationType.GROUP) {
      stage.value = ImRtcCallStage.RUNNING
      return
    }
    stage.value =
      s.status === ImRtcCallStatus.RUNNING ? ImRtcCallStage.RUNNING : ImRtcCallStage.INVITING
  }

  /** 被叫收到来电；切到 INCOMING；接收 RTC_CALL(INVITE) payload */
  function showIncoming(payload: ImRtcCallNotification) {
    incomingPayload.value = payload
    stage.value = ImRtcCallStage.INCOMING
    peerNickname.value = payload.inviterNickname || ''
    peerAvatar.value = payload.inviterAvatar || ''
  }

  /** 进入通话中阶段 */
  // TODO @AI：s 这个变量名。
  function enterRunning(s: ImRtcCallRespVO) {
    session.value = s
    incomingPayload.value = null
    stage.value = ImRtcCallStage.RUNNING
  }

  /** 重置；通话结束统一调用 */
  function reset() {
    stage.value = ImRtcCallStage.IDLE
    session.value = null
    incomingPayload.value = null
    peerNickname.value = ''
    peerAvatar.value = ''
    leftUserIds.value = new Set()
  }

  /** 标记某个 userId 已退出 / 拒绝；用于 pending 占位渲染时排除 */
  // TODO @AI：是不是和 isUserLeft 放在一块？
  function markUserLeft(userId: number) {
    if (!userId || leftUserIds.value.has(userId)) {
      return
    }
    leftUserIds.value = new Set([...leftUserIds.value, userId])
  }

  // ==================== 群通话胶囊条状态 ====================

  /**
   * 群通话开始 / 状态刷新：写入 / 更新 groupActiveCalls；展示用「胶囊条」；
   * 房内成员同步交给 LiveKit 客户端事件（ParticipantConnected / Disconnected）；
   * 胶囊条不实时刷新 joinedUserIds / inviteeIds，展开 / 加入时再走 getActiveCall 接口拉最新
   */
  function setGroupCall(payload: ImRtcGroupCallRespVO) {
    if (!payload?.groupId) {
      return
    }
    // TODO @AI：最好叫做 newXXX 之类的；
    const next = new Map(groupActiveCalls.value)
    next.set(payload.groupId, payload)
    groupActiveCalls.value = next
  }

  /** 群通话结束：从 groupActiveCalls 移除；胶囊条消失 */
  function removeGroupCall(groupId: number) {
    if (!groupId || !groupActiveCalls.value.has(groupId)) {
      return
    }
    // TODO @AI：最好叫做 newXXX 之类的；
    const next = new Map(groupActiveCalls.value)
    next.delete(groupId)
    groupActiveCalls.value = next
  }

  /** 获取群当前活跃通话；用于胶囊条按 groupId 查询 */
  function getGroupCall(groupId: number): ImRtcGroupCallRespVO | undefined {
    return groupActiveCalls.value.get(groupId)
  }

  /** 通话参与者加入：把 userId 加进 joinedUserIds；群聊场景无活跃记录时首次填充胶囊条 */
  function applyParticipantConnected(payload: ImRtcParticipantConnectedNotification) {
    const isGroup = payload.conversationType === ImConversationType.GROUP
    if (!isGroup || !payload.groupId) {
      return
    }
    // TODO @AI：写下注释
    const existing = groupActiveCalls.value.get(payload.groupId)
    if (!existing) {
      setGroupCall({
        room: payload.room,
        groupId: payload.groupId,
        mediaType: payload.mediaType ?? 0,
        inviterId: payload.inviterUserId ?? 0,
        joinedUserIds: [payload.userId],
        inviteeIds: []
      })
      return
    }
    if (existing.room !== payload.room) {
      return
    }
    // TODO @AI：写下注释
    const joined = existing.joinedUserIds ?? []
    if (joined.includes(payload.userId)) {
      return
    }
    setGroupCall({ ...existing, joinedUserIds: [...joined, payload.userId] })
  }

  /** 通话参与者离开：从 joinedUserIds 移除；同时标记 leftUserIds（pending 占位渲染排除） */
  function applyParticipantDisconnected(payload: ImRtcParticipantDisconnectedNotification) {
    markUserLeft(payload.userId)
    const isGroup = payload.conversationType === ImConversationType.GROUP
    if (!isGroup || !payload.groupId) {
      return
    }
    const existing = groupActiveCalls.value.get(payload.groupId)
    if (!existing || existing.room !== payload.room) {
      return
    }
    const joined = existing.joinedUserIds ?? []
    if (!joined.includes(payload.userId)) {
      return
    }
    setGroupCall({
      ...existing,
      joinedUserIds: joined.filter((id) => id !== payload.userId)
    })
  }

  return {
    stage,
    session,
    incomingPayload,
    peerNickname,
    peerAvatar,
    isActive,
    startInviting,
    showIncoming,
    enterRunning,
    reset,
    markUserLeft,
    isUserLeft,
    setGroupCall,
    removeGroupCall,
    getGroupCall,
    applyParticipantConnected,
    applyParticipantDisconnected
  }
})
