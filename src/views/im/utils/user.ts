// ====================================================================
// IM 用户展示 utility
// ====================================================================
// 职责：统一回答"某个用户在 UI 上应该如何展示"，包含：
// 1. 显示名（getFriendDisplayName / getMemberDisplayName / getGroupDisplayName / getSenderDisplayName 等）
// 2. 上下文感知名（tryGetSenderDisplayName / getSenderRealNickname）：渲染时按 conversation 上下文实时查 friendStore / groupStore / userStore，让备注 / 群昵称 / 真实昵称变更后所有历史消息立即响应式刷新
// 3. 性别图标 / 颜色（getGenderIcon / getGenderColor）：男蓝、女粉，未知不展示，所有 UserInfo 卡片 / 列表行共用
//
// 命名约定：显示名相关函数一律使用 displayName，与 friend.displayName / member.displayUserName 字段对齐
// ====================================================================

import { useUserStore } from '@/store/modules/user'
import { ImConversationType, ImMessageType } from './constants'
import { getCurrentUserId } from './storage'
import { useFriendStore } from '../home/store/friendStore'
import { useGroupStore } from '../home/store/groupStore'
import type { Friend, Group } from '../home/types'

/**
 * 私聊好友显示名：备注 > 真实昵称
 *
 * displayName 是「我对这个人的私人称呼」属于我的数据，删好友（DISABLE）也保留；删了再加回来时备注自然延续，历史消息里仍以备注辨识
 */
export function getFriendDisplayName(friend: Pick<Friend, 'nickname' | 'displayName'>): string {
  return friend.displayName || friend.nickname
}

/**
 * 群成员显示名：好友备注 > 用户群备注（displayUserName） > 真实昵称
 *
 * WeChat 优先级：好友备注是"我"对该成员的私人称呼，最高优先；其次是 ta 在群内自定义昵称；最后真实昵称兜底；调用方拿到 friend 才传入，没拿到（陌生人）就只用 member 字段降级
 */
export function getMemberDisplayName(
  member: { displayUserName?: string; nickname: string },
  friend?: Pick<Friend, 'displayName'> | null
): string {
  return friend?.displayName || member.displayUserName || member.nickname
}

/** 群显示名：当前用户对该群的备注（groupRemark） > 群名（name） */
export function getGroupDisplayName(group: Pick<Group, 'name' | 'groupRemark'>): string {
  return group.groupRemark || group.name
}

/**
 * 消息发送者显示名（严格版）：算不出真名返回 undefined
 *
 * 给需要"是否真名"信号的调用方用——比如 conversationStore 决定要不要写 lastSenderDisplayName 快照、要不要触发 fetchGroupMembers 兜底拉成员
 *
 * GROUP 场景下 member 已就位优先 displayUserName / 好友备注 / 真实昵称；member 缺失时区分两种 sender：
 * - self → 直接拿 userStore.nickname 兜底（本端永远知道自己的昵称，不需要 fetch；同时避免 self 退群后 GROUP_MEMBER_QUIT 通知触发兜底拉成员 → 403）
 * - 其他人 → 返回 undefined，让 deriveLastSenderDisplayName 走兜底拉成员
 */
export function tryGetSenderDisplayName(
  senderId: number,
  conversationType: number,
  conversationTargetId: number
): string | undefined {
  if (conversationType === ImConversationType.GROUP) {
    const group = useGroupStore().getGroup(conversationTargetId)
    const member = group?.members?.find((m) => m.userId === senderId)
    if (member) {
      const friend = useFriendStore().getFriend(senderId)
      return getMemberDisplayName(member, friend)
    }
    if (senderId === getCurrentUserId()) {
      return useUserStore().getUser?.nickname || undefined
    }
    return undefined
  }

  // PRIVATE / 未知会话类型：self 走 userStore，对方走 friend
  if (senderId === getCurrentUserId()) {
    return useUserStore().getUser?.nickname || undefined
  }
  if (conversationType === ImConversationType.PRIVATE) {
    const friend = useFriendStore().getFriend(senderId)
    return friend ? getFriendDisplayName(friend) : undefined
  }
  return undefined
}

/**
 * 消息发送者显示名：渲染时实时算，按 WeChat 优先级
 *
 * - 自己：userStore.nickname
 * - 私聊对方：好友备注 > 真实昵称
 * - 群聊对方：好友备注 > 群备注（displayUserName） > 真实昵称
 * - 查不到：fallbackName || (self 走 userStore.nickname) || String(senderId)
 */
