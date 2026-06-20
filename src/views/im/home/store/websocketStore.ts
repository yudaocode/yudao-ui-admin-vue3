import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'
import { getCurrentUserId, getRefreshToken } from '@/utils/auth'

import {
  ImWebSocketMessageType,
  ImMessageStatus,
  ImMessageReceiptStatus,
  ImContentType,
  ImConversationType,
  ImRtcCallMediaType,
  ImRtcParticipantStatus,
  isFriendChatTip,
  isFriendNotification,
  isGroupRequestNotification,
  isNormalMessage
} from '../../utils/constants'
import {
  getPrivateMessagePeerId,
  parseRtcCallPayload,
  playAudioTip,
  resolveCallEndReasonText
} from '../../utils/message'
import {
  MESSAGE_PRIVATE_READ_ENABLED,
  MESSAGE_GROUP_READ_ENABLED,
  WS_RECONNECT_BASE_MS,
  WS_RECONNECT_MAX_MS,
  WS_RECONNECT_JITTER_MS
} from '../../utils/config'
import { useConversationStore } from './conversationStore'
import { useMessageStore } from './messageStore'
import { useFriendStore, type FriendNotificationPayload } from './friendStore'
import { getFriendDisplayName, getGroupDisplayName } from '../../utils/user'
import { useGroupStore } from './groupStore'
import { useGroupRequestStore } from './groupRequestStore'
import {
  useRtcStore,
  type ImRtcCallNotification,
  type ImRtcParticipantConnectedNotification,
  type ImRtcParticipantDisconnectedNotification,
  type ImRtcCallEndNotification
} from './rtcStore'
import { readPrivateMessages as apiReadPrivateMessages } from '@/api/im/message/private'
import { readGroupMessages as apiReadGroupMessages } from '@/api/im/message/group'
import { readChannelMessages as apiReadChannelMessages } from '@/api/im/message/channel'
import type { ImChannelMessageRespVO } from '@/api/im/message/channel'
import { buildChannelConversationStub } from '../../utils/channel'
import type {
  WebSocketFrame,
  ImNotificationWebSocketDTO,
  ImNoConversationNotification,
  ImPrivateMessageNotification,
  ImGroupMessageNotification,
  ImMessageReadNotification,
  ImMessageReceiptNotification,
  Message,
  Group
} from '../types'

/** FRIEND_DELETE 帧 payload 是否带 clear=true：clear 语义是清会话本身，跳过气泡渲染 */
const isFriendDeleteWithClear = (frame: ImPrivateMessageNotification): boolean => {
  if (frame.type !== ImContentType.FRIEND_DELETE) {
    return false
  }
  try {
    const payload = JSON.parse(frame.content || '{}') as { clear?: boolean }
    return payload.clear === true
  } catch {
    return false
  }
}

/** 从私聊消息帧解析好友通知 payload */
const parseFriendNotificationPayload = (
  frame: ImPrivateMessageNotification
): FriendNotificationPayload => JSON.parse(frame.content || '{}') as FriendNotificationPayload

/** 私聊消息帧是否可推断好友对端 */
const isPrivateMessageNotification = (
  frame: ImPrivateMessageNotification | ImNoConversationNotification
): frame is ImPrivateMessageNotification => 'senderId' in frame && 'receiverId' in frame

const RTC_LIVEKIT_PROTOCOLS = new Set(['ws:', 'wss:', 'http:', 'https:'])
const RTC_MEDIA_TYPES = new Set<number>(Object.values(ImRtcCallMediaType))

/** 忽略普通实时帧持久化失败 */
function ignoreRealtimePersistError(promise: Promise<void>): void {
  void promise.catch(() => undefined)
}

/** 校验 LiveKit 连接地址 */
function isValidLiveKitUrl(url?: string): boolean {
  if (!url) {
    return false
  }
  try {
    return RTC_LIVEKIT_PROTOCOLS.has(new URL(url).protocol)
  } catch {
    return false
  }
}

/** 校验来电信令载荷 */
function isValidRtcInvitePayload(payload: ImRtcCallNotification): boolean {
  if (!payload.room || !payload.token || !isValidLiveKitUrl(payload.livekitUrl)) {
    return false
  }
  if (!RTC_MEDIA_TYPES.has(payload.mediaType) || !payload.inviterUserId) {
    return false
  }
  if (payload.conversationType === ImConversationType.PRIVATE) {
    return true
  }
  return payload.conversationType === ImConversationType.GROUP && !!payload.groupId
}

/**
 * WebSocket 私聊 DTO -> 前端 Message；targetId 是会话主键（对端 userId）
 * 不写发送人名字段：渲染层走 utils/user 实时算（备注 / 群昵称变更后历史消息自动刷新）
 */
const convertPrivateMessage = (
  websocketMessage: ImPrivateMessageNotification,
  currentUserId: number
): Message => ({
  id: websocketMessage.id,
  clientMessageId: websocketMessage.clientMessageId,
  type: websocketMessage.type,
  content: websocketMessage.content,
  status: websocketMessage.status,
  receiptStatus: websocketMessage.receiptStatus,
  sendTime: new Date(websocketMessage.sendTime).getTime(),
  senderId: websocketMessage.senderId,
  targetId: getPrivateMessagePeerId(websocketMessage, currentUserId),
  selfSend: websocketMessage.senderId === currentUserId
})

/**
 * WebSocket 群聊 DTO -> 前端 Message
 * 带 atUserIds / receiverUserIds 给 @ 标记和定向接收用；
 * receiptStatus / readCount 让多端同步收到自己发的群消息时回执 UI 立刻就有数据
 */
const convertGroupMessage = (
  websocketMessage: ImGroupMessageNotification,
  currentUserId: number
): Message => ({
  id: websocketMessage.id,
  clientMessageId: websocketMessage.clientMessageId,
  type: websocketMessage.type,
  content: websocketMessage.content,
  status: websocketMessage.status,
  sendTime: new Date(websocketMessage.sendTime).getTime(),
  senderId: websocketMessage.senderId,
  targetId: websocketMessage.groupId,
  selfSend: websocketMessage.senderId === currentUserId,
  atUserIds: websocketMessage.atUserIds || [],
  receiverUserIds: websocketMessage.receiverUserIds || [],
  receiptStatus: websocketMessage.receiptStatus,
  readCount: websocketMessage.readCount
})

