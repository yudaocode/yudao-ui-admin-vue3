import { defineStore, acceptHMRUpdate } from 'pinia'
import { toRaw } from 'vue'
import { store } from '@/store'

import {
  ImConversationType,
  ImMessageType,
  ImMessageStatus,
  IM_AT_ALL_USER_ID,
  isGroupNotification,
  isMediaMessageType,
  isNormalMessage
} from '../../utils/constants'
import { CONVERSATION_RECENT_FORWARD_MAX } from '../../utils/config'
import { getCurrentUserId, imStorage, removeQuietly, StorageKeys } from '../../utils/storage'
import { parseRecallMessageId, revokeBlobUrlsInContent } from '../../utils/message'
import { resolveConversationLastContent } from '../../utils/conversation'
import { tryGetSenderDisplayName } from '../../utils/user'
import { useGroupStore } from './groupStore'
import { useDraftStore } from './draftStore'
import type { Conversation, ConversationStoreMeta, Message } from '../types'

// TODO @芋艿：单个 conversation 的消息过多后，可能存储起来会很慢，后续看看怎么优化。
// TODO @芋艿：首次拉取消息时，如果消息过多，可能导致渲染卡顿。（1% 场景）

/**
 * 算出新一条 lastSenderDisplayName 快照——caller 拿这个值去赋 conversation.lastSenderDisplayName
 *
 * 1. 能算出真名 → 用真名
 * 2. 算不出 + 同发送人 → 沿用旧快照（冷拉期间常见）
 * 3. 算不出 + 换发送人 → undefined（旧快照不再适用）
 *
 * 群聊算不出真名时顺手触发兜底拉成员（store 内部已并发去重），让后续渲染能命中真名
 */
function deriveLastSenderDisplayName(
  conversation: Conversation,
  senderId: number
): string | undefined {
  // 1. 严格版算名字：能拿到 displayUserName / 备注 / 真实昵称就直接用，对应规则 1
  const liveSenderName = tryGetSenderDisplayName(senderId, conversation.type, conversation.targetId)
  if (liveSenderName) {
    return liveSenderName
  }

  // 2. 群聊兜底拉成员：分两种情况
  //    a. members 完全没加载（!membersLoaded）→ 拉整群（pullOnce 期间多个 senderId 都缺时，单飞表会 dedup 成一次请求）
  //    b. members 已加载但缺这一个（新加入的成员，本端未收到 GROUP_MEMBER_SETTING_UPDATE）→ 补齐这一个
  if (conversation.type === ImConversationType.GROUP) {
    const groupStore = useGroupStore()
    const group = groupStore.getGroup(conversation.targetId)
    const fetchPromise = group?.membersLoaded
      ? groupStore.fetchGroupMember(conversation.targetId, senderId)
      : groupStore.fetchGroupMembers(conversation.targetId)
    fetchPromise.catch((e) =>
      console.warn(
        '[IM conversationStore] 兜底拉群成员失败',
        { groupId: conversation.targetId, senderId, fullFetch: !group?.membersLoaded },
        e
      )
    )
  }

  // 3. 算不出真名：同发送人沿用旧快照（规则 2），换人则清掉避免显示成上一个人（规则 3）
  const isSameSender = conversation.lastSenderId === senderId
  return isSameSender ? conversation.lastSenderDisplayName : undefined
}

/**
 * 按 conversation.messages 末尾重算 last* 系列摘要 / 事实索引
 *
 * 用于：删除最后一条消息 / loadConversations drop 媒体占位后；剩余消息为空则字段一并清空（含 lastSendTime=0），让空会话排到列表末尾。
 * 末条消息存在时，lastSendTime 取该消息的 sendTime；缺失时沿用 conversation 现值
 */
function recomputeConversationLast(conversation: Conversation): void {
  const last = conversation.messages[conversation.messages.length - 1]
  if (last) {
    const senderDisplayName = deriveLastSenderDisplayName(conversation, last.senderId)
    conversation.lastContent = resolveConversationLastContent(
      last,
      conversation.type,
      conversation.targetId,
      senderDisplayName
    )
    conversation.lastSendTime = last.sendTime || conversation.lastSendTime
    conversation.lastSenderId = last.senderId
    conversation.lastMessageType = last.type
    conversation.lastSelfSend = last.selfSend
    conversation.lastSenderDisplayName = senderDisplayName
  } else {
    conversation.lastContent = ''
    conversation.lastSenderId = undefined
    conversation.lastMessageType = undefined
    conversation.lastSelfSend = undefined
    conversation.lastSenderDisplayName = undefined
    // 排序时间也要清，否则空会话仍按旧 lastSendTime 排在前面（刷新后媒体占位被 drop 时容易踩到）
    conversation.lastSendTime = 0
  }
}

