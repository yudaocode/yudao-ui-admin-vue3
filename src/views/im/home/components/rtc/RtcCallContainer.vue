<template>
  <!-- 通话阶段对应弹窗；INVITING / INCOMING / RUNNING 三选一互斥 -->
  <template v-if="rtcStore.isActive">
    <!-- 主叫端：等待对方接听 -->
    <RtcCallInviting
      v-if="rtcStore.stage === ImRtcCallStage.INVITING && rtcStore.call"
      :peer-nickname="rtcStore.peerNickname"
      :peer-avatar="rtcStore.peerAvatar"
      :is-group="isGroup"
      :is-video="isVideo"
      :mic-enabled="lk.micEnabled.value"
      :camera-enabled="lk.cameraEnabled.value"
      :speaker-enabled="lk.speakerEnabled.value"
      :local-stream="localStream"
      @cancel="handleCancel"
      @toggle-mic="toggleMic"
      @toggle-camera="toggleCamera"
      @toggle-speaker="toggleSpeaker"
    />
    <!-- 被叫端：来电响铃 -->
    <RtcCallIncoming
      v-else-if="rtcStore.stage === ImRtcCallStage.INCOMING"
      :payload="rtcStore.incomingPayload"
      :is-group="isGroup"
      :accepting="accepting"
      :rejecting="rejecting"
      @accept="handleAccept"
      @reject="handleReject"
    />
    <!-- 通话进行中：1v1 视频 / 语音 + 群通话宫格 -->
    <RtcCallRunning
      v-else-if="rtcStore.stage === ImRtcCallStage.RUNNING && rtcStore.call"
      :is-group="isGroup"
      :is-video="isVideo"
      :mic-enabled="lk.micEnabled.value"
      :camera-enabled="lk.cameraEnabled.value"
      :speaker-enabled="lk.speakerEnabled.value"
      :screen-share-enabled="lk.screenShareEnabled.value"
      :reconnecting="lk.reconnecting.value"
      :started-at="rtcStore.startedAt"
      :participants="participants"
      :peer-nickname="rtcStore.peerNickname"
      :peer-avatar="rtcStore.peerAvatar"
      :local-stream="localStream"
      :remote-video-stream="remoteVideoStream"
      :remote-audio-stream="remoteAudioStream"
      :hanging-up="hangingUp"
      @hangup="handleHangup"
      @toggle-mic="toggleMic"
      @toggle-camera="toggleCamera"
      @toggle-speaker="toggleSpeaker"
      @toggle-screen-share="handleScreenShare"
      @add-member="openAddMember"
    />
  </template>
  <!-- 通话中「添加成员」选人弹窗；挂在 isActive 外，避免 stage 切换瞬间弹窗被卸载 -->
  <RtcCallMemberPickerDialog ref="memberPickerRef" @success="handleAddMemberSuccess" />
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import { computed, onBeforeUnmount, ref, shallowRef, watch, type ShallowRef } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useMessage } from '@/hooks/web/useMessage'
import { useRtcStore } from '../../store/rtcStore'
import { useLiveKitRoom } from '../../composables/useLiveKitRoom'
import {
  cancelCall,
  rejectCall,
  acceptCall,
  leaveCall,
  inviteCall,
  noAnswerCallCheck
} from '@/api/im/rtc'
import { ImRtcCallMediaType, ImRtcCallStage, ImConversationType } from '@/views/im/utils/constants'
import { RTC_NO_ANSWER_CALL_CHECK_INTERVAL_MS } from '@/views/im/utils/config'
import { getCurrentUserId } from '@/utils/auth'
import { getSenderAvatar, getSenderDisplayName } from '@/views/im/utils/user'
import { Track, type Room } from 'livekit-client'
import RtcCallInviting from './RtcCallInviting.vue'
import RtcCallIncoming from './RtcCallIncoming.vue'
import RtcCallRunning from './RtcCallRunning.vue'
import RtcCallMemberPickerDialog from './RtcCallMemberPickerDialog.vue'
import type { CallParticipantVM } from './RtcCallParticipantTile.vue'

defineOptions({ name: 'ImRtcCallContainer' })

const rtcStore = useRtcStore()
const message = useMessage()
const lk = useLiveKitRoom()

