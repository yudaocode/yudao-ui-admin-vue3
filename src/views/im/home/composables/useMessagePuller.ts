import { watch } from 'vue'
import { useConversationStore } from '../store/conversationStore'
import { useMessageStore, type PulledMessage } from '../store/messageStore'
import { useImWebSocketStore } from '../store/websocketStore'
import { useFriendStore } from '../store/friendStore'
import { getFriendDisplayName } from '../../utils/user'
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
  pullChannelMessages as apiPullChannelMessages,
  type ImChannelMessageRespVO
} from '@/api/im/message/channel'
import {
  ImConversationType,
  ImMessageStatus,
  ImMessageType,
  isFriendChatTip,
  isFriendNotification
} from '../../utils/constants'
import {
  MESSAGE_PRIVATE_PULL_SIZE,
  MESSAGE_GROUP_PULL_SIZE,
  MESSAGE_PRIVATE_READ_ENABLED
} from '../../utils/config'
import { buildChannelConversationStub } from '../../utils/channel'
import { generateClientMessageId, getPrivateMessagePeerId } from '../../utils/message'
import { getCurrentUserId } from '@/utils/auth'
import type { Message } from '../types'

/**
 * 消息增量拉取：登录后分页拉取离线期间的新消息
 *
 * 设计要点：
 * 1. 同时拉取私聊 + 群聊，使用各自的 `minId` 游标（privateMessageMaxId / groupMessageMaxId）
 * 2. 后端一次最多返回 size 条；前端按 minId 持续翻页，直到接口返回空列表为止
 * 3. 拉取期间 conversationStore.loading=true：
 *    - conversationStore 跳过批量持久化，避免频繁写入卡顿
 *    - websocketStore 把新来的 WS 普通消息丢进缓冲区，等循环结束后统一回放
 * 4. WebSocket 重连后会再触发一次拉取，补齐断网期间错过的消息
 */