/**
 * 群聊未读消息把 @ 标记同步到会话；非群聊 / 自己发的 / 已读 / 没 @ 全跳过
 *
 * 同时被新消息插入路径和合并末尾消息路径调用，让 pull 拿到不完整 atUserIds 后 WS 补齐的场景，
 * 也能正确点亮 conversation.atMe / atAll 红字徽标
 */
function syncConversationAtFlags(conversation: Conversation, message: Message): void {
  if (
    message.selfSend ||
    conversation.type !== ImConversationType.GROUP ||
    !message.atUserIds ||
    message.atUserIds.length === 0 ||
    message.status === ImMessageStatus.READ
  ) {
    return
  }
  const currentUserId = getCurrentUserId()
  if (currentUserId && message.atUserIds.includes(currentUserId)) {
    conversation.atMe = true
  }
  if (message.atUserIds.includes(IM_AT_ALL_USER_ID)) {
    conversation.atAll = true
  }
}

/**
 * 把服务端字段（REST ack / WS 推送 / pull 回填）合并到本地消息
 *
 * - content 被替换时 revoke 旧 blob URL（媒体占位转真实 url 释放 File 内存）
 * - 状态离开 SENDING 后清 uploadProgress（让 isUploading 不再命中、进度遮罩消失）
 * - 状态非 FAILED 终态再清 _localFile（FAILED 留着供重试 uploadAndSendMedia）
 *
 * 同时被 ackMessage / insertMessage(existingIndex 覆盖路径) 使用，确保 REST / WS 两路都做相同清理
 */
function applyServerMessageUpdate(message: Message, updates: Partial<Message>): void {
  if (updates.content && updates.content !== message.content) {
    revokeBlobUrlsInContent(message.content)
  }
  Object.assign(message, updates)
  if (updates.status !== undefined && updates.status !== ImMessageStatus.SENDING) {
    message.uploadProgress = undefined
    if (updates.status !== ImMessageStatus.FAILED) {
      message._localFile = undefined
    }
  }
}