const memberPickerRef = ref<InstanceType<typeof RtcCallMemberPickerDialog>>()
let connectingRoom = '' // 正在连接的业务 room
let liveKitRoom = '' // 当前 LiveKit Room 对应的业务 room

interface RtcActionOwner {
  userId: number
  room: string
  liveKitRoom: Room | null
}

interface RtcActionTicket {
  owner: RtcActionOwner
  task: Promise<void>
}

const acceptingAction = shallowRef<RtcActionTicket>()
const rejectingAction = shallowRef<RtcActionTicket>()
const cancellingAction = shallowRef<RtcActionTicket>()
const hangingUpAction = shallowRef<RtcActionTicket>()
let rtcListenerOwner: RtcActionOwner | undefined
let rtcListenerCleanups: Array<() => void> = []

/** 当前 Store 中的业务 room */
function getCurrentRtcRoom(): string {
  return rtcStore.call?.room || rtcStore.incomingPayload?.room || ''
}

/** 捕获一次 RTC 异步操作的业务 room 和物理 Room */
function captureRtcOwner(room = getCurrentRtcRoom()): RtcActionOwner | undefined {
  if (!room) {
    return
  }
  return {
    userId: getCurrentUserId(),
    room,
    liveKitRoom: lk.room.value
  }
}

/** 判断捕获的 RTC owner 是否仍拥有当前通话 */
function isRtcOwnerActive(owner: RtcActionOwner): boolean {
  return getCurrentUserId() === owner.userId && getCurrentRtcRoom() === owner.room
}

/** 判断两个异步动作是否属于同一次通话 */
function isSameRtcOwner(left: RtcActionOwner, right: RtcActionOwner): boolean {
  return (
    left.userId === right.userId &&
    left.room === right.room &&
    left.liveKitRoom === right.liveKitRoom
  )
}

/** 只清理指定 owner 注册的 LiveKit 业务回调 */
function clearRtcListeners(owner?: RtcActionOwner): void {
  if (owner && rtcListenerOwner && !isSameRtcOwner(rtcListenerOwner, owner)) {
    return
  }
  rtcListenerCleanups.forEach((cleanup) => cleanup())
  rtcListenerCleanups = []
  rtcListenerOwner = undefined
}

/** 为当前 owner 注册独立回调；新通话会先淘汰旧 owner 回调 */
function installRtcListeners(owner: RtcActionOwner): void {
  clearRtcListeners()
  rtcListenerOwner = owner
  rtcListenerCleanups = [
    lk.onDisconnected(() => handlePeerDisconnected(owner)),
    lk.onParticipantConnected(() => maybeEnterRunning(owner)),
    lk.onParticipantDisconnected((userId) => {
      if (isRtcOwnerActive(owner)) {
        rtcStore.markUserLeft(userId)
      }
    })
  ]
}

/** 同一通话的动作复用任务；旧通话任务不得阻塞或清理新通话动作 */
function runRtcAction(
  action: ShallowRef<RtcActionTicket | undefined>,
  owner: RtcActionOwner,
  execute: () => Promise<void>
): Promise<void> {
  const current = action.value
  if (current && isSameRtcOwner(current.owner, owner)) {
    return current.task
  }
  const task = execute().finally(() => {
    if (action.value?.task === task) {
      action.value = undefined
    }
  })
  action.value = { owner, task }
  return task
}

/** 仅当前通话显示动作加载状态 */
function isCurrentRtcActionPending(action: RtcActionTicket | undefined): boolean {
  return Boolean(action && isRtcOwnerActive(action.owner))
}

const accepting = computed(() => isCurrentRtcActionPending(acceptingAction.value))
const rejecting = computed(() => isCurrentRtcActionPending(rejectingAction.value))
const hangingUp = computed(() => isCurrentRtcActionPending(hangingUpAction.value))

/** 只释放 owner 捕获的 Room；捕获前尚未建 Room 时仅允许清理仍属于它的当前 Room */
async function disconnectRtcOwner(owner: RtcActionOwner): Promise<void> {
  clearRtcListeners(owner)
  try {
    if (owner.liveKitRoom) {
      await lk.disconnectCaptured(owner.liveKitRoom)
    } else if (isRtcOwnerActive(owner)) {
      const currentRoom = lk.room.value
      if (currentRoom) {
        await lk.disconnectCaptured(currentRoom)
      } else {
        await lk.disconnect()
      }
    }
  } finally {
    if (liveKitRoom === owner.room && !lk.room.value) {
      liveKitRoom = ''
    }
  }
}

