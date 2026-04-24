import { defineStore } from 'pinia'
import { store } from '@/store'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

import {
  ImConversationType,
  ImMessageType,
  ImMessageStatus,
  TIME_TIP_GAP_MS
} from '../../utils/constants'
import { StorageKeys } from '../../utils/storage'
import { parseMessage, buildRecallTip, type TextMessage } from '../../utils/message'
import type { Conversation, Message, ConversationsData } from '../types'

const AT_ALL_FLAG = -1 // @全体成员 的特殊 userId 标识：atUserIds 中包含 -1 表示 @all

/** 获取当前登录用户编号 */
function getCurrentUserId(): number {
  const { wsCache } = useCache()
  const user = wsCache.get(CACHE_KEY.USER)?.user
  return Number(user?.id) || 0
}

/** 当前登录用户的会话列表 localStorage key */
function currentConversationsKey(): string {
  return StorageKeys.conversations(getCurrentUserId())
}

export const useConversationStore = defineStore('imConversationStore', {
  state: () => ({
    conversations: [] as Conversation[], // 全量会话列表（私聊 + 群聊）
    activeConversation: null as Conversation | null, // 当前激活的会话
    privateMessageMaxId: 0, // 私聊最大消息 id，作为 pull 的游标
    groupMessageMaxId: 0, // 群聊最大消息 id，作为 pull 的游标
    loading: false // 是否正在批量加载（例如离线消息拉取期间），避免频繁写 localStorage
  }),

  getters: {
    /**
     * 会话列表排序规则：
     * 1. 置顶优先（top=true 的在前）
     * 2. 同级别按 lastSendTime 降序
     */
    sortedConversations(state): Conversation[] {
      return [...state.conversations]
        .filter((c) => !c.deleted)
        .sort((a, b) => {
          const aTop = a.top ? 1 : 0
          const bTop = b.top ? 1 : 0
          if (aTop !== bTop) {
            return bTop - aTop
          }
          return b.lastSendTime - a.lastSendTime
        })
    },
    /** 当前会话的消息列表 */
    activeMessages(state): Message[] {
      return state.activeConversation?.messages || []
    },
    /** 未读总数（免打扰会话不计入）—— 用于 ToolBar 红点 */
    totalUnread(state): number {
      return state.conversations
        .filter((c) => !c.deleted && !c.muted)
        .reduce((sum, c) => sum + (c.unreadCount || 0), 0)
    }
  },

  actions: {
    // ==================== 本地存储 ====================

    /** 从 localStorage 恢复会话数据 */
    loadConversations() {
      const item = localStorage.getItem(currentConversationsKey())
      if (!item) {
        return
      }

      try {
        // 反序列化缓存数据，恢复消息游标（privateMessageMaxId / groupMessageMaxId）
        const storageData = JSON.parse(item) as ConversationsData
        this.privateMessageMaxId = Number(storageData.privateMessageMaxId) || 0
        this.groupMessageMaxId = Number(storageData.groupMessageMaxId) || 0

        // 回放会话列表，同时修正重启前遗留的"发送中"状态
        if (storageData.conversations && storageData.conversations.length > 0) {
          for (const conversation of storageData.conversations) {
            if (conversation.messages) {
              conversation.messages.forEach((message) => {
                // 发送中状态的消息标记为失败：重启后不可能仍处在发送中
                if (message.status === ImMessageStatus.SENDING) {
                  message.status = ImMessageStatus.FAILED
                }
              })
            }
          }
          this.conversations = storageData.conversations
        }
      } catch (e) {
        console.error('[IM] 本地消息缓存读取失败', e)
      }
    },

    /** 持久化到 localStorage */
    saveToStorage() {
      // loading 期间跳过，避免大量写入阻塞主线程
      if (this.loading) {
        return
      }

      // TODO @AI：这个方案，可能存不下太多数据，需要调整！
      const storageData: ConversationsData = {
        privateMessageMaxId: this.privateMessageMaxId,
        groupMessageMaxId: this.groupMessageMaxId,
        conversations: this.conversations.filter((c) => !c.deleted)
      }
      try {
        localStorage.setItem(currentConversationsKey(), JSON.stringify(storageData))
      } catch (e) {
        console.error('[IM] 本地消息缓存存储失败', e)
      }
    },

    // ==================== 会话查找 / 打开 ====================

    /** 查找会话：按 (type, targetId) 组合主键 */
    findConversation(type: number, targetId: number): Conversation | undefined {
      return this.conversations.find((c) => c.type === type && c.targetId === targetId)
    },

    /**
     * 打开或创建一个会话，并设为激活
     *
     * 调用方应该把从 friendStore / groupStore 拿到的最新元数据（muted 等）
     * 通过 options 传进来，避免新建/复用的会话显示陈旧状态。
     * 此处不在 conversationStore 里反向 import friendStore/groupStore，是为了避免循环依赖。
     */
    openConversation(
      targetId: number,
      type: number,
      showName: string,
      showImage: string,
      options?: { muted?: boolean }
    ): Conversation {
      // 按 (type, targetId) 查找已有会话，不存在则新建并插到列表头部
      let conversation = this.findConversation(type, targetId)
      if (!conversation) {
        conversation = this.createEmptyConversation(type, targetId, showName, showImage)
        if (options?.muted !== undefined) {
          conversation.muted = options.muted
        }
        this.conversations.unshift(conversation)
      } else {
        // 已存在会话：用最新元数据刷新 showName / showImage / muted
        if (showName) {
          conversation.showName = showName
        }
        if (showImage) {
          conversation.showImage = showImage
        }
        if (options?.muted !== undefined) {
          conversation.muted = options.muted
        }
      }
      this.setActiveConversation(conversation)
      return conversation
    },

    /** 设置当前会话，同时清零未读数 + 清除 @ 标记 */
    setActiveConversation(conversation: Conversation | null) {
      this.activeConversation = conversation
      if (conversation) {
        conversation.unreadCount = 0
        conversation.atMe = false
        conversation.atAll = false
        this.saveToStorage()
      }
    },

    /** 创建空会话（抽取公共逻辑，供 insertMessage / openConversation 复用） */
    createEmptyConversation(type: number, targetId: number, showName: string, showImage: string): Conversation {
      return {
        targetId,
        type,
        showName,
        showImage,
        lastContent: '',
        lastSendTime: 0,
        unreadCount: 0,
        messages: [],
        deleted: false,
        top: false,
        muted: false,
        atMe: false,
        atAll: false,
        senderNickName: '',
        lastTimeTip: 0
      }
    },

    // ==================== 置顶 / 免打扰 / 删除会话 ====================

    /** 将某个会话置顶态切换 */
    setTop(type: number, targetId: number, top: boolean) {
      const conversation = this.findConversation(type, targetId)
      if (!conversation) {
        return
      }
      conversation.top = top
      this.saveToStorage()
    },

    /** 设置会话免打扰（本地状态；后端同步由 friendStore / groupStore + /muted API 负责） */
    setMuted(type: number, targetId: number, muted: boolean) {
      const conversation = this.findConversation(type, targetId)
      if (!conversation) {
        return
      }
      conversation.muted = muted
      this.saveToStorage()
    },

    /** 删除会话（软删：标记 deleted=true，持久化时过滤）*/
    removeConversation(type: number, targetId: number) {
      const conversation = this.findConversation(type, targetId)
      if (!conversation) {
        return
      }
      if (this.activeConversation === conversation) {
        this.activeConversation = null
      }
      conversation.deleted = true
      this.saveToStorage()
    },

    removePrivateConversation(friendId: number) {
      this.removeConversation(ImConversationType.PRIVATE, friendId)
    },

    removeGroupConversation(groupId: number) {
      this.removeConversation(ImConversationType.GROUP, groupId)
    },

    // ==================== 消息插入 / 更新 ====================

    /**
     * 插入消息到会话
     *
     * 主要行为（子步骤见函数内 // x.y 注释）：
     * 1. 会话定位：查找或创建 + 去重合并
     * 2. 更新会话元数据：摘要、@ 标记、未读数
     * 3. 插入消息：时间分隔线 + 按 id 有序插入
     * 4. 收尾：更新游标 + 持久化
     */
    insertMessage(
      conversationInfo: { type: number; targetId: number; showName: string; showImage: string },
      messageInfo: Message
    ) {
      // 1.1 查找或自动创建会话
      let conversation = this.findConversation(conversationInfo.type, conversationInfo.targetId)
      if (!conversation) {
        conversation = this.createEmptyConversation(
          conversationInfo.type,
          conversationInfo.targetId,
          conversationInfo.showName,
          conversationInfo.showImage
        )
        this.conversations.unshift(conversation)
      }

      // 1.2 去重合并：优先按 id，其次按 clientMessageId。命中则覆盖更新并返回
      const existingIndex = conversation.messages.findIndex((message) => {
        if (messageInfo.id && message.id && message.id === messageInfo.id) {
          return true
        }
        return !!(messageInfo.clientMessageId && message.clientMessageId && message.clientMessageId === messageInfo.clientMessageId)
      })
      if (existingIndex >= 0) {
        // 覆盖更新，保留本地已有但服务端未带的字段（如 senderNickName）
        conversation.messages[existingIndex] = { ...conversation.messages[existingIndex], ...messageInfo }
        conversation.lastSendTime = messageInfo.sendTime || conversation.lastSendTime
        this.updateMaxId(conversationInfo.type, messageInfo.id)
        this.saveToStorage()
        return
      }

      // 2.1 更新会话摘要（lastContent / lastSendTime / senderNickName）
      conversation.lastContent = this.resolveLastContent(messageInfo)
      conversation.lastSendTime = messageInfo.sendTime || Date.now()
      conversation.senderNickName = messageInfo.senderNickName || ''

      // 2.2 群聊 @ 标记（仅对方消息 + 未读态有效）
      if (
        !messageInfo.selfSend &&
        conversation.type === ImConversationType.GROUP &&
        messageInfo.atUserIds &&
        messageInfo.atUserIds.length > 0 &&
        messageInfo.status !== ImMessageStatus.READ
      ) {
        const currentUserId = getCurrentUserId()
        if (currentUserId && messageInfo.atUserIds.includes(currentUserId)) {
          conversation.atMe = true
        }
        if (messageInfo.atUserIds.includes(AT_ALL_FLAG)) {
          conversation.atAll = true
        }
      }

      // 2.3 未读数：非当前会话 + 非自己发送 + 非系统 tip + 非已读 => +1
      const isActive =
        this.activeConversation?.type === conversationInfo.type &&
        this.activeConversation?.targetId === conversationInfo.targetId
      const isTipMessage =
        messageInfo.type === ImMessageType.TIP_TEXT || messageInfo.type === ImMessageType.TIP_TIME
      if (
        !messageInfo.selfSend &&
        !isActive &&
        !isTipMessage &&
        messageInfo.status !== ImMessageStatus.READ &&
        messageInfo.status !== ImMessageStatus.RECALL
      ) {
        conversation.unreadCount++
      }

      // 3.1 时间分隔线：距上条 TIP_TIME 超过 10 分钟则插入一条
      const sendTime = messageInfo.sendTime || Date.now()
      if (!conversation.lastTimeTip || conversation.lastTimeTip < sendTime - TIME_TIP_GAP_MS) {
        conversation.messages.push({
          id: 0,
          clientMessageId: `tip-${sendTime}`,
          type: ImMessageType.TIP_TIME,
          content: '',
          status: ImMessageStatus.UNREAD,
          sendTime,
          senderId: 0,
          senderNickName: '',
          targetId: conversationInfo.targetId,
          selfSend: false
        })
        conversation.lastTimeTip = sendTime
      }

      // 3.2 根据 id 插入到正确位置（防止乱序）；tip 消息 / 本地临时消息直接追加末尾
      let insertIndex = conversation.messages.length
      if (messageInfo.id) {
        for (let index = 0; index < conversation.messages.length; index++) {
          const existing = conversation.messages[index]
          // TIP_TIME 没有 id，不参与排序
          if (existing.type === ImMessageType.TIP_TIME) {
            continue
          }
          if (existing.id && messageInfo.id < existing.id) {
            insertIndex = index
            break
          }
        }
      }
      conversation.messages.splice(insertIndex, 0, messageInfo)

      // 4.1 更新游标
      this.updateMaxId(conversationInfo.type, messageInfo.id)

      // 4.2 持久化到 localStorage
      this.saveToStorage()
    },

    /** 根据消息类型计算会话列表最后一条摘要 */
    resolveLastContent(messageInfo: Message): string {
      switch (messageInfo.type) {
        case ImMessageType.IMAGE:
          return '[图片]'
        case ImMessageType.FILE:
          return '[文件]'
        case ImMessageType.VOICE:
          return '[语音]'
        case ImMessageType.VIDEO:
          return '[视频]'
        case ImMessageType.RECALL:
          return buildRecallTip(messageInfo.senderNickName, messageInfo.selfSend)
        case ImMessageType.TEXT:
        case ImMessageType.TIP_TEXT:
          return parseMessage<TextMessage>(messageInfo.content)?.content ?? ''
        default:
          return parseMessage<TextMessage>(messageInfo.content)?.content ?? ''
      }
    },

    /**
     * 根据 clientMessageId 更新消息状态
     *
     * 乐观更新回填：本地先以 SENDING 状态插入临时消息（id=0 + clientMessageId），
     * 待服务端返回后再用此方法回填真实 id、sendTime、status 等字段。
     */
    updateMessageState(
      conversationType: number,
      targetId: number,
      clientMessageId: string,
      updates: Partial<Message>
    ) {
      const conversation = this.findConversation(conversationType, targetId)
      if (!conversation) {
        return
      }
      const message = conversation.messages.find((item) => item.clientMessageId === clientMessageId)
      if (!message) {
        return
      }
      Object.assign(message, updates)
      if (updates.id) {
        this.updateMaxId(conversationType, updates.id)
      }
      this.saveToStorage()
    },

    /**
     * 撤回消息：将原消息 type 改为 RECALL，并刷新会话摘要
     * 对应后端 RECALL 事件：按原 messageId 更新
     */
    applyRecall(
      conversationType: number,
      targetId: number,
      messageId: number,
      senderNickName: string,
      selfSend: boolean
    ) {
      const conversation = this.findConversation(conversationType, targetId)
      if (!conversation) {
        return
      }
      const message = conversation.messages.find((item) => item.id === messageId)
      if (!message) {
        return
      }
      message.type = ImMessageType.RECALL
      message.status = ImMessageStatus.RECALL
      message.content = JSON.stringify({
        content: buildRecallTip(senderNickName, selfSend)
      })
      // 最后一条消息是刚撤回的，才更新会话摘要
      if (conversation.messages[conversation.messages.length - 1]?.id === messageId) {
        conversation.lastContent = buildRecallTip(senderNickName, selfSend)
      }
      this.saveToStorage()
    },

    /** 处理对方已读 / 群回执：更新发送方自己消息的 status / readCount / receiptStatus */
    applyReadReceipt(options: {
      conversationType: number
      targetId: number
      // 私聊：把和该好友的「自己发送的」消息标为已读
      markPrivateRead?: boolean
      // 群聊：针对单条消息的回执刷新
      groupMessageId?: number
      readCount?: number
      receiptStatus?: number
    }) {
      const conversation = this.findConversation(options.conversationType, options.targetId)
      if (!conversation) {
        return
      }
      if (options.conversationType === ImConversationType.PRIVATE && options.markPrivateRead) {
        conversation.messages.forEach((message) => {
          if (message.selfSend && message.status !== ImMessageStatus.RECALL) {
            message.status = ImMessageStatus.READ
          }
        })
      } else if (options.conversationType === ImConversationType.GROUP && options.groupMessageId) {
        const message = conversation.messages.find((item) => item.id === options.groupMessageId)
        if (message) {
          if (options.readCount !== undefined) {
            message.readCount = options.readCount
          }
          if (options.receiptStatus !== undefined) {
            message.receiptStatus = options.receiptStatus
          }
        }
      }
      this.saveToStorage()
    },

    /**
     * 从本地消息列表移除一条消息（右键"删除"；不同步后端）
     * 按 id 优先匹配；若 id 为 0（本地发送中），则按 clientMessageId 匹配
     */
    removeLocalMessage(
      conversationType: number,
      targetId: number,
      key: { id?: number; clientMessageId?: string }
    ) {
      const conversation = this.findConversation(conversationType, targetId)
      if (!conversation) {
        return
      }
      const index = conversation.messages.findIndex((message) => {
        if (key.id && message.id && message.id === key.id) {
          return true
        }
        return !!(key.clientMessageId && message.clientMessageId && message.clientMessageId === key.clientMessageId)
      })
      if (index < 0) {
        return
      }
      conversation.messages.splice(index, 1)
      // 如果删的是最后一条，刷新摘要
      if (index === conversation.messages.length) {
        const last = conversation.messages[conversation.messages.length - 1]
        conversation.lastContent = last ? this.resolveLastContent(last) : ''
        conversation.lastSendTime = last?.sendTime || conversation.lastSendTime
        conversation.senderNickName = last?.senderNickName || ''
      }
      this.saveToStorage()
    },

    /**
     * 当前会话全部标记为已读（切换会话 / 手动触发）
     * 只处理「对方发来的、尚未读」的消息
     */
    markActiveAsRead() {
      if (!this.activeConversation) {
        return
      }
      this.activeConversation.unreadCount = 0
      this.activeConversation.atMe = false
      this.activeConversation.atAll = false
      this.activeConversation.messages.forEach((message) => {
        if (!message.selfSend && message.status === ImMessageStatus.UNREAD) {
          message.status = ImMessageStatus.READ
        }
      })
      this.saveToStorage()
    },

    /** 更新 privateMessageMaxId / groupMessageMaxId 游标 */
    updateMaxId(conversationType: number, messageId?: number) {
      if (!messageId) {
        return
      }
      if (conversationType === ImConversationType.PRIVATE) {
        if (messageId > this.privateMessageMaxId) {
          this.privateMessageMaxId = messageId
        }
      } else if (conversationType === ImConversationType.GROUP) {
        if (messageId > this.groupMessageMaxId) {
          this.groupMessageMaxId = messageId
        }
      }
    },

    /** 离线消息加载完后重排：按 lastSendTime 倒序并持久化 */
    refreshConversations() {
      this.conversations.sort((a, b) => b.lastSendTime - a.lastSendTime)
      this.saveToStorage()
    },

    /** 根据 friendStore 最新的好友信息同步对应私聊会话的展示名 / 头像 / 免打扰 */
    updateConversationFromFriend(friendId: number, info: { nickName?: string; showImage?: string; muted?: boolean }) {
      const conversation = this.findConversation(ImConversationType.PRIVATE, friendId)
      if (!conversation) {
        return
      }
      let changed = false
      if (info.nickName && conversation.showName !== info.nickName) {
        conversation.showName = info.nickName
        changed = true
      }
      if (info.showImage !== undefined && conversation.showImage !== info.showImage) {
        conversation.showImage = info.showImage || ''
        changed = true
      }
      if (info.muted !== undefined && conversation.muted !== info.muted) {
        conversation.muted = info.muted
        changed = true
      }
      if (changed) {
        this.saveToStorage()
      }
    },

    /** 根据 groupStore 最新的群信息同步对应群聊会话的展示名 / 头像 / 免打扰 */
    updateConversationFromGroup(groupId: number, info: { name?: string; showImage?: string; muted?: boolean }) {
      const conversation = this.findConversation(ImConversationType.GROUP, groupId)
      if (!conversation) {
        return
      }
      let changed = false
      if (info.name && conversation.showName !== info.name) {
        conversation.showName = info.name
        changed = true
      }
      if (info.showImage !== undefined && conversation.showImage !== info.showImage) {
        conversation.showImage = info.showImage || ''
        changed = true
      }
      if (info.muted !== undefined && conversation.muted !== info.muted) {
        conversation.muted = info.muted
        changed = true
      }
      if (changed) {
        this.saveToStorage()
      }
    }
  }
})

export const useConversationStoreWithOut = () => {
  return useConversationStore(store)
}