/**
 * IM WebSocket Store
 *
 * 职责（不只是连通信，也是后端 IM 事件的统一入口 → 联动 conversationStore / friendStore / groupStore）：
 *
 * 1. 链路管理：建连 / 断连 / 心跳保活 / 自动重连
 * 2. 帧分发：dispatchFrame → dispatchPrivateFrame / dispatchGroupFrame，按会话和内容类型分流
 * 3. 缓冲：初始化加载期（conversationStore.loading=true）暂存消息，等 pull 完成后由 useMessagePuller 调 flushBuffer 回放
 * 4. 事件处理（按类型分发到对应 handle*，联动 conversation / friend / group store）：
 *    - 普通消息（TEXT / IMAGE / FILE / VOICE / VIDEO）：入库 + 当前会话自动已读 / 提示音
 *    - 已读 / 回执（READ / RECEIPT）：多端已读同步、对方读后回执
 *    - 好友变更（FRIEND_*）：同步 friendStore + 级联刷新私聊会话；FRIEND_ADD / FRIEND_DELETE 额外插入会话气泡
 *    - 群个人信号（GROUP_MEMBER_SETTING_UPDATE）：同步 groupStore + 级联刷新群聊会话
 *    - 群成员昵称变更（GROUP_MEMBER_NICKNAME_UPDATE）：同步 groupStore，不插入消息列表
 *    - 群广播事件（GROUP_*）：走 handleGroupMessage + applyGroupNotification 旁路（含 DISSOLVE / QUIT / KICK 自判清群）
 */