export function getSenderDisplayName(
  senderId: number,
  conversationType: number,
  conversationTargetId: number,
  fallbackName?: string
): string {
  const real = tryGetSenderDisplayName(senderId, conversationType, conversationTargetId)
  if (real) {
    return real
  }
  if (fallbackName) {
    return fallbackName
  }
  // self 在 GROUP members 没加载时，至少用真实昵称兜底渲染（比 String(senderId) 友好）；兜底拉成员由 conversationStore 触发，回来后 try 版本能命中真名自然刷新
  const userStore = useUserStore()
  if (senderId === getCurrentUserId()) {
    return userStore.getUser?.nickname || String(senderId)
  }
  return String(senderId)
}

/**
 * 消息发送者「真实昵称」：永远是 nickname，不掺备注
 *
 * - 自己：userStore.nickname
 * - 私聊对方：friend.nickname
 * - 群聊对方：member.nickname
 *
 * 专给 UserAvatar 的 :name 用——色卡首字母 / alt 文本要保证同一个人在所有界面一致，不跟备注变
 */
export function getSenderRealNickname(
  senderId: number,
  conversationType: number,
  conversationTargetId: number
): string {
  const userStore = useUserStore()
  const selfUserId = getCurrentUserId()

  // 群聊先走 member.nickname（self 也是 member），异常时再走 self / senderId 兜底
  if (conversationType === ImConversationType.GROUP) {
    const group = useGroupStore().getGroup(conversationTargetId)
    const member = group?.members?.find((m) => m.userId === senderId)
    if (member?.nickname) {
      return member.nickname
    }
    if (senderId === selfUserId) {
      return userStore.getUser?.nickname || String(senderId)
    }
    return String(senderId)
  }

  if (conversationType === ImConversationType.PRIVATE) {
    if (senderId === selfUserId) {
      return userStore.getUser?.nickname || String(senderId)
    }
    const friend = useFriendStore().getFriend(senderId)
    return friend?.nickname || String(senderId)
  }

  if (senderId === selfUserId) {
    return userStore.getUser?.nickname || String(senderId)
  }
  return String(senderId)
}

// TODO @AI：这个方法，还需要么？之前是哪个调用的，可能要看看。
/**
 * 消息发送者头像；按 conversation 上下文实时查 group.members / friend / userStore
 *
 * - 自己：userStore.avatar
 * - 私聊对方：friend.avatar
 * - 群聊对方：先 member.avatar，缺则降级 friend.avatar
 * - 查不到：返回空串，调用方走 UserAvatar 色卡兜底
 */
export function getSenderAvatar(
  senderId: number,
  conversationType: number,
  conversationTargetId: number
): string {
  const userStore = useUserStore()
  if (senderId === getCurrentUserId()) {
    return userStore.getUser?.avatar || ''
  }
  if (conversationType === ImConversationType.GROUP) {
    const group = useGroupStore().getGroup(conversationTargetId)
    const member = group?.members?.find((m) => m.userId === senderId)
    if (member?.avatar) {
      return member.avatar
    }
  }
  return useFriendStore().getFriend(senderId)?.avatar || ''
}

/**
 * 群广播事件（GROUP_* 系列）的中文文案
 *
 * 按 message.type 取 content payload 字段，昵称默认走 getSenderDisplayName（备注 / 群昵称 / 真实昵称兜底）；
 * 管理后台无 store，可传入 resolveName 自定义 id → 名字（如 senderNickname + 用户(id) 兜底）；
 * home 端 MessageItem.vue / ConversationItem.vue / MessageHistory.vue 与 admin 端 MessageContentPreview.vue 共用
 */
export type GroupNotificationPayload = {
  operatorUserId?: number
  memberUserIds?: number[]
  newOwnerUserId?: number
  oldName?: string
  newName?: string
  oldNotice?: string
  newNotice?: string
  oldAvatar?: string
  newAvatar?: string
  displayUserName?: string
  messageId?: number
  mutedUserId?: number // 禁言目标用户
  muteEndTime?: string // 禁言到期时间
  banned?: boolean // 封禁状态
  entrantUserId?: number // 自由进群事件：进群者用户编号
  addSource?: number // 自由进群事件：来源（搜索 / 二维码 / 分享链接）
  /** PIN 事件携带的完整被置顶消息对象 */
  message?: {
    id: number
    clientMessageId?: string
    senderId: number
    groupId: number
    type: number
    content: string
    status: number
    sendTime: string
    atUserIds?: number[]
    receiverUserIds?: number[]
    receiptStatus?: number
    readCount?: number
  }
}

