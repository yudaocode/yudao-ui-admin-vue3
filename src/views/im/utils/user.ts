// ====================================================================
// IM 用户展示名 utility
// ====================================================================
// 职责：统一回答"某个用户在 UI 上应该叫什么名字"。拆两层：
// 1. 纯派生（getFriendDisplayName / getMemberDisplayName / getGroupDisplayName）：输入 friend / member / group 对象，不查 store，给 store 内部 / 各种组装点复用，避免逻辑散落
// 2. 上下文感知（getSenderDisplayName / getSenderRealNickname / tryGetSenderDisplayName）：渲染时按 conversation 上下文实时查 friendStore / groupStore / userStore，让备注 / 群昵称 / 真实昵称变更后所有历史消息立即响应式刷新
//
// 命名约定：函数名一律使用 displayName，与 friend.displayName / member.displayUserName 字段对齐
// ====================================================================

import { useUserStore } from '@/store/modules/user'
import { ImConversationType } from './constants'
import { getCurrentUserId } from './storage'
import { useFriendStore } from '../home/store/friendStore'
import { useGroupStore } from '../home/store/groupStore'
import type { Friend, Group } from '../home/types'

/**
 * 私聊好友显示名：备注 > 真实昵称
 *
 * displayName 是「我对这个人的私人称呼」属于我的数据，删好友（DISABLE）也保留；删了再加回来时备注自然延续，历史消息里仍以备注辨识
 */
export function getFriendDisplayName(
  friend: Pick<Friend, 'nickname' | 'displayName'>
): string {
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

/** 群显示名：当前用户对该群的备注（displayGroupName） > 群名（name） */
export function getGroupDisplayName(group: Pick<Group, 'name' | 'displayGroupName'>): string {
  return group.displayGroupName || group.name
}

/**
 * 消息发送者显示名（严格版）：算不出真名返回 undefined
 *
 * 1. 给需要"是否真名"信号的调用方用——比如 conversationStore 决定要不要写 lastSenderDisplayName 快照、要不要触发 fetchGroupMembers 兜底拉成员
 * 2. GROUP 场景 member 缺失时所有 sender（含 self）都返回 undefined：self 在群里的"真名"是 displayUserName，members 没加载时不能拿 userStore.nickname 假装真名，否则 deriveLastSenderDisplayName 不会触发兜底拉成员，会一直显示真实昵称
 */
export function tryGetSenderDisplayName(
  senderId: number,
  conversationType: number,
  conversationTargetId: number
): string | undefined {
  // GROUP 路径完全不查 userStore——member 在不在群直接决定结果
  if (conversationType === ImConversationType.GROUP) {
    const group = useGroupStore().getGroup(conversationTargetId)
    const member = group?.members?.find((m) => m.userId === senderId)
    if (!member) {
      return undefined
    }
    const friend = useFriendStore().getFriend(senderId)
    return getMemberDisplayName(member, friend)
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
