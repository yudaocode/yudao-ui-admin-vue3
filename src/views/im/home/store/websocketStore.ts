import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'
import { getRefreshToken } from '@/utils/auth'
import { useUserStore } from '@/store/modules/user'

import { ImWebSocketMessageType, ImMessageType, ImConversationType } from '../../utils/constants'
import { playAudioTip } from '../../utils/message'
import { useConversationStore } from './conversationStore'
import { useFriendStore } from './friendStore'
import { getFriendDisplayName } from '../../utils/user'
import { useGroupStore } from './groupStore'
import { readPrivateMessages as apiReadPrivateMessages } from '@/api/im/message/private'
import { readGroupMessages as apiReadGroupMessages } from '@/api/im/message/group'
import type {
  WebSocketFrame,
  ImPrivateMessageDTO,
  ImGroupMessageDTO,
  Message
} from '../types'

/**
 * WebSocket 私聊 DTO -> 前端 Message
 * 不写发送人名字段：渲染层走 utils/user 实时算（备注 / 群昵称变更后历史消息自动刷新）
 */
const convertPrivateMessage = (
  websocketMessage: ImPrivateMessageDTO,
  currentUserId: number
): Message => ({
  id: websocketMessage.id,
  clientMessageId: websocketMessage.clientMessageId,
  type: websocketMessage.type,
  content: websocketMessage.content,
  status: websocketMessage.status,
  sendTime: new Date(websocketMessage.sendTime).getTime(),
  senderId: websocketMessage.senderId,
  targetId: websocketMessage.receiverId,
  selfSend: websocketMessage.senderId === currentUserId
})

/**
 * WebSocket 群聊 DTO -> 前端 Message
 * 带 atUserIds / receiverUserIds 给 @ 标记和定向接收用；
 * receiptStatus / readCount 让多端同步收到自己发的群消息时回执 UI 立刻就有数据
 */