export function resolveGroupNotificationText(
  message: { type?: number; content?: string; targetId?: number },
  resolveName?: (userId: number) => string,
  operatorNameOverride?: string
): string {
  let payload: GroupNotificationPayload = {}
  try {
    payload = JSON.parse(message.content || '{}')
  } catch {
    return ''
  }
  const resolve =
    resolveName ||
    ((id: number) => getSenderDisplayName(id, ImConversationType.GROUP, message.targetId ?? 0))
  const operatorName = payload.operatorUserId
    ? (operatorNameOverride ?? resolve(payload.operatorUserId))
    : ''
  const memberNames = (payload.memberUserIds || []).map(resolve).join('、')
  const newOwnerName = payload.newOwnerUserId ? resolve(payload.newOwnerUserId) : ''
  switch (message.type) {
    case ImMessageType.GROUP_CREATE:
      return `${operatorName} 创建了群聊`
    case ImMessageType.GROUP_NAME_UPDATE:
      return `${operatorName} 将群名修改为 "${payload.newName ?? ''}"`
    case ImMessageType.GROUP_NOTICE_UPDATE:
      return `${operatorName} 更新了群公告`
    case ImMessageType.GROUP_INFO_UPDATE:
      // 兜底事件：按非 null 字段优先匹配特化文案，全部为空时降级为 "更新了群信息" 通用文案
      if (payload.newAvatar) {
        return `${operatorName} 更换了群头像`
      }
      return `${operatorName} 更新了群信息`
    case ImMessageType.GROUP_DISSOLVE:
      return `${operatorName} 解散了群聊`
    case ImMessageType.GROUP_MEMBER_INVITE:
      return `${operatorName} 邀请 ${memberNames} 加入群聊`
    case ImMessageType.GROUP_MEMBER_ENTER: {
      // 自由进群 / 主动申请通过：操作人 = 进群者；文案统一展示「XX 加入了群聊」
      const entrantName = payload.entrantUserId ? resolve(payload.entrantUserId) : operatorName
      return `${entrantName} 加入了群聊`
    }
    case ImMessageType.GROUP_MEMBER_QUIT:
      return `${operatorName} 退出了群聊`
    case ImMessageType.GROUP_MEMBER_KICK:
      return `${operatorName} 移出了 ${memberNames}`
    case ImMessageType.GROUP_MEMBER_NICKNAME_UPDATE:
      return `${operatorName} 修改群昵称为 "${payload.displayUserName ?? ''}"`
    case ImMessageType.GROUP_ADMIN_ADD:
      return `${operatorName} 将 ${memberNames} 设为管理员`
    case ImMessageType.GROUP_ADMIN_REMOVE:
      return `${operatorName} 撤销了 ${memberNames} 的管理员身份`
    case ImMessageType.GROUP_OWNER_TRANSFER:
      return `${operatorName} 已将群主转让给 ${newOwnerName}`
    case ImMessageType.GROUP_MESSAGE_PIN:
      return `${operatorName} 置顶了一条消息`
    case ImMessageType.GROUP_MESSAGE_UNPIN:
      return `${operatorName} 取消了一条置顶消息`
    case ImMessageType.GROUP_MEMBER_MUTED: {
      const mutedName = payload.mutedUserId ? resolve(payload.mutedUserId) : ''
      return `${operatorName} 将 ${mutedName} 禁言`
    }
    case ImMessageType.GROUP_MEMBER_CANCEL_MUTED: {
      const mutedName = payload.mutedUserId ? resolve(payload.mutedUserId) : ''
      return `${operatorName} 解除了 ${mutedName} 的禁言`
    }
    case ImMessageType.GROUP_MUTED:
      return `${operatorName} 开启了全群禁言`
    case ImMessageType.GROUP_CANCEL_MUTED:
      return `${operatorName} 关闭了全群禁言`
    case ImMessageType.GROUP_BANNED:
      return payload.banned ? `${operatorName} 封禁了该群` : `${operatorName} 解封了该群`
    default:
      return ''
  }
}

/** 会话内好友事件文案：FRIEND_ADD / FRIEND_DELETE 渲染成灰色提示气泡，文案固定不依赖 payload */
export function resolveFriendNotificationText(message: { type?: number }): string {
  switch (message.type) {
    case ImMessageType.FRIEND_ADD:
      return '你们已经是好友了，开始聊天吧'
    case ImMessageType.FRIEND_DELETE:
      return '你已删除好友'
    default:
      return ''
  }
}

/** 性别图标：男 1 / 女 2，0 / null / undefined 一律不展示，对齐微信留白 */
export function getGenderIcon(sex?: number): string {
  if (sex === 1) {
    return 'mdi:human-male'
  }
  if (sex === 2) {
    return 'mdi:human-female'
  }
  return ''
}

/** 性别图标主题色：男蓝、女粉 */
export function getGenderColor(sex?: number): string {
  if (sex === 1) {
    return '#5b97f5'
  }
  if (sex === 2) {
    return '#f56c92'
  }
  return ''
}
