import { watch } from 'vue'
import { useConversationStore } from '../store/conversationStore'
import { useImWebSocketStore } from '../store/websocketStore'
import { useFriendStore } from '../store/friendStore'
import { useGroupStore } from '../store/groupStore'
import {
  pullPrivateMessages as apiPullPrivateMessages,
  getPrivateMaxReadMessageId as apiGetPrivateMaxReadMessageId,
  type ImPrivateMessageRespVO
} from '@/api/im/message/private'
import {
  pullGroupMessages as apiPullGroupMessages,
  type ImGroupMessageRespVO
} from '@/api/im/message/group'
import {
  ImConversationType,
  ImMessageType,
  PRIVATE_MESSAGE_PULL_SIZE,
  GROUP_MESSAGE_PULL_SIZE
} from '../../utils/constants'
import { useUserStore } from '@/store/modules/user'
import type { Message } from '../types'

/**
 * 消息增量拉取：登录后分页拉取离线期间的新消息
 *
 * 设计要点：
 * 1. 同时拉取私聊 + 群聊，使用各自的 `minId` 游标（privateMessageMaxId / groupMessageMaxId）
 * 2. 后端一次最多返回 size 条；前端按 minId 持续翻页，直到接口返回空列表为止
 * 3. 拉取期间 conversationStore.loading=true：
 *    - conversationStore 跳过 localStorage 持久化，避免频繁写入卡顿
 *    - websocketStore 把新来的 WS 普通消息丢进缓冲区，等循环结束后统一回放
 * 4. WebSocket 重连后会再触发一次拉取，补齐断网期间错过的消息
 */