export const useMessagePuller = () => {
  const conversationStore = useConversationStore()
  const messageStore = useMessageStore()
  const wsStore = useImWebSocketStore()
  const friendStore = useFriendStore()
  const groupStore = useGroupStore()
  const currentUserId = getCurrentUserId()

  /** 判断请求是否被主动取消 */
  const isAbortError = (e: unknown): boolean => {
    const error = e as { name?: string; code?: string; message?: string }
    return (
      error?.name === 'CanceledError' ||
      error?.code === 'ERR_CANCELED' ||
      error?.message === 'canceled'
    )
  }

  /** 私聊会话归属：自己发的算"发给 receiverId 的会话"，否则算"发送方的会话"；curry currentUserId 进闭包减少 3 处调用方的样板 */
  const getPrivatePeerId = (message: ImPrivateMessageRespVO) =>
    getPrivateMessagePeerId(message, currentUserId)

  /** 服务端私聊消息 -> 本地 Message：targetId 是会话主键（对端 userId） */
  const convertPrivateMessage = (message: ImPrivateMessageRespVO): Message => {
    return {
      id: message.id,
      clientMessageId: message.clientMessageId || generateClientMessageId(),
      type: message.type,
      content: message.content,
      status: message.status,
      receiptStatus: message.receiptStatus,
      sendTime: new Date(message.sendTime).getTime(),
      senderId: message.senderId,
      targetId: getPrivatePeerId(message),
      selfSend: message.senderId === currentUserId
    }
  }

  /** 服务端群聊消息 -> 本地 Message */
  const convertGroupMessage = (message: ImGroupMessageRespVO): Message => {
    return {
      id: message.id,
      clientMessageId: message.clientMessageId || generateClientMessageId(),
      type: message.type,
      content: message.content,
      status: message.status,
      sendTime: new Date(message.sendTime).getTime(),
      senderId: message.senderId,
      targetId: message.groupId,
      selfSend: message.senderId === currentUserId,
      atUserIds: message.atUserIds || [],
      receiverUserIds: message.receiverUserIds || [],
      receiptStatus: message.receiptStatus,
      readCount: message.readCount
    }
  }

  /** 服务端频道消息 -> 本地 Message */
  const convertChannelMessage = (message: ImChannelMessageRespVO): Message => {
    return {
      id: message.id,
      clientMessageId: message.clientMessageId || generateClientMessageId(),
      type: message.type,
      content: message.content,
      status: ImMessageStatus.NORMAL, // 频道无撤回，恒为正常
      receiptStatus: message.receiptStatus, // 频道已读态：DONE 已读 / PENDING 未读
      sendTime: new Date(message.sendTime).getTime(),
      senderId: 0, // 系统下发，无发送人
      targetId: message.channelId, // 会话归属到频道编号
      selfSend: false,
      materialId: message.materialId // 详情页拉富文本用
    }
  }

  /** 频道：会话归属到 channelId；name / avatar 暂用占位，将来接入 channelStore 后再填真值 */
  const convertChannelConversation = (message: ImChannelMessageRespVO) =>
    buildChannelConversationStub(message.channelId)

  /** 私聊：会话归属到对端 userId */
  const convertPrivateConversation = (message: ImPrivateMessageRespVO) => {
    const targetId = getPrivatePeerId(message)
    const friend = friendStore.getFriend(targetId)
    return {
      type: ImConversationType.PRIVATE,
      targetId,
      name: friend ? getFriendDisplayName(friend) : String(targetId), // 会话列表 / 顶部标题展示：好友备注 > 真实昵称
      avatar: friend?.avatar || '',
      silent: friend?.silent
    }
  }

  /** 群聊：会话归属到 groupId */
  const convertGroupConversation = (message: ImGroupMessageRespVO) => {
    const group = groupStore.getGroup(message.groupId)
    return {
      type: ImConversationType.GROUP,
      targetId: message.groupId,
      name: group?.name || String(message.groupId),
      avatar: group?.avatar || '',
      silent: group?.silent
    }
  }

  /**
   * 循环拉取指定会话类型的消息：以本批最大 id 作为下次 minId，直到接口返回空列表或游标不再前进
   *
   * 取消语义两层守卫：
   * 1. startEpoch：cancelPull() 递增 pullEpoch；离开 IM / 切账号时旧循环检测到漂移即跳出
   * 2. startUserId：每批 await 后比对当前登录 userId；防御 logout / 多 tab 异常下用户已切但 cancelPull 未触发
   * 两者任一不等都丢弃本批不入库，避免旧 session 的接口响应在新 store 落地
   */
  const pullByType = async (
    conversationType: number,
    startMinId: number,
    startEpoch: number,
    startUserId: number,
    signal: AbortSignal
  ) => {
    // 私聊 / 群聊 / 频道各自一套接口；按 conversationType 在循环内分支调度
    let minId = startMinId || 0
    const isPrivate = conversationType === ImConversationType.PRIVATE
    const isChannel = conversationType === ImConversationType.CHANNEL
    const size = isPrivate ? MESSAGE_PRIVATE_PULL_SIZE : MESSAGE_GROUP_PULL_SIZE
    const isStillValid = () =>
      !signal.aborted && pullEpoch === startEpoch && getCurrentUserId() === startUserId
    while (true) {
      if (!isStillValid()) {
        return
      }
      let list: any[] | undefined
      if (isPrivate) {
        list = await apiPullPrivateMessages({ minId, size }, signal)
      } else if (isChannel) {
        list = await apiPullChannelMessages({ minId, size }, signal)
      } else {
        list = await apiPullGroupMessages({ minId, size }, signal)
      }
      // 接口返回期间发生 cancel / 切账号：丢弃本批不入库，也不再翻页
      if (!isStillValid()) {
        return
      }
      if (!list || list.length === 0) {
        break
      }

      const pulledMessages: PulledMessage[] = []
      // 逐条 dispatch：原消息走批量 insert；RECALL 信号走批量 recall 把同批内已 insert 的原消息更新为撤回提示。
      // 后端按 id 升序返回，且信号 id 一定 > 原消息 id（先更新 status 再插信号），所以原消息一定先到、recallMessage 找得到
      for (const raw of list) {
        if (isChannel) {
          const message = raw as ImChannelMessageRespVO
          pulledMessages.push({
            kind: 'insert',
            conversationInfo: convertChannelConversation(message),
            message: convertChannelMessage(message)
          })
          continue
        }
        if (isPrivate) {
          const message = raw as ImPrivateMessageRespVO
          // 特殊：撤回消息的处理
          if (message.type === ImMessageType.RECALL) {
            pulledMessages.push({
              kind: 'recall',
              conversationType: ImConversationType.PRIVATE,
              targetId: getPrivatePeerId(message),
              recallSignalContent: message.content
            })
            continue
          }
          // 特殊：离线 pull 期间入库的 FRIEND_* 帧（目前仅 FRIEND_ADD persistent=true）也要走好友数据分发，
          //      否则断线期间的好友列表更新会丢失；与 WebSocket 路径 dispatchPrivateFrame 保持对称
          if (isFriendNotification(message.type)) {
            wsStore.handleFriendNotification(message)
            // 仅 FRIEND_ADD / FRIEND_DELETE 才作为会话气泡入消息列表
            if (!isFriendChatTip(message.type)) {
              continue
            }
          }
          // 其它消息正常入会话消息列表
          pulledMessages.push({
            kind: 'insert',
            conversationInfo: convertPrivateConversation(message),
            message: convertPrivateMessage(message)
          })
        } else {
          const message = raw as ImGroupMessageRespVO
          // 特殊：撤回消息的处理
          if (message.type === ImMessageType.RECALL) {
            pulledMessages.push({
              kind: 'recall',
              conversationType: ImConversationType.GROUP,
              targetId: message.groupId,
              recallSignalContent: message.content
            })
            continue
          }
          // 其它消息正常入会话消息列表
          pulledMessages.push({
            kind: 'insert',
            conversationInfo: convertGroupConversation(message),
            message: convertGroupMessage(message)
          })
        }
      }

      // 游标推进到本批最大消息编号
      const validIds = list.map((message) => message.id).filter((id): id is number => id != null)
      if (validIds.length === 0) {
        await messageStore.applyPulledMessageList(pulledMessages, conversationType)
        break
      }
      const nextMinId = Math.max(...validIds)
      await messageStore.applyPulledMessageList(pulledMessages, conversationType, nextMinId)
      // 游标没前进就停：当前后端契约是 id > minId，理论不会出现；防御后端契约变更或边界数据死翻
      if (nextMinId <= minId) {
        break
      }
      minId = nextMinId
    }
  }

  /** 同一时刻只允许一次 pull：Index.vue 的手动调用与重连 watch 触发可能并发，共用同一个 promise 即可去重 */
  let pullPromise: Promise<void> | null = null
  let pullAbortController: AbortController | null = null

  /**
   * 首次 pull 是否已完成。仅在置 true 后，isConnected watch 才会触发 pull。
   * 防止 socket onopen 比 friendStore/groupStore 预拉先到达时，watcher 抢跑造成消息插入早于会话元数据可见
   */
  let initialPulled = false

  /**
   * pull 轮次计数；切账号 / 离开 IM 时 cancelPull() 递增，旧 pullByType 循环按 epoch 自检后跳出
   * 避免旧 session 的接口响应在新 session 落地，造成跨账号消息泄漏
   *
   * 注意：普通断连（WS 短断）不取消 pull——网络抖动 / 服务端重启都属于本账号正常生命周期，
   * 取消会导致首拉被中断后 initialPulled 永远停在 false，后续重连 watcher 不再补拉
   */
  let pullEpoch = 0

  /** 显式取消：仅由 Index.vue onUnmounted（离开 IM / 切账号 / 路由跳出）调用 */
  const cancelPull = () => {
    pullEpoch++
    pullAbortController?.abort()
    pullAbortController = null
    // 旧 promise 仍在 finally 阶段跑，但 epoch 守卫已阻断后续副作用；这里立刻让 pullPromise = null 让新一轮可重入
    pullPromise = null
    // 同步丢弃 WS 缓冲帧；旧 pull 已不会 flushBuffer，若不清下次进 IM 第一次 pullOnce 会把旧 session 的帧回放进新 store
    wsStore.discardBuffer()
  }

  /** 执行一次全量增量拉取（重入安全：进行中再次调用复用同一个 promise） */
  const pullOnce = (): Promise<void> => {
    if (!currentUserId) {
      return Promise.resolve()
    }
    if (pullPromise) {
      return pullPromise
    }
    const startEpoch = pullEpoch
    // 启动时的用户快照；pullByType 每批 await 后比对当前登录用户，账号变了立刻丢弃
    const startUserId = currentUserId
    const abortController = new AbortController()
    pullAbortController = abortController
    // 本轮 pull 仍属于当前 session：epoch 未漂 + 用户未切；任何动新 store 状态的副作用都要先过这道关
    const isCurrentPull = () =>
      !abortController.signal.aborted &&
      pullEpoch === startEpoch &&
      getCurrentUserId() === startUserId
    pullPromise = (async () => {
      try {
        // 旧 puller 在 cancelPull 未触发的异常路径上再进来时，先于任何副作用退出，避免污染新 session 的 loading
        if (!isCurrentPull()) {
          return
        }
        conversationStore.loading = true
        try {
          // 并发拉取私聊 + 群聊 + 频道，降低初始加载耗时
          await Promise.all([
            pullByType(
              ImConversationType.PRIVATE,
              messageStore.privateMessageMaxId,
              startEpoch,
              startUserId,
              abortController.signal
            ),
            pullByType(
              ImConversationType.GROUP,
              messageStore.groupMessageMaxId,
              startEpoch,
              startUserId,
              abortController.signal
            ),
            pullByType(
              ImConversationType.CHANNEL,
              messageStore.channelMessageMaxId,
              startEpoch,
              startUserId,
              abortController.signal
            )
          ])
        } catch (e) {
          if (isAbortError(e)) {
            return
          }
          console.error('[IM] 拉取离线消息失败:', e)
        } finally {
          // 仍属本轮才复位 loading；旧轮被 cancel / 切账号时由新一轮自管，避免覆盖新 session 的 true
          if (isCurrentPull()) {
            conversationStore.loading = false
          }
        }

        // 取消 / 切账号后跳过 flushBuffer / 排序 / 已读位置补齐
        if (!isCurrentPull()) {
          return
        }

        // 回放 WebSocket 在 loading 期间收到的缓冲消息（此刻走正常 insertMessage 路径）
        const buffered = wsStore.flushBuffer()
        for (const item of buffered) {
          if (item.conversationType === ImConversationType.PRIVATE) {
            wsStore.handlePrivateMessage(item.payload)
          } else if (item.conversationType === ImConversationType.CHANNEL) {
            wsStore.handleChannelMessage(item.payload)
          } else {
            wsStore.handleGroupMessage(item.payload)
          }
        }

        // pull + replay 都完成后再排序，避免回放消息打乱顺序
        conversationStore.sortConversationList()

        // 重连 / 冷启动后补齐当前激活私聊会话的「对方已读位置」
        // 离线期间错过的 RECEIPT 推送会被这里补回；其他私聊会话等用户点开时由 Index.vue 的 watch 触发
        // 私聊已读关闭时跳过，避免打到已禁用接口触发错误日志
        const active = conversationStore.activeConversation
        if (MESSAGE_PRIVATE_READ_ENABLED && active && active.type === ImConversationType.PRIVATE) {
          try {
            const maxReadId = await apiGetPrivateMaxReadMessageId(
              active.targetId,
              abortController.signal
            )
            if (!isCurrentPull()) {
              return
            }
            if (maxReadId) {
              messageStore.applyMessageReadReceipt({
                conversationType: ImConversationType.PRIVATE,
                targetId: active.targetId,
                privateReadMaxId: maxReadId
              })
            }
          } catch (e) {
            if (isAbortError(e)) {
              return
            }
            console.warn('[IM] 拉取对方已读位置失败', e)
          }
        }
      } finally {
        // 仍属本轮：正常完成首拉；epoch 等但 userId 切了：清 pullPromise 防卡死、不标首拉；epoch 漂：cancelPull 已清，no-op
        if (isCurrentPull()) {
          pullPromise = null
          initialPulled = true
          if (pullAbortController === abortController) {
            pullAbortController = null
          }
        } else if (pullEpoch === startEpoch) {
          pullPromise = null
          if (pullAbortController === abortController) {
            pullAbortController = null
          }
        }
      }
    })()
    return pullPromise
  }

  /**
   * 断网期间 WS 收不到推送，期间产生的消息只能靠拉取接口按 minId 游标补齐；
   * 首次连接由 Index.vue 显式调 pullOnce 完成首拉，这里仅覆盖之后的重连
   */
  watch(
    () => wsStore.isConnected,
    (isConnected) => {
      if (isConnected && initialPulled) {
        void pullOnce()
      }
    }
  )

  return { pullOnce, cancelPull, convertPrivateMessage, convertGroupMessage }
}
