import { parseId } from '@/utils/id'
import { computed, ref, shallowRef } from 'vue'
import {
  Room,
  RoomEvent,
  Track,
  VideoPresets,
  type LocalParticipant,
  type Participant,
  type RemoteParticipant
} from 'livekit-client'

type ParticipantEventHandler = (userId: number) => void

const roomDisconnectTasks = new WeakMap<Room, Promise<void>>()

/** 同一个物理 Room 只执行一次 listener 清理与断开 */
function disconnectPhysicalRoom(target: Room): Promise<void> {
  const current = roomDisconnectTasks.get(target)
  if (current) {
    return current
  }
  const task = Promise.resolve().then(async () => {
    target.removeAllListeners()
    await target.disconnect()
  })
  roomDisconnectTasks.set(target, task)
  return task
}

/** LiveKit Room 连接 / 设备 / 事件的薄封装；UI 组件只关心响应式状态 */
export function useLiveKitRoom() {
  /** Room 实例；模块内部状态，不对外暴露，避免调用方误写 */
  const _room = shallowRef<Room | null>(null)
  /** 只读 room 引用；调用方仅用于幂等判定 */
  const room = computed(() => _room.value)
  /** 本地参与者；连接成功后赋值 */
  const localParticipant = shallowRef<LocalParticipant | null>(null)
  /** 远端参与者列表；ParticipantConnected / Disconnected 时刷新；shallowRef 避免 Vue 深度代理 SDK class 内部 */
  const remoteParticipants = shallowRef<RemoteParticipant[]>([])
  /** 连接状态 */
  const isConnected = ref(false)
  /** 麦克风开关 */
  const micEnabled = ref(true)
  /** 摄像头开关 */
  const cameraEnabled = ref(false)
  /** 扬声器开关；浏览器无系统级 API，通过 audio 元素 muted 属性实现远端音频静音 */
  const speakerEnabled = ref(true)
  /** 屏幕共享开关 */
  const screenShareEnabled = ref(false)
  /** 当前是否处于「重连中」；瞬断时 UI 显示提示而不强制结束通话 */
  const reconnecting = ref(false)
  /** 远端断开订阅者；通话结束时统一清空 */
  const disconnectedHandlers = new Set<() => void>()
  /** 房内某人加入订阅者；主叫端用于从 INVITING 切到 RUNNING */
  const participantConnectedHandlers = new Set<ParticipantEventHandler>()
  /** 房内某人离开订阅者；用于把 userId 标记为「已退出」从 pending 占位中移除 */
  const participantDisconnectedHandlers = new Set<ParticipantEventHandler>()
  let connectionOwner = {} // 连接 owner 用于阻断旧 connect/callback 修改新 Room 状态

  /** 同步远端参与者列表到响应式数组 */
  function syncRemotes(r: Room) {
    remoteParticipants.value = Array.from(r.remoteParticipants.values())
  }

  /** 连接 LiveKit Server；audio / video 控制初始默认开关 */
  async function connect(url: string, token: string, opts: { audio?: boolean; video?: boolean }) {
    const owner = {}
    connectionOwner = owner
    // 新连接前先断开旧 Room；保留本次注册的事件回调
    if (_room.value) {
      await disconnectRoom(false, false)
    }
    if (connectionOwner !== owner) {
      return null
    }
    const r = new Room({
      // 按格子尺寸自动选 simulcast 层
      adaptiveStream: true,
      // 未订阅的层动态停发，节省上行
      dynacast: true,
      // 采集分辨率 720p，确保大格子清晰
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution
      },
      // 发布编码上限 1.5 Mbps / 30fps；保留默认 simulcast 三层（180p / 360p / 720p）
      publishDefaults: {
        videoEncoding: {
          maxBitrate: 1_500_000,
          maxFramerate: 30,
          priority: 'high'
        },
        // 屏幕共享码率 3 Mbps，文字界面清晰
        screenShareEncoding: {
          maxBitrate: 3_000_000,
          maxFramerate: 15,
          priority: 'medium'
        }
      }
    })
    _room.value = r
    const isCurrentRoom = () => _room.value === r && connectionOwner === owner

    r.on(RoomEvent.ParticipantConnected, (rp) => {
      if (!isCurrentRoom()) return
      syncRemotes(r)
      const userId = parseUserId(rp.identity)
      if (userId != null) {
        participantConnectedHandlers.forEach((cb) => cb(userId))
      }
    })
      .on(RoomEvent.ParticipantDisconnected, (rp) => {
        if (!isCurrentRoom()) return
        syncRemotes(r)
        // 离开的参与者缓存清掉，避免下次同 sid 重连命中失效引用
        for (const key of Array.from(streamCache.keys())) {
          if (key.startsWith(`${rp.sid}:`)) {
            streamCache.delete(key)
          }
        }
        const userId = parseUserId(rp.identity)
        if (userId != null) {
          participantDisconnectedHandlers.forEach((cb) => cb(userId))
        }
      })
      .on(RoomEvent.TrackSubscribed, () => isCurrentRoom() && syncRemotes(r))
      .on(RoomEvent.TrackUnsubscribed, () => isCurrentRoom() && syncRemotes(r))
      // mute / unmute 让 pickStream 的 isMuted 短路重算，video 元素能解绑 srcObject 而不是卡最后一帧
      .on(RoomEvent.TrackMuted, () => isCurrentRoom() && syncRemotes(r))
      .on(RoomEvent.TrackUnmuted, () => isCurrentRoom() && syncRemotes(r))
      // 瞬断 → 显示「重连中」；不关通话窗，由 SDK 内部重连机制恢复
      .on(RoomEvent.Reconnecting, () => {
        if (!isCurrentRoom()) return
        reconnecting.value = true
      })
      .on(RoomEvent.Reconnected, () => {
        if (!isCurrentRoom()) return
        reconnecting.value = false
      })
      // 重连失败 / 主动断 / 被踢时触发清理
      .on(RoomEvent.Disconnected, () => {
        if (!isCurrentRoom()) return
        isConnected.value = false
        reconnecting.value = false
        disconnectedHandlers.forEach((cb) => cb())
      })

    // 预热 getUserMedia 与 WebSocket 握手并行，省 100～300ms 串行延迟；
    // 拿到的 stream 仅用于触发权限弹窗 + 设备就绪，握手完成后由 LiveKit 内部重新请求设备发布轨
    const warmup = prewarmMedia(opts)
    // 建立 WebSocket 信令 + WebRTC 媒体通道；完成后 localParticipant 可用，已在房参与者会通过 ParticipantConnected 事件批量推送
    await r.connect(url, token)
    // 期间被外部 disconnect 替换；中止后续 publish，避免摄像头被重新启用
    if (!isCurrentRoom()) {
      return null
    }
    localParticipant.value = r.localParticipant
    isConnected.value = true

    // 预热结果不直接发布（避免 SDK 与外部 track 生命周期纠缠），仅等待权限就绪后再走标准 setXxxEnabled
    await warmup
    if (!isCurrentRoom()) {
      return null
    }
    // 麦克风与摄像头权限相互独立，并行启用发布
    const inits: Promise<unknown>[] = []
    if (opts.audio) {
      inits.push(r.localParticipant.setMicrophoneEnabled(true))
    }
    if (opts.video) {
      inits.push(r.localParticipant.setCameraEnabled(true))
    }
    if (inits.length > 0) {
      await Promise.all(inits)
    }
    if (!isCurrentRoom()) {
      return null
    }
    micEnabled.value = !!opts.audio
    cameraEnabled.value = !!opts.video

    // 兜底同步一次远端列表：r.connect 期间 ParticipantConnected 事件可能在 handler 绑定前触发被吞，导致首屏漏人
    syncRemotes(r)
    return r
  }

  /** 提前触发权限弹窗 + 设备唤起，串行延迟在 r.connect 期间一起跑；失败静默（连接后会再试一次） */
  async function prewarmMedia(opts: { audio?: boolean; video?: boolean }): Promise<void> {
    if (!opts.audio && !opts.video) {
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: !!opts.audio,
        video: !!opts.video
      })
      // 拿到权限即可，立即停掉所有 track 释放设备；正式发布走 SDK 流程重新请求
      stream.getTracks().forEach((t) => t.stop())
    } catch {
      // 用户拒绝 / 设备占用等异常，交给后续 setXxxEnabled 再次尝试报错
    }
  }

  /** 切麦克风 */
  async function setMicEnabled(enabled: boolean) {
    const r = _room.value
    if (!r) {
      return
    }
    await r.localParticipant.setMicrophoneEnabled(enabled)
    if (_room.value === r) micEnabled.value = enabled
  }

  /** 切摄像头 */
  async function setCameraEnabled(enabled: boolean) {
    const r = _room.value
    if (!r) {
      return
    }
    await r.localParticipant.setCameraEnabled(enabled)
    if (_room.value === r) cameraEnabled.value = enabled
  }

  /** 切扬声器；仅切响应式状态，实际静音由模板上 audio 元素 :muted 绑定生效 */
  function setSpeakerEnabled(enabled: boolean) {
    speakerEnabled.value = enabled
  }

  /**
   * 切屏幕共享；
   *
   * 浏览器会弹原生「选择共享内容」对话框，用户在弹窗里点取消时 setScreenShareEnabled 会抛错，捕获并把状态复位回 SDK 的实际值
   */
  async function setScreenShareEnabled(enabled: boolean) {
    const r = _room.value
    if (!r) return
    try {
      await r.localParticipant.setScreenShareEnabled(enabled)
      if (_room.value === r) screenShareEnabled.value = enabled
    } catch (e) {
      // 用户在浏览器原生对话框里取消选择，不当作错误
      if (_room.value === r) {
        screenShareEnabled.value = r.localParticipant.isScreenShareEnabled
      }
      throw e
    }
  }

  /** 注册「远端连接异常断开」回调；返回反注册函数 */
  function onDisconnected(cb: () => void): () => void {
    disconnectedHandlers.add(cb)
    return () => disconnectedHandlers.delete(cb)
  }

  /** 注册「房内某人加入」回调；返回反注册函数 */
  function onParticipantConnected(cb: ParticipantEventHandler): () => void {
    participantConnectedHandlers.add(cb)
    return () => participantConnectedHandlers.delete(cb)
  }

  /** 注册「房内某人离开」回调；返回反注册函数 */
  function onParticipantDisconnected(cb: ParticipantEventHandler): () => void {
    participantDisconnectedHandlers.add(cb)
    return () => participantDisconnectedHandlers.delete(cb)
  }

  /** identity 是后端签 token 时使用的 userId 字符串，保留大 ID；非数字（兼容性兜底）返回 null */
  function parseUserId(identity: string): number | null {
    const id = parseId(identity)
    return id === undefined ? null : id
  }

  /**
   * MediaStream 缓存；key 为 `${participantSid}:${source}`，value 为 `{ track, stream }`；
   * 同一条 MediaStreamTrack 复用同一个 MediaStream，避免 <video>.srcObject 反复重挂导致解码管线重建（视频闪烁）；
   * track 引用切换（重新订阅 / 切流）时按需新建并替换
   */
  const streamCache = new Map<string, { track: MediaStreamTrack; stream: MediaStream }>()

  /**
   * 取参与者指定来源的轨道并打包为 MediaStream；
   * 参与者走 unknown 是因为响应式系统会丢失 livekit-client 的类签名，函数内手动 cast 回参与者类型；
   * 命中缓存返回同一 MediaStream 引用，下游 watch / srcObject 无需重挂；
   * 轨道被 mute（本端关摄像头 / 远端关摄像头）时返回 null，让 video 元素解绑 srcObject 而不是卡在最后一帧
   */
  function pickStream(participant: unknown, source: Track.Source): MediaStream | null {
    const p = participant as Participant
    const pub = p.getTrackPublication(source)
    if (!pub || pub.isMuted) {
      return null
    }
    const track = pub.track?.mediaStreamTrack
    if (!track) {
      return null
    }
    const key = `${p.sid}:${source}`
    const cached = streamCache.get(key)
    if (cached && cached.track === track) {
      return cached.stream
    }
    const stream = new MediaStream([track])
    streamCache.set(key, { track, stream })
    return stream
  }

  /** 断开当前 Room；clearHandlers 为 true 时同步清理外部注册的事件回调 */
  async function disconnectRoom(clearHandlers: boolean, invalidateConnection = true) {
    if (invalidateConnection) {
      connectionOwner = {}
    }
    // 清理通话结束后不再复用的订阅回调
    if (clearHandlers) {
      disconnectedHandlers.clear()
      participantConnectedHandlers.clear()
      participantDisconnectedHandlers.clear()
    }
    // 清理音视频轨道缓存
    streamCache.clear()
    const r = _room.value
    _room.value = null
    try {
      if (r) {
        await disconnectPhysicalRoom(r)
      }
    } finally {
      if (!_room.value) {
        // 即使 SDK disconnect 抛错，也必须释放本地连接和设备状态
        localParticipant.value = null
        remoteParticipants.value = []
        isConnected.value = false
        reconnecting.value = false
        micEnabled.value = true
        cameraEnabled.value = false
        speakerEnabled.value = true
        screenShareEnabled.value = false
      }
    }
  }

  /** 主动断开；通话结束统一调 */
  async function disconnect() {
    await disconnectRoom(true)
  }

  /** 只断开捕获的 Room；旧 owner 不得误断当前新 Room */
  async function disconnectCaptured(target: Room | null) {
    if (!target) {
      return
    }
    if (_room.value === target) {
      await disconnectRoom(false)
      return
    }
    await disconnectPhysicalRoom(target)
  }

  return {
    room,
    localParticipant,
    remoteParticipants,
    isConnected,
    micEnabled,
    cameraEnabled,
    speakerEnabled,
    screenShareEnabled,
    reconnecting,
    connect,
    disconnect,
    disconnectCaptured,
    setMicEnabled,
    setCameraEnabled,
    setSpeakerEnabled,
    setScreenShareEnabled,
    pickStream,
    onDisconnected,
    onParticipantConnected,
    onParticipantDisconnected
  }
}