/** 仅当前 owner 仍匹配时重置业务 Store */
function resetRtcOwner(owner: RtcActionOwner): void {
  if (isRtcOwnerActive(owner)) {
    rtcStore.reset()
  }
}

/** 物理断开失败不阻塞业务状态复位 */
async function cleanupRtcOwner(owner: RtcActionOwner): Promise<void> {
  try {
    await disconnectRtcOwner(owner)
  } catch (error) {
    console.warn('[Call] LiveKit 断开失败', { room: owner.room }, error)
  } finally {
    resetRtcOwner(owner)
  }
}

// ==================== 视图模型 ====================

/** 当前是否视频通话 */
const isVideo = computed(() => {
  const t =
    rtcStore.call?.mediaType || rtcStore.incomingPayload?.mediaType || ImRtcCallMediaType.VOICE
  return t === ImRtcCallMediaType.VIDEO
})

/** 当前是否群通话；决定浮动窗大小 */
const isGroup = computed(
  () =>
    (rtcStore.call?.conversationType ?? rtcStore.incomingPayload?.conversationType) ===
    ImConversationType.GROUP
)

/** 初始摄像头是否打开；群通话默认全部关闭，进入后用户主动开 */
const initialCamera = computed(() => {
  if (rtcStore.call?.conversationType === ImConversationType.GROUP) {
    return false
  }
  return isVideo.value
})

/** 本端视频流；优先 ScreenShare（屏共时也铺底），无则 Camera；显式订阅 screenShareEnabled / cameraEnabled 触发重算 */
const localStream = computed<MediaStream | null>(() => {
  // 触摸响应式依赖，确保切屏共享 / 摄像头后 computed 重新求值（pickStream 内部用普通 Map 缓存，自身不响应）
  void lk.screenShareEnabled.value
  void lk.cameraEnabled.value
  const lp = lk.localParticipant.value
  if (!lp) {
    return null
  }
  return lk.pickStream(lp, Track.Source.ScreenShare) || lk.pickStream(lp, Track.Source.Camera)
})

/** 远端视频流（仅 1v1 用）；优先 ScreenShare，无则取 Camera */
const remoteVideoStream = computed<MediaStream | null>(() => {
  if (isGroup.value) {
    return null
  }
  for (const rp of lk.remoteParticipants.value) {
    const screen = lk.pickStream(rp, Track.Source.ScreenShare)
    if (screen) {
      return screen
    }
    const camera = lk.pickStream(rp, Track.Source.Camera)
    if (camera) {
      return camera
    }
  }
  return null
})

/** 远端音频流（仅 1v1 用） */
const remoteAudioStream = computed<MediaStream | null>(() => {
  if (isGroup.value) {
    return null
  }
  for (const rp of lk.remoteParticipants.value) {
    const stream = lk.pickStream(rp, Track.Source.Microphone)
    if (stream) {
      return stream
    }
  }
  return null
})

/** 群通话网格用：自己 + 远端在房 + 待加入成员；昵称 / 头像走 user.ts helper 自动处理 self / 群成员 / 好友 / 兜底 */
const participants = computed<CallParticipantVM[]>(() => {
  const call = rtcStore.call
  if (!call) {
    return []
  }
  const conversationType = call.conversationType
  const targetId = call.groupId ?? 0
  const myId = getCurrentUserId()
  const result: CallParticipantVM[] = []

  // 自己
  result.push({
    userId: myId,
    nickname: getSenderDisplayName(myId, conversationType, targetId),
    avatar: getSenderAvatar(myId, conversationType, targetId) || undefined,
    isLocal: true,
    videoStream: localStream.value
  })

  // 已加入的远端：实际推流；屏幕共享在网格里独占该成员的格子，无则降级 Camera
  const joined = new Set<number>()
  for (const rp of lk.remoteParticipants.value) {
    const userId = parseId(rp.identity)
    if (userId === undefined) {
      continue
    }
    joined.add(userId)
    result.push({
      userId,
      nickname: getSenderDisplayName(userId, conversationType, targetId),
      avatar: getSenderAvatar(userId, conversationType, targetId) || undefined,
      isLocal: false,
      videoStream:
        lk.pickStream(rp, Track.Source.ScreenShare) || lk.pickStream(rp, Track.Source.Camera),
      audioStream: lk.pickStream(rp, Track.Source.Microphone)
    })
  }

  // 群通话：未加入的被邀请人作为 pending 占位；已退出 / 已拒绝的人不渲染
  if (conversationType === ImConversationType.GROUP) {
    const inviteeIds = call.inviteeIds || []
    for (const userId of inviteeIds) {
      if (userId === myId || joined.has(userId) || rtcStore.isUserLeft(userId)) {
        continue
      }
      result.push({
        userId,
        nickname: getSenderDisplayName(userId, ImConversationType.GROUP, targetId),
        avatar: getSenderAvatar(userId, ImConversationType.GROUP, targetId) || undefined,
        isLocal: false,
        pending: true
      })
    }
  }
  return result
})

