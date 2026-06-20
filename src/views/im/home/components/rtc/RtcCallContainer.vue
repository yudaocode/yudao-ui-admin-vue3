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
import { computed, ref, watch } from 'vue'
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
import { Track } from 'livekit-client'
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
const connecting = ref(false)
const accepting = ref(false)
const rejecting = ref(false)
const cancelling = ref(false)
const hangingUp = ref(false)

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
    const userId = Number(rp.identity)
    if (Number.isNaN(userId)) {
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
async function connectLiveKit(livekitUrl: string, token: string) {
  // 幂等：lk.connect 内部进入后就把 room.value 赋值；非空表示已经在连接或已连接；stage 多次切换时重复触发也跳过
  if (lk.room.value || connecting.value) {
    return
  }
  connecting.value = true
  try {
    // 先注册回调，再 connect；信令握手过程会即时推送已在房参与者，业务 handler 必须先就绪
    lk.onDisconnected(() => handlePeerDisconnected())
    lk.onParticipantConnected(maybeEnterRunning)
    lk.onParticipantDisconnected((userId) => rtcStore.markUserLeft(userId))
    await lk.connect(livekitUrl, token, { audio: true, video: initialCamera.value })
    // 兜底：connect 期间若已有远端在房，事件可能在 handler 注册前已触发，主动切到 RUNNING
    if (lk.remoteParticipants.value.length > 0) {
      maybeEnterRunning()
    }
  } finally {
    connecting.value = false
  }
}

/** 主叫端：从 INVITING 切到 RUNNING；其它阶段不处理 */
function maybeEnterRunning() {
  if (rtcStore.stage === ImRtcCallStage.INVITING && rtcStore.call) {
    rtcStore.enterRunning(rtcStore.call)
  }
}

watch(
  () => rtcStore.stage,
  async (stage) => {
    if (stage === ImRtcCallStage.INVITING && rtcStore.call?.token && rtcStore.call?.livekitUrl) {
      try {
        await connectLiveKit(rtcStore.call.livekitUrl, rtcStore.call.token)
      } catch (e) {
        console.error('[Call] connect 失败', { room: rtcStore.call?.room }, e)
        message.error('通话连接失败')
        await handleCancel()
      }
    }
    if (stage === ImRtcCallStage.IDLE) {
      await lk.disconnect()
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
      try {
        await connectLiveKit(rtcStore.call.livekitUrl, token as string)
      } catch (e) {
        console.error('[Call] accept connect 失败', { room: rtcStore.call?.room }, e)
        message.error('通话连接失败')
        // 后端 accept 已写 JOINED；前端连接失败需调 leave 回滚，避免后端记录残留忙线
        if (rtcStore.call?.room) {
          leaveCall(rtcStore.call.room).catch(() => undefined)
        }
        rtcStore.reset()
      }
    }
  }
)

// ==================== 通话生命周期 ====================

/** 主叫取消邀请 */
async function handleCancel() {
  if (cancelling.value) {
    return
  }
  cancelling.value = true
  const room = rtcStore.call?.room
  try {
    if (room) {
      await cancelCall(room)
    }
    await lk.disconnect()
    rtcStore.reset()
  } finally {
    cancelling.value = false
  }
}

/** 被叫拒绝来电 */
async function handleReject() {
  if (rejecting.value) {
    return
  }
  rejecting.value = true
  const payload = rtcStore.incomingPayload
  try {
    if (payload?.room) {
      await rejectCall(payload.room)
      // 本端先行从胶囊条移除自己，免等后端 RTC_CALL(REJECTED) 推回；私聊场景 store 内部 no-op
      rtcStore.applyParticipantRejected({
        room: payload.room,
        conversationType: payload.conversationType,
        groupId: payload.groupId,
        operatorUserId: getCurrentUserId()
      })
    }
    rtcStore.reset()
  } finally {
    rejecting.value = false
  }
}

/** 被叫接听来电 */
async function handleAccept() {
  if (accepting.value) {
    return
  }
  const payload = rtcStore.incomingPayload
  if (!payload) return
  accepting.value = true
  try {
    const data = await acceptCall(payload.room)
    rtcStore.enterRunning(data)
  } finally {
    accepting.value = false
  }
}

/** 通话中挂断 */
async function handleHangup() {
  if (hangingUp.value) {
    return
  }
  hangingUp.value = true
  const call = rtcStore.call
  try {
    if (call?.room) {
      await leaveCall(call.room)
      // 本端先行从胶囊条移除自己，免等后端 RTC_PARTICIPANT_DISCONNECTED 推回；私聊场景 store 内部 no-op，整通话由 END 关掉
      rtcStore.applyParticipantDisconnected({
        room: call.room,
        userId: getCurrentUserId(),
        conversationType: call.conversationType,
        groupId: call.groupId
      })
    }
    await lk.disconnect()
    rtcStore.reset()
  } finally {
    hangingUp.value = false
  }
}

/** LiveKit Room 异常断开；多见于网络中断 */
function handlePeerDisconnected() {
  if (!rtcStore.isActive) {
    return
  }
  const room = rtcStore.call?.room
  // 给 RTC_CALL_END WebSocket 推送一个小窗口；私聊超时 / 主动挂断等场景下，后端 endSession 会先推 RTC_CALL_END，
  // 让前端按业务语义（"对方未接听" / "已取消" 等）reset，避免错把业务断开 toast 成「通话已断开」
  setTimeout(() => {
    if (!rtcStore.isActive) {
      return
    }
    // 上报离开房间
    if (room) {
      leaveCall(room).catch(() => undefined)
    }
    // 清理本地通话状态
    message.warning('通话已断开')
    rtcStore.reset()
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
  await inviteCall({ room: call.room, inviteeIds: userIds })
  // 同步本地 inviteeIds，让新成员立即作为 pending 占位出现在网格里
  rtcStore.appendInvitees(userIds)
  message.success('已发送邀请')
}
</script>