export const useConversationStore = defineStore('imConversationStore', {
  state: () => ({
    conversations: [] as Conversation[], // 全量会话列表（私聊 + 群聊）
    activeConversation: null as Conversation | null, // 当前激活的会话
    privateMessageMaxId: 0, // 私聊最大消息 id，作为 pull 的游标
    groupMessageMaxId: 0, // 群聊最大消息 id，作为 pull 的游标
    channelMessageMaxId: 0, // 频道最大消息 id，作为 pull 的游标
    loading: false, // 是否正在批量加载（例如离线消息拉取期间），避免频繁写存储
    recentForwardConversationKeys: [] as string[] // 最近转发会话 key 列表（按推送顺序倒序，最大 CONVERSATION_RECENT_FORWARD_MAX 个）
  }),

  getters: {
    /**
     * 会话列表排序规则：
     * 1. 置顶优先（top=true 的在前）
     * 2. 同级别按 lastSendTime 降序
     */
    getSortedConversations(state): Conversation[] {
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
    getActiveMessages(state): Message[] {
      return state.activeConversation?.messages || []
    },
    /** 未读总数（免打扰会话不计入）—— 用于 ToolBar 红点 */
    getTotalUnread(state): number {
      return state.conversations
        .filter((c) => !c.deleted && !c.silent)
        .reduce((sum, c) => sum + (c.unreadCount || 0), 0)
    },
    /** 查找会话：按 (type, targetId) 组合主键 */
    getConversation:
      (state) =>
      (type: number, targetId: number): Conversation | undefined => {
        return state.conversations.find((c) => c.type === type && c.targetId === targetId)
      }
  },

  actions: {
    // ==================== 本地存储 ====================

    /**
     * 从 IndexedDB 恢复会话数据
     *
     * 1. 读 meta（游标 + 会话索引），无 meta 直接返回
     * 2. 并发读取每个会话的消息 key，组装回 Conversation
     * 3. 修正重启前遗留的"发送中"状态为失败
     */
    async loadConversations() {
      const userId = getCurrentUserId()
      if (!userId) {
        return
      }
      try {
        // 顺手把最近转发列表也恢复出来；和 meta 并发读
        const [meta, recent] = await Promise.all([
          imStorage.getItem<ConversationStoreMeta>(StorageKeys.conversationMeta(userId)),
          imStorage.getItem<string[]>(StorageKeys.recentForwardConversationKeys(userId))
        ])
        // 缺数据时显式赋空，避免切账号后沿用上一个用户的内存列表
        this.recentForwardConversationKeys = Array.isArray(recent)
          ? recent.slice(0, CONVERSATION_RECENT_FORWARD_MAX)
          : []
        if (!meta) {
          return
        }
        this.privateMessageMaxId = Number(meta.privateMessageMaxId) || 0
        this.groupMessageMaxId = Number(meta.groupMessageMaxId) || 0
        this.channelMessageMaxId = Number((meta as any).channelMessageMaxId) || 0
        if (!meta.conversations || meta.conversations.length === 0) {
          return
        }

        // 并发拉取每个会话的消息，组装回完整 Conversation；
        // 单会话失败时退化为空消息列表 + 打印日志，避免拖垮整体加载
        const tasks = meta.conversations.map(async (conversation): Promise<Conversation> => {
          try {
            const rawMessages =
              (await imStorage.getItem<Message[]>(
                StorageKeys.conversationMessages(userId, conversation.type, conversation.targetId)
              )) || []
            // 【媒体消息】（IMAGE / FILE / VOICE / VIDEO）SENDING 或 FAILED 都直接 drop：
            //            _localFile 持久化时已被剥掉，刷新后重传必拿不到 file，content 里又可能是失效的 blob URL，留着只会让用户点重试时把 blob URL 当真实 url 发到服务端
            // 【文本类】SENDING 转 FAILED 仍可重发（content 里就是 plain text）
            const messages = rawMessages.filter((message) => {
              const isMedia = isMediaMessageType(message.type)
              if (message.status === ImMessageStatus.SENDING) {
                if (isMedia) {
                  return false
                }
                message.status = ImMessageStatus.FAILED
                return true
              }
              return !(message.status === ImMessageStatus.FAILED && isMedia)
            })
            const restored: Conversation = { ...conversation, messages }
            // 媒体占位被 drop 时，conversation 旧 lastContent / lastSendTime 等仍指向已不存在的占位，
            //                   按剩余消息末尾重算，避免会话列表显示一条摘要、消息面板里却没对应消息
            if (messages.length !== rawMessages.length) {
              recomputeConversationLast(restored)
            }
            return restored
          } catch (e) {
            console.warn(
              '[IM] 单会话消息加载失败',
              { type: conversation.type, targetId: conversation.targetId },
              e
            )
            return { ...conversation, messages: [] }
          }
        })
        this.conversations = await Promise.all(tasks)
      } catch (e) {
        console.error('[IM] 本地消息缓存读取失败', e)
      }
    },

    /**
     * 持久化到 IndexedDB（fire-and-forget；调用方无需 await）
     *
     * - 不传 target：仅写 meta（适用于 top / silent / unread 等元数据变更）
     * - 传单个 conversation：写 meta + 该会话的消息（单条消息变更走这里）
     * - 传数组：写 meta + 数组里所有未删除会话的消息（loading 完成后兜底 flush 用）
     *
     * 按会话分桶后，单条消息变更只重写当前会话的消息 key，避免老方案的全量序列化；写入失败已在内部 catch 兜底（仅打印日志）不影响 UI 流程，所以接口签名设为 void
     */
    saveConversations(target?: Conversation | Conversation[] | null): void {
      // loading 期间跳过，避免离线消息批量到达时的密集写入
      if (this.loading) {
        return
      }
      const userId = getCurrentUserId()
      if (!userId) {
        return
      }
      // 1. meta：游标 + 会话索引（剔除 messages，过滤软删除）
      const meta: ConversationStoreMeta = {
        privateMessageMaxId: this.privateMessageMaxId,
        groupMessageMaxId: this.groupMessageMaxId,
        channelMessageMaxId: this.channelMessageMaxId,
        conversations: this.conversations
          .filter((c) => !c.deleted)
          .map(({ messages, ...rest }) => rest)
      } as ConversationStoreMeta
      const tasks: Promise<unknown>[] = [
        imStorage.setItem(StorageKeys.conversationMeta(userId), meta)
      ]
      // 2. 归一化 target 为待 flush 的会话列表，过滤掉已软删除的
      const conversationsToFlush: Conversation[] = (
        Array.isArray(target) ? target : target ? [target] : []
      ).filter((c) => !c.deleted)
      for (const conversation of conversationsToFlush) {
        // ① toRaw 拆掉 Vue reactive Proxy：IDB 的 structuredClone 不接受 Proxy，不拆会抛 DataCloneError 静默落盘失败（只 meta 写得进去，messages 永远丢）
        // ② 剥 _localFile：IDB 能 structuredClone File 对象，但视频几百 MB 落盘没意义；
        //    fast path：先扫一眼整条链路有无 _localFile，没有就直接 toRaw —— 绝大部分会话不会同时有上传中的媒体，每次 ack 都全量 map+spread 浪费
        const rawMessages = toRaw(conversation.messages)
        const hasLocalFile = rawMessages.some((message) => message._localFile != null)
        const messagesForFlush = hasLocalFile
          ? rawMessages.map((message) => {
              if (message._localFile == null) {
                return message
              }
              const { _localFile: _omitted, ...rest } = message
              return rest
            })
          : rawMessages
        tasks.push(
          imStorage.setItem(
            StorageKeys.conversationMessages(userId, conversation.type, conversation.targetId),
            messagesForFlush
          )
        )
      }
      // 3. fire-and-forget：失败仅打日志，不影响 UI
      void Promise.all(tasks).catch((e) => console.error('[IM] 本地消息缓存存储失败', e))
    },

    /** 物理删除某个会话的消息 key（软删除会话时释放空间；fire-and-forget） */
    removeConversationMessages(type: number, targetId: number): void {
      const userId = getCurrentUserId()
      if (!userId) {
        return
      }
      removeQuietly(
        StorageKeys.conversationMessages(userId, type, targetId),
        '[IM] 本地消息缓存删除失败'
      )
    },

    // ==================== 会话查找 / 打开 ====================

    /**
     * 打开或创建一个会话，并设为激活
     *
     * 调用方应该把从 friendStore / groupStore 拿到的最新元数据（silent 等）
     * 通过 options 传进来，避免新建/复用的会话显示陈旧状态。
     * 此处不在 conversationStore 里反向 import friendStore/groupStore，是为了避免循环依赖。
     */
    openConversation(
      targetId: number,
      type: number,
      name: string,
      avatar: string,
      options?: { silent?: boolean }
    ): Conversation {
      // 按 (type, targetId) 查找已有会话，不存在则新建并插到列表头部
      let conversation = this.getConversation(type, targetId)
      if (!conversation) {
        conversation = this.createEmptyConversation(type, targetId, name, avatar)
        if (options?.silent !== undefined) {
          conversation.silent = options.silent
        }
        this.conversations.unshift(conversation)
      } else {
        // 已存在会话：用最新元数据刷新 name / avatar / silent
        if (name) {
          conversation.name = name
        }
        if (avatar) {
          conversation.avatar = avatar
        }
        if (options?.silent !== undefined) {
          conversation.silent = options.silent
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
        // 仅元数据变更（unreadCount / atMe / atAll），不动 messages
        this.saveConversations()
      }
    },

    /** 创建空会话（抽取公共逻辑，供 insertMessage / openConversation 复用）；调用方传 silent 时按 friend / group store 的值落地，未传保持默认 false */
    createEmptyConversation(
      type: number,
      targetId: number,
      name: string,
      avatar: string,
      silent: boolean = false
    ): Conversation {
      return {
        targetId,
        type,
        name,
        avatar,
        lastContent: '',
        lastSendTime: 0,
        unreadCount: 0,
        messages: [],
        deleted: false,
        top: false,
        silent,
        atMe: false,
        atAll: false
      }
    },

    // ==================== 置顶 / 免打扰 / 删除会话 ====================

    /** 将某个会话置顶态切换 */
    setTop(type: number, targetId: number, top: boolean) {
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      conversation.top = top
      this.saveConversations()
    },

    /** 设置会话免打扰（本地状态；后端同步由 friendStore / groupStore + /silent API 负责） */
    setSilent(type: number, targetId: number, silent: boolean) {
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      conversation.silent = silent
      this.saveConversations()
    },

    /** 删除会话（软删：标记 deleted=true，持久化时过滤；同步物理删除消息 key 释放空间）*/
    removeConversation(type: number, targetId: number) {
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      if (this.activeConversation === conversation) {
        this.activeConversation = null
      }
      // 释放媒体占位的 blob URL + _localFile：未持久化资源，软删后没人渲染，留着只占内存（视频几百 MB），
      //        同步清空 messages 让 GC 早回收（软删的会话被 getSortedConversations 过滤，messages 留着无意义）
      conversation.messages.forEach((message) => {
        revokeBlobUrlsInContent(message.content)
        message._localFile = undefined
      })
      conversation.messages = []
      conversation.deleted = true
      // 软删后会话的消息文件不再有用，物理删除该 key
      this.removeConversationMessages(type, targetId)
      // 同步清掉该会话的草稿，避免重建同 key 会话时残留 [草稿]
      useDraftStore().clearDraft({ type, targetId })
      this.saveConversations()
    },

    /** 删私聊会话的语义糖：friendStore 删好友时调，避免外面手写 ImConversationType.PRIVATE */
    removePrivateConversation(friendId: number) {
      this.removeConversation(ImConversationType.PRIVATE, friendId)
    },

    /** 删群聊会话的语义糖：groupStore 群解散时调，避免外面手写 ImConversationType.GROUP */
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
     * 3. 按 id 有序插入消息
     * 4. 收尾：更新游标 + 持久化
     */
    insertMessage(
      conversationInfo: {
        type: number
        targetId: number
        name: string
        avatar: string
        silent?: boolean // 调用方按 friend / group store 当前 silent 传入；未传不动会话已有值
      },
      messageInfo: Message
    ) {
      // 0. 群广播事件旁路：按 type 局部更新 groupStore 的 role / ownerUserId / 成员列表等状态
      if (
        conversationInfo.type === ImConversationType.GROUP &&
        isGroupNotification(messageInfo.type)
      ) {
        useGroupStore().applyGroupNotification(
          conversationInfo.targetId,
          messageInfo.type,
          messageInfo.content
        )
      }

      // 1.1 查找或自动创建会话；命中软删会话需要复活（场景：A 退群后被重新拉入、用户主动删了对话又收到新消息）
      //     silent 跟随调用方：新建写入；复活 / 已有会话仅在调用方明确传值时覆盖，避免本地 silent 与 friend / group store 漂移
      let conversation = this.getConversation(conversationInfo.type, conversationInfo.targetId)
      if (!conversation) {
        conversation = this.createEmptyConversation(
          conversationInfo.type,
          conversationInfo.targetId,
          conversationInfo.name,
          conversationInfo.avatar,
          conversationInfo.silent
        )
        this.conversations.unshift(conversation)
      } else if (conversation.deleted) {
        conversation.deleted = false
        conversation.name = conversationInfo.name || conversation.name
        conversation.avatar = conversationInfo.avatar || conversation.avatar
        if (conversationInfo.silent !== undefined) {
          conversation.silent = conversationInfo.silent
        }
      } else if (conversationInfo.silent !== undefined) {
        conversation.silent = conversationInfo.silent
      }

      // 1.2 去重合并：优先按 id，其次按 clientMessageId。命中则覆盖更新并返回
      const existingIndex = conversation.messages.findIndex((message) => {
        if (messageInfo.id && message.id && message.id === messageInfo.id) {
          return true
        }
        return !!(
          messageInfo.clientMessageId &&
          message.clientMessageId &&
          message.clientMessageId === messageInfo.clientMessageId
        )
      })
      if (existingIndex >= 0) {
        // 覆盖更新：与 ackMessage 走同一份 applyServerMessageUpdate；
        //         WebSocket / pull 比 REST ack 先到的场景下，blob revoke 和 uploadProgress / _localFile 清理在这里完成
        applyServerMessageUpdate(conversation.messages[existingIndex], messageInfo)
        // 仅合并到末尾那条时刷会话摘要 + 群 @ 标记；中间位置合并不动会话级 last*，避免后到的早消息把排序时间倒着拉回去
        if (existingIndex === conversation.messages.length - 1) {
          recomputeConversationLast(conversation)
          syncConversationAtFlags(conversation, messageInfo)
        }
        this.updateMaxId(conversationInfo.type, messageInfo.id)
        this.saveConversations(conversation)
        return
      }

      // 2.1 更新会话摘要 + 最后一条消息事实索引（含发送人名快照）。
      //     deriveLastSenderDisplayName 必须在更新 lastSenderId 之前调用，靠旧值判断"同发送人"
      const senderDisplayName = deriveLastSenderDisplayName(conversation, messageInfo.senderId)
      conversation.lastContent = resolveConversationLastContent(
        messageInfo,
        conversation.type,
        conversation.targetId,
        senderDisplayName
      )
      conversation.lastSendTime = messageInfo.sendTime || Date.now()
      conversation.lastSenderId = messageInfo.senderId
      conversation.lastMessageType = messageInfo.type
      conversation.lastSelfSend = messageInfo.selfSend
      conversation.lastSenderDisplayName = senderDisplayName

      // 2.2 群聊 @ 标记（仅对方消息 + 未读态有效）
      syncConversationAtFlags(conversation, messageInfo)

      // 2.3 未读数：非当前会话 + 非自己发送 + 普通消息 + 非已读 => +1
      const isActive =
        this.activeConversation?.type === conversationInfo.type &&
        this.activeConversation?.targetId === conversationInfo.targetId
      if (
        !messageInfo.selfSend &&
        !isActive &&
        isNormalMessage(messageInfo.type) &&
        messageInfo.status !== ImMessageStatus.READ &&
        messageInfo.status !== ImMessageStatus.RECALL
      ) {
        conversation.unreadCount++
      }

      // 3. 按真实 id 升序插入；id=0 的本地占位（SENDING）固定停在末尾，
      //    并发场景下：占位仍在末尾时收到的真实消息会追加在占位之后，列表不严格按 id 升序
      let insertIndex = conversation.messages.length
      if (messageInfo.id) {
        for (let index = 0; index < conversation.messages.length; index++) {
          const existing = conversation.messages[index]
          if (existing.id && messageInfo.id < existing.id) {
            insertIndex = index
            break
          }
        }
      }
      conversation.messages.splice(insertIndex, 0, messageInfo)

      // 4.1 更新游标
      this.updateMaxId(conversationInfo.type, messageInfo.id)

      // 4.2 持久化：消息 + meta
      this.saveConversations(conversation)
    },

    /**
     * 根据 clientMessageId 更新消息状态
     *
     * 乐观更新回填：本地先以 SENDING 状态插入临时消息（id=0 + clientMessageId），
     * 待服务端返回后再用此方法回填真实 id、sendTime、status 等字段。
     */
    ackMessage(
      conversationType: number,
      targetId: number,
      clientMessageId: string,
      updates: Partial<Message>
    ) {
      const conversation = this.getConversation(conversationType, targetId)
      if (!conversation) {
        return
      }
      const message = conversation.messages.find((item) => item.clientMessageId === clientMessageId)
      if (!message) {
        return
      }
      applyServerMessageUpdate(message, updates)
      if (updates.id) {
        this.updateMaxId(conversationType, updates.id)
      }
      this.saveConversations(conversation)
    },

    /**
     * 局部更新一条本地消息（不持久化、不更新游标）
     *
     * 媒体上传链路高频调用：onUploadProgress 每次回调都 patch uploadProgress；上传完成 patch content（替换 blob → 真实 url）。
     * 不落 IDB 是性能取舍 ── progress 高频写盘会卡 UI；后续 sendRaw 的 ackMessage 会自然把最终态持久化
     */
    patchMessage(
      conversationType: number,
      targetId: number,
      clientMessageId: string,
      patch: Partial<Message>
    ) {
      const conversation = this.getConversation(conversationType, targetId)
      if (!conversation) {
        return
      }
      const message = conversation.messages.find((item) => item.clientMessageId === clientMessageId)
      if (!message) {
        return
      }
      // 值未变就早返回：onUploadProgress 高频回调里同 percent 重复 patch 时直接跳过响应式更新链
      //              （createUploadProgressHandler 在源头已去重；这里是最后兜底，对 patch.uploadProgress / status 等字段都生效）
      let changed = false
      for (const key in patch) {
        if (
          Object.prototype.hasOwnProperty.call(patch, key) &&
          (patch as Record<string, unknown>)[key] !==
            (message as unknown as Record<string, unknown>)[key]
        ) {
          changed = true
          break
        }
      }
      if (!changed) {
        return
      }
      applyServerMessageUpdate(message, patch)
    },

    /**
     * 撤回消息：解析撤回信号 content（`{"messageId": xxx}`），找到原消息更新为 RECALL 态 + 刷新会话摘要
     * 撤回提示文案不固化，由 ConversationItem / MessageItem 渲染时调 buildRecallTip 实时算
     */
    recallMessage(conversationType: number, targetId: number, recallSignalContent: string) {
      const messageId = parseRecallMessageId(recallSignalContent)
      if (messageId <= 0) {
        return
      }
      const conversation = this.getConversation(conversationType, targetId)
      if (!conversation) {
        return
      }
      const message = conversation.messages.find((item) => item.id === messageId)
      if (!message) {
        return
      }
      message.type = ImMessageType.RECALL
      message.status = ImMessageStatus.RECALL
      // 清空 content：撤回文案由渲染层 buildRecallTip 实时算，老 content 留着会被误认为有效消息文本
      message.content = ''
      // 最后一条消息是刚撤回的，才更新会话摘要 + lastMessageType（senderId 不变，沿用旧快照）
      if (conversation.messages[conversation.messages.length - 1]?.id === messageId) {
        conversation.lastContent = resolveConversationLastContent(
          message,
          conversation.type,
          conversation.targetId,
          conversation.lastSenderDisplayName
        )
        conversation.lastMessageType = ImMessageType.RECALL
      }
      this.saveConversations(conversation)
    },

    /** 处理对方已读 / 群回执：更新发送方自己消息的 status / readCount / receiptStatus */
    applyReadReceipt(options: {
      conversationType: number
      targetId: number
      // 私聊：把和该好友的「自己发送的、id <= privateReadMaxId 的」消息标为已读
      // 必须卡 maxId 边界：回执在路上时新发的消息不能被误标为已读
      privateReadMaxId?: number
      // 群聊：针对单条消息的回执刷新
      groupMessageId?: number
      readCount?: number
      receiptStatus?: number
    }) {
      const conversation = this.getConversation(options.conversationType, options.targetId)
      if (!conversation) {
        return
      }
      if (options.conversationType === ImConversationType.PRIVATE && options.privateReadMaxId) {
        const maxReadId = options.privateReadMaxId
        conversation.messages.forEach((message) => {
          if (
            message.selfSend &&
            message.id &&
            message.id <= maxReadId &&
            message.status !== ImMessageStatus.RECALL
          ) {
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
      this.saveConversations(conversation)
    },

    /**
     * 把"更早的历史消息"批量插到会话消息列表的最前面（合并 + 去重）
     *
     * MessageHistory 弹窗的"加载更早"按钮调用：调用方先调 /im/message/{private,group}/list 拉一页 +
     * 用 useMessagePuller 的 convert 函数转好，再传进来。
     *
     * 不更新 lastContent / lastSendTime / unreadCount：这些字段反映"最新一条"，加载老消息时不应改动；
     * 也不触发 conversation 排序，避免会话列表抖动
     */
    prependMessages(conversationType: number, targetId: number, earlierMessages: Message[]) {
      if (earlierMessages.length === 0) {
        return
      }
      const conversation = this.getConversation(conversationType, targetId)
      if (!conversation) {
        return
      }
      // 1. 去重：拿当前会话已有消息的 id 集合，把入参里 id 撞上的过滤掉
      //    （后端返回的"更早消息"可能跟本地缓存有重叠，比如增量 pull 拉到过同一段）
      //    id=0 是本地占位消息，不参与去重判定（也不会被 prepend，下面 filter 一并卡掉）
      const existingIds = new Set(
        conversation.messages.map((message) => message.id).filter((id) => id > 0)
      )
      // 2. 过滤后按 id 升序：list 接口虽然按 id desc 返回，前端要展示成"早 → 晚"，
      //    所以 prepend 之前先 sort asc，让 fresh 数组本身的相对顺序符合时间线
      const fresh = earlierMessages
        .filter((message) => message.id > 0 && !existingIds.has(message.id))
        .sort((a, b) => a.id - b.id)
      if (fresh.length === 0) {
        return
      }
      // 3. 拼接 + 落盘：fresh 在前、原 messages 在后；持久化让下次冷启动不用再调接口
      conversation.messages = [...fresh, ...conversation.messages]
      this.saveConversations(conversation)
    },

    /**
     * 从本地消息列表移除一条消息（右键"删除"；不同步后端）
     * 按 id 优先匹配；若 id 为 0（本地发送中），则按 clientMessageId 匹配
     */
    removeMessage(
      conversationType: number,
      targetId: number,
      key: { id?: number; clientMessageId?: string }
    ) {
      const conversation = this.getConversation(conversationType, targetId)
      if (!conversation) {
        return
      }
      const index = conversation.messages.findIndex((message) => {
        if (key.id && message.id && message.id === key.id) {
          return true
        }
        return !!(
          key.clientMessageId &&
          message.clientMessageId &&
          message.clientMessageId === key.clientMessageId
        )
      })
      if (index < 0) {
        return
      }
      // 媒体消息占位 / FAILED 删除时释放 content 里的 blob URL，避免 File 对象内存泄漏
      revokeBlobUrlsInContent(conversation.messages[index].content)
      conversation.messages.splice(index, 1)
      // 删的是最后一条时按剩余末尾重算摘要 + 事实索引
      if (index === conversation.messages.length) {
        recomputeConversationLast(conversation)
      }
      this.saveConversations(conversation)
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
      this.saveConversations(this.activeConversation)
    },

    // ==================== 最近转发 ====================

    /**
     * 推送一批会话 key 到最近转发列表：去重 + 推到队首 + 截断 CONVERSATION_RECENT_FORWARD_MAX
     *
     * 调用点：RecommendCardDialog / MessageForwardDialog 提交后（含部分成功）把目标 keys 推进来
     */
    pushRecentForwardConversationKeys(keys: string[]) {
      if (!keys || keys.length === 0) {
        return
      }
      const merged = [...keys, ...this.recentForwardConversationKeys]
      this.recentForwardConversationKeys = Array.from(new Set(merged)).slice(
        0,
        CONVERSATION_RECENT_FORWARD_MAX
      )
      this.persistRecentForwardConversationKeys()
    },

    /**
     * 从最近转发列表移除单条会话 key
     *
     * 调用点：ConversationPickerPanel「最近转发」段进入移除模式时点击 × 触发
     */
    removeRecentForwardConversationKey(key: string) {
      const index = this.recentForwardConversationKeys.indexOf(key)
      if (index < 0) {
        return
      }
      this.recentForwardConversationKeys.splice(index, 1)
      this.persistRecentForwardConversationKeys()
    },

    /** 把当前最近转发会话 key 列表落到 IDB；fire-and-forget，按 userId 分桶 */
    persistRecentForwardConversationKeys() {
      const userId = getCurrentUserId()
      if (!userId) {
        return
      }
      void imStorage
        .setItem(
          StorageKeys.recentForwardConversationKeys(userId),
          toRaw(this.recentForwardConversationKeys)
        )
        .catch((e) => console.warn('[IM] 最近转发列表持久化失败', e))
    },

    // ==================== 其它 ====================

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
      } else if (conversationType === ImConversationType.CHANNEL) {
        if (messageId > this.channelMessageMaxId) {
          this.channelMessageMaxId = messageId
        }
      }
    },

    /**
     * 离线消息加载完后重排：按 lastSendTime 倒序，并把 loading 期间累积的内存变更全量 flush
     *
     * loading 期间 saveConversations 都会被早 return 跳过，这里把所有会话作为数组传入兜底，
     * 否则离线拉取的消息只在内存里、未落盘，重启会丢。
     */
    sortConversations() {
      this.conversations.sort((a, b) => b.lastSendTime - a.lastSendTime)
      this.saveConversations(this.conversations)
    },

    /**
     * 同步会话的展示元数据（name / avatar / silent）
     *
     * 调用方负责把好友 / 群的信息整理成 Conversation 视角的字段：
     * - 私聊：name = friend.nickname；avatar = friend.avatar
     * - 群聊：name = group.name（或叠加 groupRemark）；avatar = group.avatar
     */
    updateConversation(
      type: number,
      targetId: number,
      info: { name?: string; avatar?: string; silent?: boolean }
    ) {
      const conversation = this.getConversation(type, targetId)
      if (!conversation) {
        return
      }
      let changed = false
      if (info.name && conversation.name !== info.name) {
        conversation.name = info.name
        changed = true
      }
      if (info.avatar !== undefined && conversation.avatar !== info.avatar) {
        conversation.avatar = info.avatar || ''
        changed = true
      }
      if (info.silent !== undefined && conversation.silent !== info.silent) {
        conversation.silent = info.silent
        changed = true
      }
      if (changed) {
        this.saveConversations()
      }
    }
  }
})

export const useConversationStoreWithOut = () => {
  return useConversationStore(store)
}

// dev: 让 Pinia 的 actions / state 改动支持 HMR，避免每次改 store 都得硬刷
// 否则 Vite 把新模块推下来后，老 store 实例的 action 闭包仍指向旧函数体
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConversationStore, import.meta.hot))
}