// ==================== LiveKit 连接 ====================

/** 连入 LiveKit 房间并注册离开回调；INVITING 主叫预连和被叫 accept 后连入共用 */
async function connectLiveKit(room: string, livekitUrl: string, token: string) {
  const owner = captureRtcOwner(room)
  if (!owner || connectingRoom === room || (lk.room.value && liveKitRoom === room)) {
    return
  }
  connectingRoom = room
  let connected = false
  try {
    // 先注册回调，再 connect；信令握手过程会即时推送已在房参与者，业务 handler 必须先就绪
    installRtcListeners(owner)
    const connectedRoom = await lk.connect(livekitUrl, token, {
      audio: true,
      video: initialCamera.value
    })
    if (!connectedRoom) {
      return
    }
    if (!isRtcOwnerActive(owner)) {
      await lk.disconnectCaptured(connectedRoom)
      return
    }
    liveKitRoom = room
    connected = true
    // 兜底：connect 期间若已有远端在房，事件可能在 handler 注册前已触发，主动切到 RUNNING
    if (lk.remoteParticipants.value.length > 0) {
      maybeEnterRunning(owner)
    }
  } finally {
    if (!connected) {
      clearRtcListeners(owner)
    }
    if (connectingRoom === room) {
      connectingRoom = ''
    }
  }
}

/** 主叫端：从 INVITING 切到 RUNNING；其它阶段不处理 */
function maybeEnterRunning(owner: RtcActionOwner) {
  if (isRtcOwnerActive(owner) && rtcStore.stage === ImRtcCallStage.INVITING && rtcStore.call) {
    rtcStore.enterRunning(rtcStore.call)
  }
}

watch(
  () => rtcStore.stage,
  async (stage) => {
    const call = rtcStore.call
    if (stage === ImRtcCallStage.INVITING && call?.token && call.livekitUrl) {
      const token = call.token
      const livekitUrl = call.livekitUrl
      const owner = captureRtcOwner(call.room)
      if (!owner) {
        return
      }
      try {
        await connectLiveKit(call.room, livekitUrl, token)
      } catch (e) {
        if (isRtcOwnerActive(owner)) {
          console.error('[Call] connect 失败', { room: owner.room }, e)
          message.error('通话连接失败')
        }
        await handleCancel(owner)
      }
    }
    if (stage === ImRtcCallStage.IDLE) {
      const disconnectedRoom = lk.room.value
      const disconnectedRoomId = liveKitRoom
      clearRtcListeners()
      try {
        if (disconnectedRoom) {
          await lk.disconnectCaptured(disconnectedRoom)
        } else {
          await lk.disconnect()
        }
      } catch (error) {
        console.warn('[Call] LiveKit 空闲清理失败', error)
      } finally {
        if (liveKitRoom === disconnectedRoomId) {
          liveKitRoom = ''
        }
      }
    }
  }
)

