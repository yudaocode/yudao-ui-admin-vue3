// ====================================================================
// IM 用户展示名 utility
// ====================================================================
// 职责：统一回答"某个用户在 UI 上应该叫什么名字"。
// 拆两层：
//   1. 纯派生（getFriendDisplayName / getMemberDisplayName）—— 输入 friend / member 对象，
//      不查 store，给 store 内部 / 各种组装点复用，避免逻辑散落
//   2. 上下文感知（getSenderDisplayName / getSenderRealNickname）—— 渲染时按
//      conversation 上下文实时查 friendStore / groupStore / userStore，让备注 / 群昵称 /
//      真实昵称变更后所有历史消息立即刷新（不再写"快照"到 message 字段里）
//
// 命名约定：函数名一律使用 displayName，与 friend.displayName / member.displayUserName 字段对齐
// ====================================================================

import { useUserStore } from '@/store/modules/user'
import { ImConversationType } from './constants'
import { useFriendStore } from '../home/store/friendStore'
import { useGroupStore } from '../home/store/groupStore'
import type { Friend } from '../home/types'

/**
 * 取好友备注：删好友（DISABLE）也保留——displayName 是「我对这个人的私人称呼」，属于我的数据，
 * 不该跟好友关系一起清掉。删了再加回来时备注自然延续，历史消息里也仍以备注辨识
 */
function resolveRemark(friend?: Pick<Friend, 'displayName'> | null): string {
  return friend?.displayName || ''
}

/** 私聊好友显示名：备注 > 真实昵称 */
export function getFriendDisplayName(
  friend: Pick<Friend, 'nickname' | 'displayName'>
): string {
  return resolveRemark(friend) || friend.nickname
}

/**
 * 群成员显示名：好友备注 > 用户群备注（displayUserName） > 真实昵称
 *
 * WeChat 优先级：好友备注是"我"对该成员的私人称呼，最高优先；其次是 ta 在群内自定义昵称；最后真实昵称兜底。
 * 调用方拿到 friend 才传入，没拿到（陌生人）就只用 member 字段降级
 */
export function getMemberDisplayName(
  member: { displayUserName?: string; nickname: string },
  friend?: Pick<Friend, 'displayName'> | null
): string {
  return resolveRemark(friend) || member.displayUserName || member.nickname
}

/**
 * 消息发送者「显示名」：渲染时实时算，按 conversation 上下文走 WeChat 优先级
 *
 * - 自己（senderId === currentUserId）：当前用户真实昵称
 * - 私聊对方：好友备注 > 真实昵称
 * - 群聊对方：好友备注 > 群备注（displayUserName） > 真实昵称
 * - 查不到（store 还没 ready / 陌生人）：兜底返回 String(senderId)
 *
 * 用在所有"展示给用户看的发送人名"位置（气泡上方、群聊列表前缀、撤回 tip 等）。
 * 不写入 message 字段——改备注 / 改群昵称后历史消息能跟着 Vue 响应式自动刷新
 */
export function getSenderDisplayName(
  senderId: number,
  conversationType: number,
  conversationTargetId: number
): string {
  const userStore = useUserStore()
  const selfId = Number(userStore.getUser?.id) || 0

  // 群聊场景所有人（含自己）都走 member + friend 三级——自己设了"我在本群昵称"也要生效
  if (conversationType === ImConversationType.GROUP) {
    const group = useGroupStore().getGroup(conversationTargetId)
    const member = group?.members?.find((m) => m.userId === senderId)
    if (member) {
      const friend = useFriendStore().getFriend(senderId)
      return getMemberDisplayName(member, friend)
    }
    // member 没加载到——self 兜底走 userStore，对方兜底走 senderId 字符串
    if (senderId === selfId) {
      return userStore.getUser?.nickname || String(senderId)
    }
    return String(senderId)
  }

  // 私聊场景：自己直接走 userStore；对方走好友备注 > 真实昵称
  if (conversationType === ImConversationType.PRIVATE) {
    if (senderId === selfId) {
      return userStore.getUser?.nickname || String(senderId)
    }
    const friend = useFriendStore().getFriend(senderId)
    if (friend) {
      return getFriendDisplayName(friend)
    }
    return String(senderId)
  }

  // 未知会话类型兜底
  if (senderId === selfId) {
    return userStore.getUser?.nickname || String(senderId)
  }
  return String(senderId)
}

/**
 * 消息发送者「真实昵称」：永远是 nickname，不掺备注
 *
 * 专给 UserAvatar 的 :name 用——色卡首字母 / alt 文本要保证同一个人在所有界面一致，
 * 不能跟着备注变。私聊走 friend.nickname，群聊走 member.nickname，自己走 userStore
 */
export function getSenderRealNickname(
  senderId: number,
  conversationType: number,
  conversationTargetId: number
): string {
  const userStore = useUserStore()
  const selfId = Number(userStore.getUser?.id) || 0

  // 群聊先走 member.nickname（self 也是 member），异常时再走 self / senderId 兜底
  if (conversationType === ImConversationType.GROUP) {
    const group = useGroupStore().getGroup(conversationTargetId)
    const member = group?.members?.find((m) => m.userId === senderId)
    if (member?.nickname) {
      return member.nickname
    }
    if (senderId === selfId) {
      return userStore.getUser?.nickname || String(senderId)
    }
    return String(senderId)
  }

  if (conversationType === ImConversationType.PRIVATE) {
    if (senderId === selfId) {
      return userStore.getUser?.nickname || String(senderId)
    }
    const friend = useFriendStore().getFriend(senderId)
    return friend?.nickname || String(senderId)
  }

  if (senderId === selfId) {
    return userStore.getUser?.nickname || String(senderId)
  }
  return String(senderId)
}
