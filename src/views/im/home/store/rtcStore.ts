import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { isEqual, union } from 'lodash-es'
import type { ImRtcCallRespVO, ImRtcGroupCallRespVO } from '@/api/im/rtc'
import {
  ImRtcCallStage,
  ImRtcCallStatus,
  ImConversationType,
  type ImRtcCallEndReasonValue,
  type ImRtcParticipantStatusValue,
  type ImRtcCallStageValue
} from '../../utils/constants'
import { getCurrentUserId } from '@/utils/auth'
import { useFriendStore } from './friendStore'
import { useGroupStore } from './groupStore'

type GroupActiveCallCache = ImRtcGroupCallRespVO & {
  participantsLoaded?: boolean // 是否已拉取完整参与者列表
}

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
  // INVITE 专属：本次被邀请人列表；包含收件人自身，前端来电小条按需过滤展示「邀请的其他人」
  inviteeIds?: number[]
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

// RTC_CALL_END 通话结束载荷（入消息流；私聊渲染消息气泡，群聊渲染系统提示行）
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
  /** 当前通话；invite / accept / refreshToken 拿到的完整信息 */
  const call = ref<ImRtcCallRespVO | null>(null)
  /** 来电载荷；仅 INCOMING 阶段使用；status 固定 INVITING，其它字段 INVITE 专属 */
  const incomingPayload = ref<ImRtcCallNotification | null>(null)
  /** 进入 RUNNING 的时间戳；用于通话时长展示；reset 时清零 */
  const startedAt = ref(0)

  /** 是否处于通话相关阶段 */
  const isActive = computed(() => stage.value !== ImRtcCallStage.IDLE)

  /**
   * 对端展示名；按阶段 + 会话类型分支：
   * INCOMING 取来电载荷的 inviterNickname；群通话取群名；私聊查 friendStore 反查对端 userId
   */
  const peerNickname = computed<string>(() => {
    if (stage.value === ImRtcCallStage.INCOMING) {
      return incomingPayload.value?.inviterNickname || ''
    }
    const c = call.value
    if (!c) return ''
    if (c.conversationType === ImConversationType.GROUP) {
      return useGroupStore().getGroup(c.groupId ?? 0)?.name || ''
    }
    const peerUserId = resolvePrivatePeerUserId(c)
    return (peerUserId && useFriendStore().getFriend(peerUserId)?.nickname) || ''
  })

  /** 对端头像；策略同 peerNickname */
  const peerAvatar = computed<string>(() => {
    if (stage.value === ImRtcCallStage.INCOMING) {
      return incomingPayload.value?.inviterAvatar || ''
    }
    const c = call.value
    if (!c) return ''
    if (c.conversationType === ImConversationType.GROUP) {
      return useGroupStore().getGroup(c.groupId ?? 0)?.avatar || ''
    }
    const peerUserId = resolvePrivatePeerUserId(c)
    return (peerUserId && useFriendStore().getFriend(peerUserId)?.avatar) || ''
  })

  /** 私聊场景对端 userId：自己是主叫则取首个 invitee，否则取 inviter */
  function resolvePrivatePeerUserId(c: ImRtcCallRespVO): number | undefined {
    const myId = getCurrentUserId()
    return c.inviterId === myId ? c.inviteeIds?.[0] : c.inviterId
  }

  /** 群活跃通话索引；groupId -> 群通话摘要；用于群聊顶部胶囊条 */
  const groupActiveCalls = ref<Map<number, GroupActiveCallCache>>(new Map())

  /**
   * 已退出 / 已拒绝的用户编号集合；群通话场景内 pending 占位渲染时排除；
   * 来源：参与者离开通知 + 群通话单人拒绝的 operatorUserId；通话结束（reset）时清空
   */
  const leftUserIds = ref<Set<number>>(new Set())

  /** 是否已记录某 userId 已退出 / 拒绝 */
  function isUserLeft(userId: number): boolean {
    return leftUserIds.value.has(userId)
  }

  /** 标记某个 userId 已退出 / 拒绝；用于 pending 占位渲染时排除 */
  function markUserLeft(userId: number) {
    if (!userId || leftUserIds.value.has(userId)) {
      return
    }
    leftUserIds.value = new Set([...leftUserIds.value, userId])
  }

  /**
   * 主叫发起通话；按会话类型 + status 决定 stage；
   * 群通话：发起人直接进 RUNNING 多人卡片视图，房内可能只有自己，等其他人陆续加入；
   * 私聊：按 status 走；RUNNING（已加入已有通话场景）→ RUNNING；CREATED → INVITING 等被叫接通
   */
  function startInviting(data: ImRtcCallRespVO) {
    call.value = data
    // 群通话场景写入本地胶囊条缓存
    syncGroupActiveCall(data)
    // 更新 stage 状态
    if (data.conversationType === ImConversationType.GROUP) {
      stage.value = ImRtcCallStage.RUNNING
      startedAt.value = Date.now()
      return
    }
    const running = data.status === ImRtcCallStatus.RUNNING
    stage.value = running ? ImRtcCallStage.RUNNING : ImRtcCallStage.INVITING
    if (running) {
      startedAt.value = Date.now()
    }
  }

  /** 被叫收到来电；切到 INCOMING；接收 RTC_CALL(INVITE) payload */
  function showIncoming(payload: ImRtcCallNotification) {
    if (isActive.value) {
      return
    }
    incomingPayload.value = payload
    stage.value = ImRtcCallStage.INCOMING
    // 按 inviter 兜底首次填充胶囊条
    syncGroupActiveCall({
      conversationType: payload.conversationType,
      room: payload.room,
      groupId: payload.groupId,
      mediaType: payload.mediaType,
      inviterId: payload.inviterUserId ?? 0,
      joinedUserIds: payload.inviterUserId ? [payload.inviterUserId] : [],
      inviteeIds: payload.inviteeIds
    })
  }

  /** 进入通话中阶段 */
  function enterRunning(data: ImRtcCallRespVO) {
    call.value = data
    // 离开 INCOMING 阶段；清空来电载荷
    incomingPayload.value = null
    stage.value = ImRtcCallStage.RUNNING
    startedAt.value = Date.now()
    // 接通后用 RespVO 完整覆盖胶囊条
    syncGroupActiveCall(data)
  }

  /**
   * 群通话场景同步本地 groupActiveCalls 缓存；非群通话或缺 groupId 直接返回；
   * 不依赖后端 webhook 推送的 RTC_PARTICIPANT_CONNECTED 首次填充，避免胶囊条出现延迟；
   * 被叫场景通知载荷无 joinedUserIds，调用方按主叫人兜底，后续 getActiveCall / 参与者事件刷新成完整列表
   */
  function syncGroupActiveCall(input: {
    conversationType: number
    room: string
    groupId?: number
    mediaType: number
    inviterId: number
    joinedUserIds?: number[]
    inviteeIds?: number[]
  }) {
    if (input.conversationType !== ImConversationType.GROUP || !input.groupId) {
      return
    }
    // 写入或更新群活跃通话缓存
    setGroupCall({
      room: input.room,
      groupId: input.groupId,
      mediaType: input.mediaType,
      inviterId: input.inviterId,
      joinedUserIds: input.joinedUserIds ?? [],
      inviteeIds: input.inviteeIds ?? []
    })
  }

  /** 重置；通话结束统一调用 */
  function reset() {
    stage.value = ImRtcCallStage.IDLE
    call.value = null
    incomingPayload.value = null
    startedAt.value = 0
    leftUserIds.value = new Set()
  }

  /** 通话中追加被邀请人；让 participants 网格出现 pending 占位、胶囊条同步更新 */
  function appendInvitees(userIds: number[]) {
    if (!call.value || userIds.length === 0) {
      return
    }
    const existing = call.value.inviteeIds ?? []
    const merged = union(existing, userIds)
    if (merged.length === existing.length) {
      return
    }
    call.value = { ...call.value, inviteeIds: merged }
    syncGroupActiveCall(call.value)
  }

  // ==================== 群通话胶囊条状态 ====================

  /**
   * 群通话开始 / 状态刷新：写入 / 更新 groupActiveCalls；展示用「胶囊条」；
   * 房内成员同步交给 LiveKit 客户端事件（ParticipantConnected / Disconnected）；
   * 胶囊条不实时刷新 joinedUserIds / inviteeIds，展开 / 加入时再走 getActiveCall 接口拉最新
   */
  function setGroupCall(payload: ImRtcGroupCallRespVO, participantsLoaded?: boolean) {
    if (!payload?.groupId) {
      return
    }
    useGroupStore().markGroupActiveCallLoaded(payload.groupId)
    // 浅比较：room / mediaType / joinedUserIds / inviteeIds 都没变就跳过，避免下游 watcher 无意义重算
    const existing = groupActiveCalls.value.get(payload.groupId)
    const nextParticipantsLoaded =
      participantsLoaded ?? (existing?.room === payload.room && !!existing.participantsLoaded)
    if (
      existing &&
      isSameGroupCall(existing, payload) &&
      !!existing.participantsLoaded === nextParticipantsLoaded
    ) {
      return
    }
    const newGroupActiveCalls = new Map(groupActiveCalls.value)
    newGroupActiveCalls.set(payload.groupId, {
      ...payload,
      participantsLoaded: nextParticipantsLoaded
    })
    groupActiveCalls.value = newGroupActiveCalls
  }

  /** 清空指定群的通话缓存 */
  function clearGroupCallCache(groupId?: number) {
    if (!groupId) {
      groupActiveCalls.value = new Map()
      return
    }
    const next = new Map(groupActiveCalls.value)
    next.delete(groupId)
    groupActiveCalls.value = next
  }

  /** 判断群通话是否已补齐 */
  function isGroupCallParticipantsLoaded(groupId: number, room?: string): boolean {
    const call = groupActiveCalls.value.get(groupId)
    return !!groupId && !!room && !!call && call.room === room && !!call.participantsLoaded
  }

  /** 两条群通话摘要内容相等（room / mediaType / inviterId / 两个 userId 数组逐项相等） */
  function isSameGroupCall(a: ImRtcGroupCallRespVO, b: ImRtcGroupCallRespVO): boolean {
    if (a.room !== b.room || a.mediaType !== b.mediaType || a.inviterId !== b.inviterId) {
      return false
    }
    return (
      isEqual(a.joinedUserIds ?? [], b.joinedUserIds ?? []) &&
      isEqual(a.inviteeIds ?? [], b.inviteeIds ?? [])
    )
  }

  /** 群通话结束：从 groupActiveCalls 移除；胶囊条消失 */
  function removeGroupCall(groupId: number, room?: string) {
    if (!groupId) {
      return
    }
    const existing = groupActiveCalls.value.get(groupId)
    if (room && existing?.room !== room) {
      return
    }
    clearGroupCallCache(groupId)
    useGroupStore().markGroupActiveCallLoaded(groupId)
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
    // 胶囊条懒填充：本端可能在通话开始后才打开该群会话，没收到过 setGroupCall；
    // 此处用加入通知建一条最小记录，inviteeIds 留空，展开 popover / 加入时再走 getActiveCall 补
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
    dropFromGroupActiveCall(payload.groupId, payload.room, payload.userId)
  }

  /** 群通话单人拒绝邀请：标记 leftUserIds + 从胶囊条 inviteeIds 移除（私聊拒绝走 RTC_CALL_END，不入本通道） */
  function applyParticipantRejected(
    payload: Pick<ImRtcCallNotification, 'room' | 'conversationType' | 'groupId' | 'operatorUserId'>
  ) {
    if (!payload.operatorUserId) {
      return
    }
    markUserLeft(payload.operatorUserId)
    if (payload.conversationType === ImConversationType.GROUP && payload.groupId) {
      dropFromGroupActiveCall(payload.groupId, payload.room, payload.operatorUserId)
    }
  }

  /** 群通话单人振铃超时；对 banner 的处理与拒接一致（语义独立、实现共享） */
  function applyParticipantNoAnswer(
    payload: Pick<ImRtcCallNotification, 'room' | 'conversationType' | 'groupId' | 'operatorUserId'>
  ) {
    applyParticipantRejected(payload)
  }

  /** 从指定群活跃通话的 joined / pending 列表里同步移除某用户；用于 disconnect / reject 让胶囊条不再展示 */
  function dropFromGroupActiveCall(groupId: number, room: string, userId: number) {
    const existing = groupActiveCalls.value.get(groupId)
    if (!existing || existing.room !== room) {
      return
    }
    const joined = existing.joinedUserIds ?? []
    const invitee = existing.inviteeIds ?? []
    const nextJoined = joined.filter((id) => id !== userId)
    const nextInvitee = invitee.filter((id) => id !== userId)
    if (nextJoined.length === joined.length && nextInvitee.length === invitee.length) {
      return
    }
    if (nextJoined.length === 0 && nextInvitee.length === 0) {
      removeGroupCall(groupId, room)
      return
    }
    setGroupCall({
      ...existing,
      joinedUserIds: nextJoined,
      inviteeIds: nextInvitee
    })
  }

  return {
    stage,
    call,
    incomingPayload,
    peerNickname,
    peerAvatar,
    startedAt,
    isActive,
    startInviting,
    showIncoming,
    enterRunning,
    reset,
    appendInvitees,
    markUserLeft,
    isUserLeft,
    setGroupCall,
    removeGroupCall,
    getGroupCall,
    isGroupCallParticipantsLoaded,
    clearGroupCallCache,
    applyParticipantConnected,
    applyParticipantDisconnected,
    applyParticipantRejected,
    applyParticipantNoAnswer
  }
})