/** 被叫端 accept 后会拿到 token；这里监听 stage + token 变化触发连接 */
watch(
  () => [rtcStore.stage, rtcStore.call?.token],
  async ([stage, token], [prevStage]) => {
    if (
      stage === ImRtcCallStage.RUNNING &&
      prevStage !== ImRtcCallStage.RUNNING &&
      token &&
      !lk.isConnected.value &&
      rtcStore.call?.livekitUrl
    ) {
      const call = rtcStore.call
      const owner = captureRtcOwner(call.room)
      if (!owner) {
        return
      }
      try {
        await connectLiveKit(call.room, call.livekitUrl, token as string)
      } catch (e) {
        if (isRtcOwnerActive(owner)) {
          console.error('[Call] accept connect 失败', { room: owner.room }, e)
          message.error('通话连接失败')
        }
        // 后端 accept 已写 JOINED；前端连接失败需调 leave 回滚，避免后端记录残留忙线
        if (getCurrentUserId() === owner.userId) {
          await leaveCall(owner.room).catch(() => undefined)
        }
        await cleanupRtcOwner(owner)
      }
    }
  }
)

// ==================== 通话生命周期 ====================

/** 主叫取消邀请 */
async function handleCancel(capturedOwner?: RtcActionOwner) {
  const owner = capturedOwner || captureRtcOwner()
  if (!owner) {
    return
  }
  await runRtcAction(cancellingAction, owner, async () => {
    try {
      await cancelCall(owner.room)
    } finally {
      await cleanupRtcOwner(owner)
    }
  })
}

/** 被叫拒绝来电 */
async function handleReject() {
  const owner = captureRtcOwner()
  if (!owner) {
    return
  }
  const payload = rtcStore.incomingPayload
  await runRtcAction(rejectingAction, owner, async () => {
    try {
      if (payload?.room === owner.room) {
        await rejectCall(owner.room)
        // 本端先行从胶囊条移除自己，免等后端 RTC_CALL(REJECTED) 推回；私聊场景 store 内部 no-op
        if (isRtcOwnerActive(owner)) {
          rtcStore.applyParticipantRejected({
            room: owner.room,
            conversationType: payload.conversationType,
            groupId: payload.groupId,
            operatorUserId: getCurrentUserId()
          })
        }
      }
    } finally {
      await cleanupRtcOwner(owner)
    }
  })
}

/** 被叫接听来电 */
async function handleAccept() {
  const payload = rtcStore.incomingPayload
  if (!payload) return
  const owner = captureRtcOwner(payload.room)
  if (!owner) {
    return
  }
  await runRtcAction(acceptingAction, owner, async () => {
    const data = await acceptCall(payload.room)
    if (
      !isRtcOwnerActive(owner) ||
      rtcStore.stage !== ImRtcCallStage.INCOMING ||
      rtcStore.incomingPayload?.room !== payload.room
    ) {
      if (getCurrentUserId() === owner.userId) {
        await leaveCall(data.room || payload.room).catch(() => undefined)
      }
      return
    }
    rtcStore.enterRunning(data)
  })
}

/** 通话中挂断 */
async function handleHangup() {
  const owner = captureRtcOwner()
  if (!owner) {
    return
  }
  const call = rtcStore.call
  await runRtcAction(hangingUpAction, owner, async () => {
    try {
      if (call?.room === owner.room) {
        await leaveCall(owner.room)
        // 本端先行从胶囊条移除自己，免等后端 RTC_PARTICIPANT_DISCONNECTED 推回；私聊场景 store 内部 no-op，整通话由 END 关掉
        if (isRtcOwnerActive(owner)) {
          rtcStore.applyParticipantDisconnected({
            room: owner.room,
            userId: getCurrentUserId(),
            conversationType: call.conversationType,
            groupId: call.groupId
          })
        }
      }
    } finally {
      await cleanupRtcOwner(owner)
    }
  })
}

/** LiveKit Room 异常断开；多见于网络中断 */
function handlePeerDisconnected(owner: RtcActionOwner) {
  if (!isRtcOwnerActive(owner)) {
    return
  }
  // 给 RTC_CALL_END WebSocket 推送一个小窗口；私聊超时 / 主动挂断等场景下，后端 endSession 会先推 RTC_CALL_END，
  // 让前端按业务语义（"对方未接听" / "已取消" 等）reset，避免错把业务断开 toast 成「通话已断开」
  setTimeout(() => {
    if (!isRtcOwnerActive(owner)) {
      return
    }
    // 上报离开房间
    leaveCall(owner.room).catch(() => undefined)
    // 清理本地通话状态
    message.warning('通话已断开')
    resetRtcOwner(owner)
  }, 100)
}