const convertGroupMessage = (
  websocketMessage: ImGroupMessageDTO,
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
 * 2. 帧分发：dispatchFrame → dispatchPrivateFrame / dispatchGroupFrame，按 ImMessageType 再分流
 * 3. 缓冲：初始化加载期（conversationStore.loading=true）暂存消息，等 pull 完成后由 useMessagePuller 调 flushBuffer 回放
 * 4. 事件处理（按类型分发到对应 handle*，联动 conversation / friend / group store）：
 *    - 普通消息（TEXT / IMAGE / FILE / VOICE / VIDEO / TIP_TEXT）：入库 + 当前会话自动已读 / 提示音
 *    - 已读 / 回执（READ / RECEIPT）：多端已读同步、对方读后回执
 *    - 好友变更（FRIEND_ADD / DELETE / UPDATE）：同步 friendStore + 级联刷新私聊会话
 *    - 群变更（GROUP_CREATE / UPDATE / DELETE / MEMBER_UPDATE）：同步 groupStore + 级联刷新群聊会话
 */
export const useImWebSocketStore = defineStore('imWebSocketStore', {
  state: () => ({
    socket: null as WebSocket | null,
    isConnected: false,
    reconnectTimer: null as ReturnType<typeof setTimeout> | null,
    heartbeatTimer: null as ReturnType<typeof setInterval> | null,
    messageBuffer: [] as Array<
      | { conversationType: typeof ImConversationType.PRIVATE; payload: ImPrivateMessageDTO }
      | { conversationType: typeof ImConversationType.GROUP; payload: ImGroupMessageDTO }
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

    /**
     * 连接 WebSocket
     * 复用 yudao 内置 /infra/ws 通道，后端通过 sendObject(type, content) 下发
     */
    connect() {
      // 鉴权用 refreshToken（生命周期更长；access token 过期后服务端会通过 frame 通知重登）
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        console.warn('[IM WS] refreshToken 为空，跳过连接')
        return
      }
      const url = `${this.buildWsUrl()}/infra/ws?token=${refreshToken}`
      this.socket = new WebSocket(url)

      // 连接建立：标记上线 + 启动心跳保活
      this.socket.onopen = () => {
        this.isConnected = true
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

      // 服务端关闭 / 网络断：标记下线，3 秒后自动重连
      this.socket.onclose = () => {
        this.isConnected = false
        console.log('[IM WS] disconnected')
        this.reconnect()
      }

      // 异常同样走重连（onerror 后通常 onclose 也会触发，reconnect 内部已防重）
      this.socket.onerror = (error) => {
        console.error('[IM WS] error:', error)
        this.isConnected = false
        this.reconnect()
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
     * 按帧 type 分发：外层只有私聊 / 群聊两个通道，其它事件（已读、回执、好友 / 群变更）
     * 由各自 dispatchXxxFrame 按 payload.type（ImMessageType）再分流
     */
    dispatchFrame(frame: WebSocketFrame) {
      const content = this.safeParse(frame.content)
      if (!content) {
        return
      }
      switch (frame.type) {
        case ImWebSocketMessageType.PRIVATE_MESSAGE:
          this.dispatchPrivateFrame(content as ImPrivateMessageDTO)
          break
        case ImWebSocketMessageType.GROUP_MESSAGE:
          this.dispatchGroupFrame(content as ImGroupMessageDTO)
          break
        default:
          console.debug('[IM WS] 未识别事件', frame)
      }
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
     * 私聊统一帧分发：按 payload.type（ImMessageType）分到已读 / 回执 / 好友变更 / 普通消息
     *
     * 对应后端 ImPrivateMessageDTO 的 ofRead / ofReceipt / ofFriendAdd / ofFriendDelete / ofFriendUpdate / ofSend
     */
    dispatchPrivateFrame(websocketMessage: ImPrivateMessageDTO) {
      switch (websocketMessage.type) {
        case ImMessageType.READ:
          this.handlePrivateRead(websocketMessage)
          break
        case ImMessageType.RECEIPT:
          this.handlePrivateReceipt(websocketMessage)
          break
        case ImMessageType.FRIEND_ADD:
          this.handleFriendAdd(websocketMessage)
          break
        case ImMessageType.FRIEND_DELETE:
          this.handleFriendDelete(websocketMessage)
          break
        case ImMessageType.FRIEND_UPDATE:
          this.handleFriendUpdate(websocketMessage)
          break
        default:
          // TEXT / IMAGE / FILE / VOICE / VIDEO / TIP_TEXT 等普通消息
          this.handlePrivateMessage(websocketMessage)
      }
    },

    /**
     * 群聊统一帧分发：按 payload.type（ImMessageType）分到已读 / 回执 / 群变更 / 普通消息
     *
     * 对应后端 ImGroupMessageDTO 的 ofRead / ofReceipt / ofGroupCreate / ofGroupUpdate / ofGroupDelete / ofGroupMemberUpdate / ofSend
     */
    dispatchGroupFrame(websocketMessage: ImGroupMessageDTO) {
      switch (websocketMessage.type) {
        case ImMessageType.READ:
          this.handleGroupRead(websocketMessage)
          break
        case ImMessageType.RECEIPT:
          this.handleGroupReceipt(websocketMessage)
          break
        case ImMessageType.GROUP_CREATE:
          this.handleGroupCreate(websocketMessage)
          break
        case ImMessageType.GROUP_UPDATE:
          this.handleGroupUpdate(websocketMessage)
          break
        case ImMessageType.GROUP_DELETE:
          this.handleGroupDelete(websocketMessage)
          break
        case ImMessageType.GROUP_MEMBER_UPDATE:
          this.handleGroupMemberUpdate(websocketMessage)
          break
        default:
          // TEXT / IMAGE / FILE / VOICE / VIDEO / TIP_TEXT 等普通消息
          this.handleGroupMessage(websocketMessage)
      }
    },

    /**
     * 私聊普通消息（TEXT / IMAGE / FILE / VOICE / VIDEO / TIP_TEXT）入库 + 自动已读
     *
     * 流程：
     * 1. 离线加载期缓冲（避开与 pull 回填的竞态）
     * 2. 计算 selfSend / peerId 维度，拉好友信息回填展示字段
     * 3. 撤回 TIP 短路：转走 recallMessage，不进消息列表
     * 4. 构造前端 Message，插入到对应私聊会话
     * 5. 当前会话激活时自动上报已读；否则非免打扰响提示音
     */
    handlePrivateMessage(websocketMessage: ImPrivateMessageDTO) {
      const conversationStore = useConversationStore()
      // 1. 离线加载期间先缓冲，等 pull 完成后再统一回放，避免重复或顺序错乱
      if (conversationStore.loading) {
        this.messageBuffer.push({
          conversationType: ImConversationType.PRIVATE,
          payload: websocketMessage
        })
        return
      }

      // 2. selfSend / peerId：自己发的消息属于「发给 receiverId 的会话」，别人发的属于「发送者的会话」
      const userStore = useUserStore()
      const friendStore = useFriendStore()
      const currentUserId = Number(userStore.getUser?.id) || 0
      const selfSend = websocketMessage.senderId === currentUserId
      const peerId = selfSend ? websocketMessage.receiverId : websocketMessage.senderId
      // 未知对端（陌生人加好友前先收到消息等场景）：异步补拉一次，下次再渲染就有 name/avatar
      const friend = friendStore.getFriend(peerId)
      if (!friend) {
        friendStore.loadFriendInfo(peerId).catch(() => undefined)
      }
      // 会话标题永远跟「对端」走（不管谁发的消息）；这里只算一次给 insertMessage 用
      const peerDisplayName = friend ? getFriendDisplayName(friend) : ''

      // 3. 后端撤回：下发一条 RECALL 消息，content 为 `{"messageId": xxx}`（对齐 ImMessageTypeEnum.RECALL → RecallMessage）
      // 这里拦截下来改走 recallMessage（把原消息更新为 RECALL 态），不让它作为新消息进列表
      if (websocketMessage.type === ImMessageType.RECALL) {
        conversationStore.recallMessage(
          ImConversationType.PRIVATE,
          peerId,
          websocketMessage.content
        )
        return
      }

      // 4. 后端 DTO → 前端 Message：发送人名渲染时实时算，不写入消息字段
      const message = convertPrivateMessage(websocketMessage, currentUserId)
      conversationStore.insertMessage(
        {
          type: ImConversationType.PRIVATE,
          targetId: peerId,
          name: peerDisplayName || String(peerId),
          avatar: friend?.avatar || ''
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
          // 聊天窗口打开 = 实际看到了：本端清未读 + 上报后端，让对方 UI 立刻切到"已读"
          // 已读位置直接用刚到的消息 id（这条就是当前会话最大 id）
          conversationStore.markActiveAsRead()
          apiReadPrivateMessages(peerId, websocketMessage.id).catch((e) => {
            console.warn('[IM WS] 自动已读上报失败', e)
          })
        } else if (!conversation?.muted) {
          // 非当前会话且未免打扰：响一下提示音（带节流，详见 playAudioTip）
          playAudioTip()
        }
      }
    },

    /** 私聊 READ 事件：自己的其它终端在对方会话里标为已读，本端同步清零未读 */
    handlePrivateRead(websocketMessage: ImPrivateMessageDTO) {
      const conversationStore = useConversationStore()
      const conversation = conversationStore.getConversation(
        ImConversationType.PRIVATE,
        websocketMessage.receiverId
      )
      if (conversation) {
        conversation.unreadCount = 0
      }
      conversationStore.saveConversations()
    },

    /**
     * 私聊 RECEIPT 事件：对方读了我的消息，把和对方会话里自己发的消息标为已读
     * 后端将 maxReadId 编码在 DTO 的 id 字段（见 ImPrivateMessageDTO.ofReceipt），
     * 这里据此卡边界，避免把"回执在路上时刚发的消息"误标为已读。
     */
    handlePrivateReceipt(websocketMessage: ImPrivateMessageDTO) {
      if (!websocketMessage.id) {
        return
      }
      const conversationStore = useConversationStore()
      conversationStore.applyReadReceipt({
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
     * 3. 撤回 TIP 短路
     * 4. 构造 Message + at 字段，插入到对应群聊会话（发送人名渲染时实时算）
     * 5. 当前会话激活时自动上报已读（带 lastMessageId）；否则非免打扰响提示音
     */
    handleGroupMessage(websocketMessage: ImGroupMessageDTO) {
      const conversationStore = useConversationStore()
      // 1. 离线加载期缓冲（与私聊对称）
      if (conversationStore.loading) {
        this.messageBuffer.push({
          conversationType: ImConversationType.GROUP,
          payload: websocketMessage
        })
        return
      }
      const userStore = useUserStore()
      const groupStore = useGroupStore()
      const currentUserId = Number(userStore.getUser?.id) || 0
      const selfSend = websocketMessage.senderId === currentUserId

      // 2. 未知群时自动拉群详情 + 成员（被拉入群但还没收到 GROUP_CREATE 时的兜底）
      const group = groupStore.getGroup(websocketMessage.groupId)
      if (!group) {
        groupStore.fetchGroupInfo(websocketMessage.groupId).catch(() => undefined)
      }

      // 3. 后端撤回：下发一条 RECALL 消息，content 为 `{"messageId": xxx}`
      // 这里拦截下来改走 recallMessage（把原消息更新为 RECALL 态）
      if (websocketMessage.type === ImMessageType.RECALL) {
        conversationStore.recallMessage(
          ImConversationType.GROUP,
          websocketMessage.groupId,
          websocketMessage.content
        )
        return
      }

      // 4. 后端 DTO → 前端 Message：发送人名渲染时实时算，不写入消息字段
      const message = convertGroupMessage(websocketMessage, currentUserId)
      conversationStore.insertMessage(
        {
          type: ImConversationType.GROUP,
          targetId: websocketMessage.groupId,
          name: group?.name || String(websocketMessage.groupId),
          avatar: group?.avatar || ''
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
          // 群已读上报需要带 messageId（群消息以"读到第几条"的游标为准，区别于私聊只标 receiverId）
          conversationStore.markActiveAsRead()
          apiReadGroupMessages(websocketMessage.groupId, websocketMessage.id).catch((e) => {
            console.warn('[IM WS] 自动已读上报失败', e)
          })
        } else if (!conversation?.muted) {
          playAudioTip()
        }
      }
    },

    // ==================== 群聊已读 / 回执 ====================

    /** 群聊 READ：自己其它终端在某群里标为已读，本端同步清零该群未读 */
    handleGroupRead(websocketMessage: ImGroupMessageDTO) {
      const conversationStore = useConversationStore()
      const conversation = conversationStore.getConversation(
        ImConversationType.GROUP,
        websocketMessage.groupId
      )
      if (conversation) {
        conversation.unreadCount = 0
      }
      conversationStore.saveConversations()
    },

    /** 群聊 RECEIPT：更新某条群消息的 readCount / receiptStatus */
    handleGroupReceipt(websocketMessage: ImGroupMessageDTO) {
      const conversationStore = useConversationStore()
      conversationStore.applyReadReceipt({
        conversationType: ImConversationType.GROUP,
        targetId: websocketMessage.groupId,
        groupMessageId: websocketMessage.id,
        readCount: websocketMessage.readCount,
        receiptStatus: websocketMessage.receiptStatus
      })
    },

    // ==================== 好友关系事件（承载于私聊通道，按 inner type 分流） ====================

    /** FRIEND_ADD：后端推送给好友双方；本端拉取好友详情并入库，级联刷新私聊会话展示 */
    handleFriendAdd(websocketMessage: ImPrivateMessageDTO) {
      const friendStore = useFriendStore()
      // 后端 DTO 里只带 senderId/receiverId；收到这条时，对端 = 非自己的那一方
      const userStore = useUserStore()
      const selfId = Number(userStore.getUser?.id) || 0
      const friendUserId =
        websocketMessage.senderId === selfId
          ? websocketMessage.receiverId
          : websocketMessage.senderId
      friendStore.loadFriendInfo(friendUserId).catch(() => undefined)
    },

    /** FRIEND_DELETE：本端标记好友已删 + 级联清理私聊会话 */
    handleFriendDelete(websocketMessage: ImPrivateMessageDTO) {
      const friendStore = useFriendStore()
      const userStore = useUserStore()
      const selfId = Number(userStore.getUser?.id) || 0
      const friendUserId =
        websocketMessage.senderId === selfId
          ? websocketMessage.receiverId
          : websocketMessage.senderId
      friendStore.removeFriend(friendUserId)
    },

    /** FRIEND_UPDATE：多端同步好友属性变更（当前主要是免打扰）；重新拉取好友详情即可 */
    handleFriendUpdate(websocketMessage: ImPrivateMessageDTO) {
      const friendStore = useFriendStore()
      const userStore = useUserStore()
      const selfId = Number(userStore.getUser?.id) || 0
      const friendUserId =
        websocketMessage.senderId === selfId
          ? websocketMessage.receiverId
          : websocketMessage.senderId
      friendStore.loadFriendInfo(friendUserId).catch(() => undefined)
    },

    // ==================== 群关系事件（承载于群聊通道，按 inner type 分流） ====================

    /** GROUP_CREATE：本端入群（建群 / 被拉入）；拉取群详情入库 */
    handleGroupCreate(websocketMessage: ImGroupMessageDTO) {
      const groupStore = useGroupStore()
      groupStore.fetchGroupInfo(websocketMessage.groupId).catch(() => undefined)
    },

    /** GROUP_UPDATE：群信息变更，重新拉一次群详情 */
    handleGroupUpdate(websocketMessage: ImGroupMessageDTO) {
      const groupStore = useGroupStore()
      groupStore.fetchGroupInfo(websocketMessage.groupId).catch(() => undefined)
    },

    /** GROUP_DELETE：群解散 / 自己退群 / 被踢出；本端清除群 + 级联清理群聊会话 */
    handleGroupDelete(websocketMessage: ImGroupMessageDTO) {
      const groupStore = useGroupStore()
      groupStore.removeGroup(websocketMessage.groupId)
    },

    /**
     * GROUP_MEMBER_UPDATE：多端同步成员属性变更（昵称 / 免打扰 / 退群等）
     *
     * 必须强刷成员而非群元数据——这些字段都在 ImGroupMemberRespVO 上，apiGetMyGroupList 不带；
     * 持久化后若不强刷，IDB 成员桶会长期陈旧
     */
    handleGroupMemberUpdate(websocketMessage: ImGroupMessageDTO) {
      const groupStore = useGroupStore()
      groupStore.fetchGroupMembers(websocketMessage.groupId, true).catch(() => undefined)
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
        // 主动关闭路径必须先解绑这两个 handler，否则 3 秒后会自动连回去
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
    },

    /** 自动重连，3 秒后再试（onclose / onerror 都会进来，靠 reconnectTimer 自身防重） */
    reconnect() {
      this.stopHeartbeat()
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
      }
      this.reconnectTimer = setTimeout(() => {
        console.log('[IM WS] reconnecting...')
        this.connect()
      }, 3000)
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