export const useMessagePuller = () => {
  const conversationStore = useConversationStore()
  const wsStore = useImWebSocketStore()
  const userStore = useUserStore()
  const friendStore = useFriendStore()
  const groupStore = useGroupStore()
  const currentUserId = Number(userStore.getUser?.id) || 0

  /** 私聊会话归属：自己发的算"发给 receiverId 的会话"，否则算"发送方的会话" */
  const getPrivatePeerId = (message: ImPrivateMessageRespVO) =>
    message.senderId === currentUserId ? message.receiverId : message.senderId

  /** 群消息发送者在群内的展示名（群备注 > 用户昵称） */
  const getGroupSenderNickName = (message: ImGroupMessageRespVO): string => {
    const group = groupStore.getGroup(message.groupId)
    const member = group?.members?.find((m) => m.userId === message.senderId)
    return member?.displayUserName || member?.nickname || ''
  }

  /** 服务端私聊消息 -> 本地 Message */
  const convertPrivateMessage = (message: ImPrivateMessageRespVO): Message => {
    const friend = friendStore.getFriend(getPrivatePeerId(message))
    return {
      id: message.id,
      clientMessageId: message.clientMessageId || '',
      type: message.type,
      content: message.content,
      status: message.status,
      sendTime: new Date(message.sendTime).getTime(),
      senderId: message.senderId,
      senderNickName: friend?.nickname || '',
      targetId: message.receiverId,
      selfSend: message.senderId === currentUserId
    }
  }

  /** 服务端群聊消息 -> 本地 Message */
  const convertGroupMessage = (message: ImGroupMessageRespVO): Message => {
    return {
      id: message.id,
      clientMessageId: message.clientMessageId || '',
      type: message.type,
      content: message.content,
      status: message.status,
      sendTime: new Date(message.sendTime).getTime(),
      senderId: message.senderId,
      senderNickName: getGroupSenderNickName(message),
      targetId: message.groupId,
      selfSend: message.senderId === currentUserId,
      atUserIds: message.atUserIds || [],
      receiverUserIds: message.receiverUserIds || [],
      receiptStatus: message.receiptStatus,
      readCount: message.readCount
    }
  }

  /** 私聊：会话归属到对端 userId */
  const convertPrivateConversation = (message: ImPrivateMessageRespVO) => {
    const targetId = getPrivatePeerId(message)
    const friend = friendStore.getFriend(targetId)
    return {
      type: ImConversationType.PRIVATE,
      targetId,
      name: friend?.nickname || String(targetId),
      avatar: friend?.avatar || ''
    }
  }

  /** 群聊：会话归属到 groupId */
  const convertGroupConversation = (message: ImGroupMessageRespVO) => {
    const group = groupStore.getGroup(message.groupId)
    return {
      type: ImConversationType.GROUP,
      targetId: message.groupId,
      name: group?.name || String(message.groupId),
      avatar: group?.avatar || ''
    }
  }

  /** 循环拉取指定会话类型的消息：以列表最后一条 id 作为下次 minId，直到接口返回空列表 */
  const pullByType = async (conversationType: number, startMinId: number) => {
    // 私聊 / 群聊各自一套接口和分页大小，按 isPrivate 在循环内分支调度
    let minId = startMinId || 0
    const isPrivate = conversationType === ImConversationType.PRIVATE
    const size = isPrivate ? PRIVATE_MESSAGE_PULL_SIZE : GROUP_MESSAGE_PULL_SIZE
    while (true) {
      const list = isPrivate
        ? await apiPullPrivateMessages({ minId, size })
        : await apiPullGroupMessages({ minId, size })
      if (!list || list.length === 0) {
        break
      }

      // 逐条 dispatch：原消息走 insertMessage；RECALL 信号走 recallMessage 把同批内已 insert 的原消息更新为撤回提示。
      // 后端按 id 升序返回，且信号 id 一定 > 原消息 id（先更新 status 再插信号），所以原消息一定先到、recallMessage 找得到
      for (const raw of list) {
        if (isPrivate) {
          const message = raw as ImPrivateMessageRespVO
          if (message.type === ImMessageType.RECALL) {
            const peerId = getPrivatePeerId(message)
            conversationStore.recallMessage(
              ImConversationType.PRIVATE,
              peerId,
              message.content,
              friendStore.getFriend(peerId)?.nickname || '',
              message.senderId === currentUserId
            )
            continue
          }
          conversationStore.insertMessage(
            convertPrivateConversation(message),
            convertPrivateMessage(message)
          )
        } else {
          const message = raw as ImGroupMessageRespVO
          if (message.type === ImMessageType.RECALL) {
            conversationStore.recallMessage(
              ImConversationType.GROUP,
              message.groupId,
              message.content,
              getGroupSenderNickName(message),
              message.senderId === currentUserId
            )
            continue
          }
          conversationStore.insertMessage(
            convertGroupConversation(message),
            convertGroupMessage(message)
          )
        }
      }

      // 游标推进到本批最后一条 id，下一轮从此处续翻
      const lastId = list[list.length - 1].id
      if (lastId != null) {
        minId = lastId
      }
    }
  }

  /** 同一时刻只允许一次 pull：Index.vue 的手动调用与重连 watch 触发可能并发，共用同一个 promise 即可去重 */
  let pullPromise: Promise<void> | null = null

  /** 执行一次全量增量拉取（重入安全：进行中再次调用复用同一个 promise） */
  const pullOnce = (): Promise<void> => {
    if (!currentUserId) {
      return Promise.resolve()
    }
    if (pullPromise) {
      return pullPromise
    }
    pullPromise = (async () => {
      try {
        conversationStore.loading = true
        try {
          // 并发拉取私聊 + 群聊，降低初始加载耗时
          await Promise.all([
            pullByType(ImConversationType.PRIVATE, conversationStore.privateMessageMaxId),
            pullByType(ImConversationType.GROUP, conversationStore.groupMessageMaxId)
          ])

          // 回放 WebSocket 在 loading 期间收到的缓冲消息
          const buffered = wsStore.flushBuffer()
          for (const item of buffered) {
            if (item.conversationType === ImConversationType.PRIVATE) {
              wsStore.handlePrivateMessage(item.payload)
            } else {
              wsStore.handleGroupMessage(item.payload)
            }
          }
        } catch (e) {
          console.error('[IM] 拉取离线消息失败:', e)
        } finally {
          conversationStore.loading = false
          conversationStore.sortConversations()
        }

        // 重连 / 冷启动后补齐当前激活私聊会话的「对方已读位置」
        // 离线期间错过的 RECEIPT 推送会被这里补回；其他私聊会话等用户点开时由 Index.vue 的 watch 触发
        const active = conversationStore.activeConversation
        if (active && active.type === ImConversationType.PRIVATE) {
          try {
            const maxReadId = await apiGetPrivateMaxReadMessageId(active.targetId)
            if (maxReadId) {
              conversationStore.applyReadReceipt({
                conversationType: ImConversationType.PRIVATE,
                targetId: active.targetId,
                privateReadMaxId: maxReadId
              })
            }
          } catch (e) {
            console.warn('[IM] 拉取对方已读位置失败', e)
          }
        }
      } finally {
        // 整个 IIFE 全部完成（含已读位置补齐）后才允许下一次 pullOnce 重入
        pullPromise = null
      }
    })()
    return pullPromise
  }

  /**
   * 断网期间 WS 收不到推送，期间产生的消息只能靠拉取接口按 minId 游标补齐；
   * 首次连接由 Index.vue 显式调 pullOnce，这里订阅 isConnected 的 false→true 转换，覆盖后续每次重连
   */
  watch(
    () => wsStore.isConnected,
    (isConnected) => {
      if (isConnected) {
        void pullOnce()
      }
    }
  )

  return { pullOnce }
}