// ==================== 振铃超时兜底 ====================

/** 通话存活期间（INVITING / INCOMING / RUNNING）周期性触发后端扫该 room 的超时 INVITING；保持 timer 是为了 inviteCall 追加新人后也能覆盖；阈值由后端配置决定，前端只负责 trigger */
const { resume: resumeNoAnswerTimer, pause: pauseNoAnswerTimer } = useIntervalFn(
  triggerNoAnswerCallCheck,
  RTC_NO_ANSWER_CALL_CHECK_INTERVAL_MS,
  { immediate: false }
)
watch(
  () => rtcStore.isActive,
  (active) => (active ? resumeNoAnswerTimer() : pauseNoAnswerTimer()),
  { immediate: true }
)

/** IM 主壳卸载时幂等释放 Room、媒体轨道、listener 与计时器 */
onBeforeUnmount(() => {
  pauseNoAnswerTimer()
  const owner = captureRtcOwner()
  if (owner) {
    if (rtcStore.stage === ImRtcCallStage.INVITING) {
      void cancelCall(owner.room).catch(() => undefined)
    } else if (rtcStore.stage === ImRtcCallStage.INCOMING) {
      void rejectCall(owner.room).catch(() => undefined)
    } else if (rtcStore.stage === ImRtcCallStage.RUNNING) {
      void leaveCall(owner.room).catch(() => undefined)
    }
  }
  clearRtcListeners()
  const capturedRoom = lk.room.value
  if (capturedRoom) {
    void lk
      .disconnectCaptured(capturedRoom)
      .catch((error) => console.warn('[Call] 卸载时 LiveKit 断开失败', error))
  } else {
    void lk.disconnect().catch((error) => console.warn('[Call] 卸载时 LiveKit 清理失败', error))
  }
  rtcStore.reset()
})

/** 本地仍有 pending 才调；INVITING / RUNNING 取 call、INCOMING 取 incomingPayload；接口静默错误 fire-and-forget */
function triggerNoAnswerCallCheck() {
  const source = rtcStore.call ?? rtcStore.incomingPayload
  if (!source?.room || !source.inviteeIds?.length) {
    return
  }
  noAnswerCallCheck(source.room).catch(() => undefined)
}

// ==================== 设备控制 ====================

async function toggleMic() {
  await lk.setMicEnabled(!lk.micEnabled.value)
}
async function toggleCamera() {
  await lk.setCameraEnabled(!lk.cameraEnabled.value)
}
function toggleSpeaker() {
  lk.setSpeakerEnabled(!lk.speakerEnabled.value)
}

/** 切屏幕共享；浏览器弹原生「选择共享内容」对话框，用户取消时会抛错，UI 不弹提示 */
async function handleScreenShare() {
  const enabled = !lk.screenShareEnabled.value
  try {
    await lk.setScreenShareEnabled(enabled)
  } catch (e: any) {
    // 用户取消选择，不当作错误；其它异常打日志
    if (e?.name !== 'NotAllowedError' && e?.message !== 'permission denied') {
      console.warn('[Call] screenShare 切换失败', { enabled }, e)
    }
  }
}

// ==================== 添加成员 ====================

/** 打开「添加成员」弹窗；占位群通话 + 接通中状态才允许 */
function openAddMember() {
  const call = rtcStore.call
  if (!call?.groupId) {
    return
  }
  memberPickerRef.value?.open({
    groupId: call.groupId,
    mode: 'add',
    excludeUserIds: participants.value.map((p) => p.userId)
  })
}

/** picker 选完成员；走 invite 追加邀请接口，后端推 RTC_INVITE 给新成员 */
async function handleAddMemberSuccess(userIds: number[]) {
  const call = rtcStore.call
  if (!call?.room || userIds.length === 0) {
    return
  }
  const owner = captureRtcOwner(call.room)
  if (!owner) {
    return
  }
  await inviteCall({ room: call.room, inviteeIds: userIds })
  if (!isRtcOwnerActive(owner)) {
    return
  }
  // 同步本地 inviteeIds，让新成员立即作为 pending 占位出现在网格里
  rtcStore.appendInvitees(userIds)
  message.success('已发送邀请')
}
</script>