export const useImWebSocketStore = defineStore('imWebSocketStore', {
  state: () => ({
    socket: null as WebSocket | null,
    isConnected: false,
    reconnectTimer: null as ReturnType<typeof setTimeout> | null,
    /** 连续重连失败次数；onopen 成功 / disconnect 主动断开后清零，用于指数退避 */
    reconnectAttempts: 0,
    heartbeatTimer: null as ReturnType<typeof setInterval> | null,
    messageBuffer: [] as Array<
      | {
          conversationType: typeof ImConversationType.PRIVATE
          payload: ImPrivateMessageNotification
        }
      | {
          conversationType: typeof ImConversationType.GROUP
          payload: ImGroupMessageNotification
        }
      | { conversationType: typeof ImConversationType.CHANNEL; payload: ImChannelMessageRespVO }
    > // 初始化加载期内，先把普通消息丢进缓冲区，pull 完成后再一次性回放
  }),

  actions: {
    /**
     * 取出缓冲区消息并清空（由 useMessagePuller 在 pull 完成后调用，统一回放给 conversationStore）
     * 配合 messageBuffer 实现：在 conversationStore.loading 期间收到的 WS 消息先暂存，避免和 pull 的 minId 游标打架
     */
    flushBuffer() {
      const msgs = [...this.messageBuffer]
      this.messageBuffer = []
      return msgs
    },

    /** 直接丢弃缓冲帧不回放（cancelPull / 离开 IM 调用，防止下次进 IM 把旧 session 帧回放进新 store） */
    discardBuffer() {
      this.messageBuffer = []
    },

    /**
     * 连接 WebSocket
     * 复用 yudao 内置 /infra/ws 通道，后端通过 sendObject(type, content) 下发
     *
     * 调用契约：切账号 / token 刷新前必须先 `disconnect()` 再 `connect()`；
     * 本方法不感知 token 变化，旧 socket 在 CONNECTING / OPEN 状态会直接复用旧 token，可能拿到错误身份
     */
    connect() {
      // 鉴权用 refreshToken（生命周期更长；access token 过期后服务端会通过 frame 通知重登）
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        console.warn('[IM WS] refreshToken 为空，跳过连接')
        return
      }
      // 旧 socket 还在 CONNECTING / OPEN 直接复用，避免叠加多份 onmessage 监听导致重复消息 / 提示音 / 已读上报
      const existingSocket = this.socket
      if (
        existingSocket &&
        (existingSocket.readyState === WebSocket.OPEN ||
          existingSocket.readyState === WebSocket.CONNECTING)
      ) {
        return
      }
      // 旧 socket 已 CLOSING / CLOSED：解绑回调 + 清引用再 new，避免老 handler 仍持有 store 引用阻碍 GC
      if (existingSocket) {
        existingSocket.onopen = null
        existingSocket.onmessage = null
        existingSocket.onerror = null
        existingSocket.onclose = null
        this.socket = null
      }
      const url = `${this.buildWsUrl()}/infra/ws?token=${refreshToken}`
      this.socket = new WebSocket(url)

      // 连接建立：标记上线 + 启动心跳保活；重连退避计数归零
      this.socket.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        console.log('[IM WS] connected')
        this.startHeartbeat()
      }

      // 收到帧：'pong' 是心跳应答直接吞掉；其余按 WebSocketFrame 解析后交给 dispatchFrame 分流
      this.socket.onmessage = (event) => {
        if (event.data === 'pong') {
          return
        }
        try {
          const frame = JSON.parse(event.data) as WebSocketFrame
          this.dispatchFrame(frame)
        } catch (e) {
          console.error('[IM WS] message parse error:', e)
        }
      }

      // 服务端关闭 / 网络断：标记下线，按指数退避自动重连
      this.socket.onclose = () => {
        this.isConnected = false
        console.log('[IM WS] disconnected')
        this.reconnect()
      }

      // 异常时不主动 reconnect，主动 close() 让 onclose 成为唯一重连入口：
      // 1）避免 onerror / onclose 双触把 reconnectAttempts 一次断连 +2
      // 2）兜底某些平台 onerror 后 onclose 延迟 / 丢失导致重连卡住
      this.socket.onerror = (error) => {
        console.error('[IM WS] error:', error)
        this.isConnected = false
        this.socket?.close()
      }
    },

    /** 拼接 WebSocket 基础地址 */
    buildWsUrl(): string {
      // VITE_BASE_URL 可能是 http:// 或 https:// 开头，替换成 ws:// 或 wss://；如果没配置，就用当前页面的协议 + host
      const baseUrl = (import.meta as any).env?.VITE_BASE_URL as string | undefined
      if (baseUrl && baseUrl.length > 0) {
        return baseUrl.replace(/^http/, 'ws')
      }
      // 当前页面协议 + host（如 http://localhost:8080），替换成 ws://localhost:8080
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      return `${protocol}//${host}`
    },

    /**
     * 按 IM 通知帧分发
     */
    dispatchFrame(frame: WebSocketFrame) {
      if (frame.type !== ImWebSocketMessageType.NOTIFICATION) {
        console.debug('[IM WS] 未识别事件', frame)
        return
      }

      const notification = this.safeParse(frame.content) as ImNotificationWebSocketDTO | null
      if (!notification?.payload || !notification.contentType) {
        return
      }
      const payload = {
        ...notification.payload,
        type: notification.contentType
      }
      switch (notification.conversationType) {
        case ImConversationType.PRIVATE:
          this.dispatchPrivateFrame(payload as ImPrivateMessageNotification)
          break
        case ImConversationType.GROUP:
          this.dispatchGroupFrame(payload as ImGroupMessageNotification)
          break
        case ImConversationType.CHANNEL:
          this.dispatchChannelFrame(payload as ImChannelMessageRespVO)
          break
        case ImConversationType.NONE:
          this.dispatchNoConversationFrame(payload as ImNoConversationNotification)
          break
        default:
          console.debug('[IM WS] 未识别通知', notification)
      }
    },

    /**
     * 无会话通知分发
     */
    dispatchNoConversationFrame(websocketMessage: ImNoConversationNotification) {
      if (isFriendNotification(websocketMessage.type)) {
        this.handleFriendNotification(websocketMessage)
        return
      }
      if (isGroupRequestNotification(websocketMessage.type)) {
        this.handleGroupRequestNotification(websocketMessage)
        return
      }
      switch (websocketMessage.type) {
        case ImContentType.RTC_CALL:
        case ImContentType.RTC_PARTICIPANT_CONNECTED:
        case ImContentType.RTC_PARTICIPANT_DISCONNECTED:
          this.handleRtcSignaling(websocketMessage)
          break
        default:
          console.debug('[IM WS] 未识别无会话通知', websocketMessage)
      }
    },

    /**
     * 频道帧分发：按 payload.type 分到 READ（多端已读同步）或普通素材推送
     */
    dispatchChannelFrame(websocketMessage: ImChannelMessageRespVO) {
      if (websocketMessage.type === ImContentType.READ) {
        this.handleChannelRead(websocketMessage)
        return
      }
      ignoreRealtimePersistError(this.handleChannelMessage(websocketMessage))
    },

    /** 频道 READ：自己其它终端在某频道里标为已读，本端同步清零该频道未读 */
    handleChannelRead(websocketMessage: ImChannelMessageRespVO) {
      void useConversationStore()
        .applyConversationReadList([
          {
            id: websocketMessage.id,
            conversationType: ImConversationType.CHANNEL,
            targetId: websocketMessage.channelId,
            messageId: websocketMessage.id
          }
        ])
        .catch((e) => console.warn('[IM WS] 频道已读同步失败', e))
    },

    /**
     * 频道消息实时入会话；频道消息单向 + 无状态机，直接 insertMessage 即可
     * pull 与 WS 拿到同一条 id 时，messageStore.insertMessage 内部按 id 去重，不会重复
     */
    handleChannelMessage(websocketMessage: ImChannelMessageRespVO): Promise<void> {
      const conversationStore = useConversationStore()
      const messageStore = useMessageStore()
      // 离线加载期间先缓冲，等 pull 完成后再统一回放，避免重复或顺序错乱
      if (conversationStore.loading) {
        this.messageBuffer.push({
          conversationType: ImConversationType.CHANNEL,
          payload: websocketMessage
        })
        return Promise.resolve()
      }
      const sendTimeMs =
        typeof websocketMessage.sendTime === 'number'
          ? websocketMessage.sendTime
          : new Date(websocketMessage.sendTime).getTime()
      const conversation = conversationStore.getConversation(
        ImConversationType.CHANNEL,
        websocketMessage.channelId
      )
      const isActive =
        conversationStore.activeConversation?.type === ImConversationType.CHANNEL &&
        conversationStore.activeConversation?.targetId === websocketMessage.channelId
      // 频道单向订阅，receiptStatus 表达「我是否已读这条」：会话打开即已读 DONE，否则 PENDING（与 pull 口径一致）
      const persistPromise = messageStore.insertMessage(
        buildChannelConversationStub(websocketMessage.channelId),
        {
          id: websocketMessage.id,
          clientMessageId: '',
          type: websocketMessage.type,
          content: websocketMessage.content,
          status: ImMessageStatus.NORMAL,
          receiptStatus: isActive ? ImMessageReceiptStatus.DONE : ImMessageReceiptStatus.PENDING,
          sendTime: sendTimeMs,
          senderId: 0,
          targetId: websocketMessage.channelId,
          selfSend: false,
          materialId: websocketMessage.materialId
        }
      )
      if (isActive) {
        // 窗口打开 = 已读：本端清未读 + 上报服务端读位置，避免读位置滞后
        const readReported = conversationStore.isReportedReadPositionCovered(
          ImConversationType.CHANNEL,
          websocketMessage.channelId,
          websocketMessage.id
        )
        conversationStore.markConversationRead(
          ImConversationType.CHANNEL,
          websocketMessage.channelId,
          websocketMessage.id
        )
        if (!readReported) {
          apiReadChannelMessages(websocketMessage.channelId, websocketMessage.id)
            .then(() =>
              conversationStore.markConversationReadReported(
                ImConversationType.CHANNEL,
                websocketMessage.channelId,
                websocketMessage.id
              )
            )
            .catch((e) => {
              console.warn(
                '[IM WS] 频道自动已读上报失败',
                {
                  conversationType: ImConversationType.CHANNEL,
                  channelId: websocketMessage.channelId,
                  messageId: websocketMessage.id,
                  messageType: websocketMessage.type
                },
                e
              )
            })
        }
      } else if (!conversation?.silent && isNormalMessage(websocketMessage.type)) {
        // 非当前会话且未免打扰：响一下提示音
        playAudioTip()
      }
      return persistPromise
    },

    /** content 既可能已是对象也可能是 JSON 字符串（后端用 Map 序列化下发） */
    safeParse(raw: unknown): Record<string, any> | null {
      if (!raw) {
        return null
      }
      if (typeof raw === 'object') {
        return raw as Record<string, any>
      }
      try {
        return JSON.parse(raw as string)
      } catch (e) {
        console.error('[IM WS] content 解析失败', e)
        return null
      }
    },

    // ==================== 普通消息 ====================

    /**
     * 私聊统一帧分发：按 payload.type（ImContentType）分到已读 / 回执 / 好友通知 / 普通消息
     *
     * 消息通知、已读通知、回执通知由外层 contentType 统一分发
     */
    dispatchPrivateFrame(websocketMessage: ImPrivateMessageNotification) {
      try {
        switch (websocketMessage.type) {
          case ImContentType.READ:
            this.handlePrivateRead(websocketMessage as ImMessageReadNotification)
            break
          case ImContentType.RECEIPT:
            this.handlePrivateReceipt(websocketMessage as ImMessageReceiptNotification)
            break
          case ImContentType.RTC_CALL_END:
            // 入库 + 关闭通话窗 + 渲染聊天 tip（私聊场景）
            this.handleRtcCallEnd(websocketMessage)
            ignoreRealtimePersistError(this.handlePrivateMessage(websocketMessage))
            break
          default:
            if (isFriendChatTip(websocketMessage.type)) {
              this.handleFriendNotification(websocketMessage)
              // FRIEND_DELETE 的 clear=true 语义是清会话本身，跳过气泡避免在已清会话里写入虚拟消息
              if (!isFriendDeleteWithClear(websocketMessage)) {
                ignoreRealtimePersistError(this.handlePrivateMessage(websocketMessage))
              }
            } else {
              // TEXT / IMAGE / FILE / VOICE / VIDEO 等普通消息
              ignoreRealtimePersistError(this.handlePrivateMessage(websocketMessage))
            }
        }
      } catch (e) {
        // 单条帧的处理异常不应阻断后续帧；打印完整 websocketMessage 便于排查
        console.warn('[IM WS] dispatchPrivateFrame 处理失败', websocketMessage, e)
      }
    },

    /**
     * 群聊统一帧分发：按 payload.type（ImContentType）分到已读 / 回执 / 群个人信号 / 普通消息
     *
     * GROUP_MEMBER_SETTING_UPDATE / GROUP_MEMBER_NICKNAME_UPDATE 是成员资料同步信号；其它群广播事件走 handleGroupMessage 入库 + 触发 applyGroupNotification 旁路
     */
    dispatchGroupFrame(websocketMessage: ImGroupMessageNotification) {
      try {
        switch (websocketMessage.type) {
          case ImContentType.READ:
            this.handleGroupRead(websocketMessage as ImMessageReadNotification)
            break
          case ImContentType.RECEIPT:
            this.handleGroupReceipt(websocketMessage as ImMessageReceiptNotification)
            break
          case ImContentType.GROUP_MEMBER_SETTING_UPDATE:
            this.handleGroupMemberSettingUpdate(websocketMessage)
            break
          case ImContentType.GROUP_MEMBER_NICKNAME_UPDATE:
            this.handleGroupMemberNicknameUpdate(websocketMessage)
            break
          case ImContentType.RTC_CALL_START:
            // 入库 + 渲染聊天 tip；同时用 START payload 先生成最小胶囊条，后续 getActiveCall / 参与者事件再补齐成员
            this.handleRtcCallStart(websocketMessage)
            ignoreRealtimePersistError(this.handleGroupMessage(websocketMessage))
            break
          case ImContentType.RTC_CALL_END:
            // 入库 + 移除胶囊条 + 关闭通话窗（如果当前在该群通话内）
            this.handleRtcCallEnd(websocketMessage)
            ignoreRealtimePersistError(this.handleGroupMessage(websocketMessage))
            break
          default:
            // TEXT / IMAGE / FILE / VOICE / VIDEO + GROUP_* 群广播事件
            ignoreRealtimePersistError(this.handleGroupMessage(websocketMessage))
        }
      } catch (e) {
        // 单条帧的处理异常不应阻断后续帧；打印完整 websocketMessage 便于排查
        console.warn('[IM WS] dispatchGroupFrame 处理失败', websocketMessage, e)
      }
    },

    /**
     * 私聊普通消息（TEXT / IMAGE / FILE / VOICE / VIDEO）入库 + 自动已读
     *
     * 流程：
     * 1. 离线加载期缓冲（避开与 pull 回填的竞态）
     * 2. 计算 selfSend / peerId 维度，拉好友信息回填展示字段
     * 3. 撤回 TIP 直接转走 recallMessage，不进消息列表
     * 4. 构造前端 Message，插入到对应私聊会话
     * 5. 当前会话激活时自动上报已读；否则非免打扰响提示音
     */
    handlePrivateMessage(websocketMessage: ImPrivateMessageNotification): Promise<void> {
      const conversationStore = useConversationStore()
      const friendStore = useFriendStore()
      const currentUserId = getCurrentUserId()

      // 0. 防御层：senderId / receiverId 均不含当前用户的私聊帧直接丢弃，避免后端路由 / 多端串号污染会话
      //    （FRIEND_* 等系统通知也走这条通道，但 fromUserId=senderId、toUserId=receiverId 仍是当前用户视角）
      if (
        currentUserId &&
        websocketMessage.senderId !== currentUserId &&
        websocketMessage.receiverId !== currentUserId
      ) {
        console.warn('[IM WS] 丢弃不属于当前用户的私聊帧', websocketMessage)
        return Promise.resolve()
      }

      // 1. 离线加载期间先缓冲，等 pull 完成后再统一回放，避免重复或顺序错乱
      if (conversationStore.loading) {
        this.messageBuffer.push({
          conversationType: ImConversationType.PRIVATE,
          payload: websocketMessage
        })
        return Promise.resolve()
      }

      // 2. selfSend / peerId：自己发的消息属于「发给 receiverId 的会话」，别人发的属于「发送者的会话」
      const selfSend = websocketMessage.senderId === currentUserId
      const peerId = getPrivateMessagePeerId(websocketMessage, currentUserId)
      // 未知对端（陌生人加好友前先收到消息等场景）：异步补拉一次，下次再渲染就有 name/avatar
      const friend = friendStore.getFriend(peerId)
      if (!friend) {
        friendStore.fetchFriendInfo(peerId).catch(() => undefined)
      }
      // 会话标题永远跟「对端」走（不管谁发的消息）；这里只算一次给 insertMessage 用
      const peerDisplayName = friend ? getFriendDisplayName(friend) : ''

      // 3. 后端撤回：下发一条 RECALL 消息，content 为 `{"messageId": xxx}`（对齐 ImContentTypeEnum.RECALL → RecallMessage）
      // 这里拦截下来改走 recallMessage（把原消息更新为 RECALL 态），不让它作为新消息进列表
      if (websocketMessage.type === ImContentType.RECALL) {
        return useMessageStore().recallMessage(
          ImConversationType.PRIVATE,
          peerId,
          websocketMessage.content
        )
      }

      // 4. 后端 DTO → 前端 Message：发送人名渲染时实时算，不写入消息字段
      const message = convertPrivateMessage(websocketMessage, currentUserId)
      const persistPromise = useMessageStore().insertMessage(
        {
          type: ImConversationType.PRIVATE,
          targetId: peerId,
          name: peerDisplayName || String(peerId),
          avatar: friend?.avatar || '',
          silent: friend?.silent
        },
        message
      )

      // 5. 仅对方消息才走「自动已读 / 提示音」分支：自己发的不会触发
      if (!selfSend) {
        const conversation = conversationStore.getConversation(ImConversationType.PRIVATE, peerId)
        const isActive =
          conversationStore.activeConversation?.type === ImConversationType.PRIVATE &&
          conversationStore.activeConversation?.targetId === peerId
        if (isActive) {
          // 聊天窗口打开 = 实际看到了：本端清未读；私聊已读开启时再上报后端，让对方 UI 立刻切到"已读"
          // 已读位置直接用刚到的消息 id（这条就是当前会话最大 id）
          const readReported = conversationStore.isReportedReadPositionCovered(
            ImConversationType.PRIVATE,
            peerId,
            websocketMessage.id
          )
          conversationStore.markConversationRead(
            ImConversationType.PRIVATE,
            peerId,
            websocketMessage.id
          )
          if (MESSAGE_PRIVATE_READ_ENABLED && !readReported) {
            apiReadPrivateMessages(peerId, websocketMessage.id)
              .then(() =>
                conversationStore.markConversationReadReported(
                  ImConversationType.PRIVATE,
                  peerId,
                  websocketMessage.id
                )
              )
              .catch((e) => {
                console.warn(
                  '[IM WS] 私聊自动已读上报失败',
                  {
                    conversationType: ImConversationType.PRIVATE,
                    peerId,
                    messageId: websocketMessage.id,
                    messageType: websocketMessage.type,
                    senderId: websocketMessage.senderId
                  },
                  e
                )
              })
          }
        } else if (!conversation?.silent && isNormalMessage(websocketMessage.type)) {
          // 非当前会话且未免打扰：响一下提示音（带节流，详见 playAudioTip）；FRIEND_* 等系统事件不响
          playAudioTip()
        }
      }
      return persistPromise
    },

    /** 私聊 READ 事件：自己的其它终端在对方会话里标为已读，本端同步清零未读；私聊已读关闭时兜底忽略 */
    handlePrivateRead(websocketMessage: ImMessageReadNotification) {
      if (!MESSAGE_PRIVATE_READ_ENABLED) {
        return
      }
      if (!websocketMessage.id || !websocketMessage.receiverId) {
        return
      }
      void useConversationStore()
        .applyConversationReadList([
          {
            id: websocketMessage.id,
            conversationType: ImConversationType.PRIVATE,
            targetId: websocketMessage.receiverId,
            messageId: websocketMessage.id
          }
        ])
        .catch((e) => console.warn('[IM WS] 私聊已读同步失败', e))
    },

    /**
     * 私聊 RECEIPT 事件：对方读了我的消息，把和对方会话里自己发的消息标为已读
     * 后端将 maxReadId 编码在通知的 id 字段，
     * 这里据此卡边界，避免把"回执在路上时刚发的消息"误标为已读；私聊已读关闭时兜底忽略
     */
    handlePrivateReceipt(websocketMessage: ImMessageReceiptNotification) {
      if (!MESSAGE_PRIVATE_READ_ENABLED) {
        return
      }
      if (!websocketMessage.id) {
        return
      }
      if (!websocketMessage.senderId) {
        return
      }
      useMessageStore().applyMessageReadReceipt({
        conversationType: ImConversationType.PRIVATE,
        targetId: websocketMessage.senderId,
        privateReadMaxId: websocketMessage.id
      })
    },

    /**
     * 群聊普通消息入库 + 自动已读（结构与 handlePrivateMessage 对称）
     *
     * 流程：
     * 1. 离线加载期缓冲
     * 2. 未知群时拉群详情兜底
     * 3. 撤回 TIP 直接转走
     * 4. 构造 Message + at 字段，插入到对应群聊会话（发送人名渲染时实时算）
     * 5. 当前会话激活时自动上报已读（带 lastMessageId）；否则非免打扰响提示音
     */
    handleGroupMessage(websocketMessage: ImGroupMessageNotification): Promise<void> {
      const conversationStore = useConversationStore()
      const groupStore = useGroupStore()
      const currentUserId = getCurrentUserId()
      const selfSend = websocketMessage.senderId === currentUserId

      // 0. 防御层：定向群消息 receiverUserIds 非空且未包含当前用户时丢弃
      //    自己发的（selfSend）始终通过；全员可见（receiverUserIds 为空 / 缺失）也通过
      const receiverUserIds = websocketMessage.receiverUserIds
      if (
        currentUserId &&
        !selfSend &&
        Array.isArray(receiverUserIds) &&
        receiverUserIds.length > 0 &&
        !receiverUserIds.includes(currentUserId)
      ) {
        console.warn('[IM WS] 丢弃不属于当前用户的定向群消息', websocketMessage)
        return Promise.resolve()
      }

      // 1. 离线加载期缓冲（与私聊对称）
      if (conversationStore.loading) {
        this.messageBuffer.push({
          conversationType: ImConversationType.GROUP,
          payload: websocketMessage
        })
        return Promise.resolve()
      }

      // 2. 未知群时自动拉群详情 + 成员（被拉入群但还没收到 GROUP_CREATE 时的兜底）
      const group = groupStore.getGroup(websocketMessage.groupId)
      if (!group) {
        groupStore.fetchGroupInfo(websocketMessage.groupId, true).catch(() => undefined)
      }

      // 3. 后端撤回：下发一条 RECALL 消息，content 为 `{"messageId": xxx}`
      // 这里拦截下来改走 recallMessage（把原消息更新为 RECALL 态）
      if (websocketMessage.type === ImContentType.RECALL) {
        return useMessageStore().recallMessage(
          ImConversationType.GROUP,
          websocketMessage.groupId,
          websocketMessage.content
        )
      }

      // 4. 后端 DTO → 前端 Message：发送人名渲染时实时算，不写入消息字段
      const message = convertGroupMessage(websocketMessage, currentUserId)
      const persistPromise = useMessageStore().insertMessage(
        {
          type: ImConversationType.GROUP,
          targetId: websocketMessage.groupId,
          name: group ? getGroupDisplayName(group) : String(websocketMessage.groupId),
          avatar: group?.avatar || '',
          silent: group?.silent
        },
        message
      )

      // 5. 仅对方消息才走「自动已读 / 提示音」（与私聊对称）
      if (!selfSend) {
        const conversation = conversationStore.getConversation(
          ImConversationType.GROUP,
          websocketMessage.groupId
        )
        const isActive =
          conversationStore.activeConversation?.type === ImConversationType.GROUP &&
          conversationStore.activeConversation?.targetId === websocketMessage.groupId
        if (isActive) {
          // 群已读上报需要带 messageId（群消息以"读到第几条"的游标为准，区别于私聊只标 receiverId）；群已读关闭时仅本地清零
          const readReported = conversationStore.isReportedReadPositionCovered(
            ImConversationType.GROUP,
            websocketMessage.groupId,
            websocketMessage.id
          )
          conversationStore.markConversationRead(
            ImConversationType.GROUP,
            websocketMessage.groupId,
            websocketMessage.id
          )
          if (MESSAGE_GROUP_READ_ENABLED && !readReported) {
            apiReadGroupMessages(websocketMessage.groupId, websocketMessage.id)
              .then(() =>
                conversationStore.markConversationReadReported(
                  ImConversationType.GROUP,
                  websocketMessage.groupId,
                  websocketMessage.id
                )
              )
              .catch((e) => {
                console.warn(
                  '[IM WS] 群聊自动已读上报失败',
                  {
                    conversationType: ImConversationType.GROUP,
                    groupId: websocketMessage.groupId,
                    messageId: websocketMessage.id,
                    messageType: websocketMessage.type,
                    senderId: websocketMessage.senderId
                  },
                  e
                )
              })
          }
        } else if (!conversation?.silent && isNormalMessage(websocketMessage.type)) {
          // GROUP_* 群广播事件等系统消息不响提示音
          playAudioTip()
        }
      }
      return persistPromise
    },

    // ==================== 群聊已读 / 回执 ====================

    /** 群聊 READ：自己其它终端在某群里标为已读，本端同步清零该群未读 + @ 红字；群已读关闭时兜底忽略 */
    handleGroupRead(websocketMessage: ImMessageReadNotification) {
      if (!MESSAGE_GROUP_READ_ENABLED) {
        return
      }
      const readMessageId = websocketMessage.readId || websocketMessage.id
      if (!readMessageId || !websocketMessage.groupId) {
        return
      }
      void useConversationStore()
        .applyConversationReadList([
          {
            id: readMessageId,
            conversationType: ImConversationType.GROUP,
            targetId: websocketMessage.groupId,
            messageId: readMessageId
          }
        ])
        .catch((e) => console.warn('[IM WS] 群聊已读同步失败', e))
    },

    /** 群聊 RECEIPT：更新某条群消息的 readCount / receiptStatus；群已读关闭时兜底忽略 */
    handleGroupReceipt(websocketMessage: ImMessageReceiptNotification) {
      if (!MESSAGE_GROUP_READ_ENABLED) {
        return
      }
      if (!websocketMessage.id || !websocketMessage.groupId) {
        return
      }
      useMessageStore().applyMessageReadReceipt({
        conversationType: ImConversationType.GROUP,
        targetId: websocketMessage.groupId,
        groupMessageId: websocketMessage.id,
        readCount: websocketMessage.readCount,
        receiptStatus: websocketMessage.receiptStatus
      })
    },

    // ==================== 好友通知（1201-1210 段位） ====================

    /**
     * 算 FRIEND_ADD / FRIEND_DELETE 帧的「对端 userId」：
     *    becomeFriends 单条入库后双方收到同一份 payload，payload.friendUserId 固定是 toUserId，本端真正的对端要从帧 sender / receiver 反推
     */
    computeFriendPeerId(frame: ImPrivateMessageNotification): number {
      const currentUserId = getCurrentUserId()
      return getPrivateMessagePeerId(frame, currentUserId)
    },

    /**
     * 好友通知统一入口：按 type 分发到 friendStore 内部 dispatcher
     */
    handleFriendNotification(
      websocketMessage: ImPrivateMessageNotification | ImNoConversationNotification
    ) {
      const payload = isPrivateMessageNotification(websocketMessage)
        ? parseFriendNotificationPayload(websocketMessage)
        : (websocketMessage as unknown as FriendNotificationPayload)
      const friendStore = useFriendStore()
      switch (websocketMessage.type) {
        case ImContentType.FRIEND_REQUEST_RECEIVED:
          friendStore.applyFriendRequestReceivedNotification(payload)
          break
        case ImContentType.FRIEND_REQUEST_APPROVED:
          friendStore.applyFriendRequestApprovedNotification(payload)
          break
        case ImContentType.FRIEND_REQUEST_REJECTED:
          friendStore.applyFriendRequestRejectedNotification(payload)
          break
        case ImContentType.FRIEND_ADD:
          friendStore.applyFriendAddNotification(
            payload,
            isPrivateMessageNotification(websocketMessage)
              ? this.computeFriendPeerId(websocketMessage)
              : payload.friendUserId
          )
          break
        case ImContentType.FRIEND_DELETE:
          friendStore.applyFriendDeleteNotification(
            payload,
            isPrivateMessageNotification(websocketMessage)
              ? this.computeFriendPeerId(websocketMessage)
              : payload.friendUserId
          )
          break
        case ImContentType.FRIEND_BLOCK:
          friendStore.applyFriendBlockNotification(payload)
          break
        case ImContentType.FRIEND_UNBLOCK:
          friendStore.applyFriendUnblockNotification(payload)
          break
        case ImContentType.FRIEND_INFO_UPDATED:
          friendStore.applyFriendInfoUpdatedNotification(payload)
          break
        case ImContentType.FRIEND_UPDATE:
          friendStore.applyFriendUpdateNotification(payload)
          break
        default:
          console.debug('[IM WS] 未识别好友通知', websocketMessage)
      }
    },

    // ==================== 加群申请通知（1503 / 1505 / 1506） ====================

    /**
     * 加群申请通知统一入口：分发到 groupRequestStore，驱动横幅 + Drawer 同步
     */
    handleGroupRequestNotification(websocketMessage: ImNoConversationNotification) {
      const payload = websocketMessage as { requestId?: number }
      if (!payload.requestId) {
        return
      }
      const groupRequestStore = useGroupRequestStore()
      switch (websocketMessage.type) {
        case ImContentType.GROUP_REQUEST_RECEIVED:
          groupRequestStore.addGroupRequestById(payload.requestId).catch(() => undefined)
          break
        case ImContentType.GROUP_REQUEST_APPROVED:
        case ImContentType.GROUP_REQUEST_REJECTED:
          groupRequestStore.removeGroupRequestById(payload.requestId)
          break
        default:
          break
      }
    },

    // ==================== 群关系事件（承载于群聊通道，按 inner type 分流） ====================

    /**
     * GROUP_MEMBER_SETTING_UPDATE：多端同步成员个人设置变更（silent / groupRemark）
     *
     * payload 携带变更字段，按非 null 字段直接局部更新；省一次 fetchGroupMemberList 接口
     */
    handleGroupMemberSettingUpdate(websocketMessage: ImGroupMessageNotification) {
      // content 解析失败由外层 dispatchGroupFrame 的 try-catch 兜底（含 websocketMessage 打印），不重复 catch
      const payload: { silent?: boolean; groupRemark?: string } = JSON.parse(
        websocketMessage.content || '{}'
      )
      const groupStore = useGroupStore()
      const group = groupStore.getGroup(websocketMessage.groupId)
      if (!group) {
        return
      }
      const fields: Partial<Group> = {}
      if (payload.silent != null) {
        fields.silent = payload.silent
      }
      if (payload.groupRemark != null) {
        fields.groupRemark = payload.groupRemark
      }
      if (Object.keys(fields).length > 0) {
        groupStore.updateGroupFields(websocketMessage.groupId, fields)
      }
    },

    /** GROUP_MEMBER_NICKNAME_UPDATE：同步成员在群里的昵称 */
    handleGroupMemberNicknameUpdate(websocketMessage: ImGroupMessageNotification) {
      useGroupStore().applyGroupNotification(
        websocketMessage.groupId,
        websocketMessage.type,
        websocketMessage.content
      )
    },

    // ==================== 心跳 / 重连 ====================

    /** 心跳包：纯文本 'ping'，对应服务端 'pong'（后端这层用纯字符串约定，避免 JSON 解析开销） */
    sendHeartBeat() {
      if (this.socket && this.isConnected) {
        this.socket.send('ping')
      }
    },

    /** 主动断开（切换用户 / 退出登录时用）：关 socket + 停心跳 + 取消待重连 */
    disconnect() {
      if (this.socket) {
        // close() 异步触发 onclose / onerror，回调里会无条件 reconnect；
        // 主动关闭路径必须先全部解绑，否则 onclose 会引发自动重连，CONNECTING 期间的 in-flight message 也可能被老 onmessage 投递到 stale 上下文
        this.socket.onopen = null
        this.socket.onmessage = null
        this.socket.onclose = null
        this.socket.onerror = null
        this.socket.close()
        this.socket = null
      }
      // onclose 已被解绑，不会再帮我们设 isConnected=false，这里手动复位
      this.isConnected = false
      this.stopHeartbeat()
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
      // 主动断开（切账号 / 退出）：清零退避计数，下次 connect 重新从最短间隔起算
      this.reconnectAttempts = 0
    },

    /**
     * 自动重连：指数退避 base * 2^attempt（封顶 max）+ 0~jitter ms 随机偏移
     *
     * onclose 是唯一入口；onerror 不再调本方法（浏览器规范两者必同时触发，避免计数 +2）
     * 不设次数上限，频率封顶在 WS_RECONNECT_MAX_MS（约 30s）持续重试，直到链路恢复或主动 disconnect
     */
    reconnect() {
      this.stopHeartbeat()
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
      const backoff = Math.min(
        WS_RECONNECT_BASE_MS * 2 ** this.reconnectAttempts,
        WS_RECONNECT_MAX_MS
      )
      const delay = backoff + Math.floor(Math.random() * WS_RECONNECT_JITTER_MS)
      this.reconnectAttempts++
      console.log(`[IM WS] reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
      this.reconnectTimer = setTimeout(() => {
        this.connect()
      }, delay)
    },

    /** 心跳 5 秒一次，保活 + 探活（链路断了 onclose 会触发，由 reconnect 兜底） */
    startHeartbeat() {
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = setInterval(() => {
        if (this.socket && this.isConnected) {
          this.sendHeartBeat()
        }
      }, 5000)
    },

    /** 停心跳：disconnect / 重连前调，避免老 timer 在新 socket 上继续触发 sendHeartBeat */
    stopHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = null
      }
    },

    // ==================== 实时通话信令分发 ====================

    /**
     * 通话信令分发：1601 RTC_CALL（按 status 区分 INVITING / JOINED / REJECTED / NO_ANSWER / LEFT）+ 1602 / 1603 参与者加入 / 离开
     * <p>
     * 单一 dispatcher，按 type 分发到 rtcStore
     */
    handleRtcSignaling(websocketMessage: ImNoConversationNotification) {
      const rtcStore = useRtcStore()
      switch (websocketMessage.type) {
        case ImContentType.RTC_CALL: {
          const payload = websocketMessage as unknown as ImRtcCallNotification
          switch (payload.status) {
            case ImRtcParticipantStatus.INVITING:
              if (!isValidRtcInvitePayload(payload)) {
                console.warn('[IM WS] RTC_CALL invite payload 不合法', payload)
                return
              }
              // 当前已在通话中：忽略新来电；后端层面也会拒绝，这里是兜底
              if (!rtcStore.isActive) {
                rtcStore.showIncoming(payload)
              }
              break
            case ImRtcParticipantStatus.REJECTED:
              rtcStore.applyParticipantRejected(payload)
              break
            case ImRtcParticipantStatus.NO_ANSWER:
              // 群通话单人振铃超时；信令独立保留语义，处理与 REJECTED 一致
              rtcStore.applyParticipantNoAnswer(payload)
              break
            case ImRtcParticipantStatus.JOINED:
            case ImRtcParticipantStatus.LEFT:
              // ACCEPT / HUNGUP 暂不需要本端额外响应；rtcStore 状态由 1602/1603 + END 维护
              break
            default:
              console.warn('[IM WS] 未识别的 RTC_CALL status', payload)
          }
          return
        }
        case ImContentType.RTC_PARTICIPANT_CONNECTED: {
          const payload = websocketMessage as unknown as ImRtcParticipantConnectedNotification
          if (payload?.room && payload.userId) {
            rtcStore.applyParticipantConnected(payload)
          }
          return
        }
        case ImContentType.RTC_PARTICIPANT_DISCONNECTED: {
          const payload = websocketMessage as unknown as ImRtcParticipantDisconnectedNotification
          if (payload?.room && payload.userId) {
            rtcStore.applyParticipantDisconnected(payload)
          }
        }
      }
    },

    /** RTC_CALL_START 通话开始 */
    handleRtcCallStart(websocketMessage: ImGroupMessageNotification) {
      const payload = parseRtcCallPayload(websocketMessage.content)
      if (!payload?.room || !payload.mediaType || !payload.inviterUserId) {
        console.warn('[IM WS] RTC_CALL_START payload 不合法', {
          groupId: websocketMessage.groupId,
          messageId: websocketMessage.id,
          contentLength: websocketMessage.content?.length ?? 0
        })
        return
      }
      useRtcStore().setGroupCall({
        room: payload.room,
        groupId: websocketMessage.groupId,
        mediaType: payload.mediaType,
        inviterId: payload.inviterUserId,
        joinedUserIds: [payload.inviterUserId],
        inviteeIds: []
      })
    },

    /**
     * RTC_CALL_END 通话结束；私聊 + 群聊都走这一条；payload 携带 conversationType 区分
     * <p>
     * 私聊：关闭当前通话窗
     * 群聊：移除胶囊条；如本端在该群通话内则关闭通话窗
     */
    handleRtcCallEnd(websocketMessage: ImPrivateMessageNotification | ImGroupMessageNotification) {
      const payload = this.safeParse(websocketMessage.content) as ImRtcCallEndNotification | null
      if (!payload?.room) {
        return
      }
      const rtcStore = useRtcStore()
      const isGroup = payload.conversationType === ImConversationType.GROUP
      // 群通话：移除对应房间的胶囊条
      const groupId = (websocketMessage as ImGroupMessageNotification).groupId
      if (isGroup && groupId) {
        rtcStore.removeGroupCall(groupId, payload.room)
      }
      // 通话窗 / 来电窗指向同一 room 时关闭：
      //   RUNNING / INVITING 阶段对比 call.room；INCOMING 阶段对比 incomingPayload.room
      const matchCall = rtcStore.call?.room === payload.room
      const matchIncoming = rtcStore.incomingPayload?.room === payload.room
      if (rtcStore.isActive && (matchCall || matchIncoming)) {
        const reasonText = resolveCallEndReasonText(payload.endReason)
        console.info('[Call] end:', reasonText)
        rtcStore.reset()
      }
    }
  }
})

export const useImWebSocketStoreWithOut = () => {
  return useImWebSocketStore(store)
}

// dev: 让 Pinia 的 actions / state 改动支持 HMR，避免每次改 store 都得硬刷
// 否则 Vite 把新模块推下来后，老 store 实例的 action 闭包仍指向旧函数体
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useImWebSocketStore, import.meta.hot))
}
