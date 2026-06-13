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

import { countBy } from 'lodash-es'

import { useUserStore } from '@/store/modules/user'
import { CommonStatusEnum, SystemUserSexEnum } from '@/utils/constants'
import {
  ImConversationType,
  ImFriendAddSource,
  IM_AT_ALL_NICKNAME,
  IM_AT_ALL_USER_ID
} from './constants'
import { getCurrentUserId } from '@/utils/auth'
import { type MentionCandidate } from './message'
import { useConversationStore } from '../home/store/conversationStore'
import { useFriendStore } from '../home/store/friendStore'
import { useGroupStore } from '../home/store/groupStore'
import { useImUiStore } from '../home/store/uiStore'
import type { Conversation, Friend, Group, User } from '../home/types'

// 候选缺失场景的稳定空数组；让 textMentions computed 在非 TEXT / 非群聊 / 无 @ 时返回同一引用，
// MessageBubble 的 textSegments 才不会跟着无谓重算
const EMPTY_MENTIONS: MentionCandidate[] = []

/**
 * 是否历史退群群：joinStatus 为 DISABLE（已退群 / 被移除）
 *
 * /im/group/list 会带回历史退群群（供展示历史消息的群名 / 头像）；这类群应禁止发送、隐藏群操作入口、不可被转发 / 推荐选中
 */
export function isGroupQuit(group?: Group | null): boolean {
  return group?.joinStatus === CommonStatusEnum.DISABLE
}

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
 * 给需要"是否真名"信号的调用方用——比如 conversationStore 决定要不要写 lastSenderDisplayName 快照、要不要触发 fetchGroupMemberList 兜底拉成员
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
 * 群消息 @ mention 候选：按 atUserIds 反查群成员，name 收集所有可能字面量（含好友备注 / 群自定义昵称），displayName 统一指向真实昵称
 *
 * 同字面量被多 userId 共享时标记 ambiguous，由 parser 整段吃成普通文本；
 * 直接剔除会让短前缀候选（如「@张」）抢吃「@张三」的前缀，错绑到唯一的「张」用户
 */
export function getMentionCandidates(
  atUserIds: number[] | undefined,
  conversation: Pick<Conversation, 'type' | 'targetId'> | null | undefined
): MentionCandidate[] {
  if (!atUserIds || atUserIds.length === 0) {
    return EMPTY_MENTIONS
  }
  if (!conversation || conversation.type !== ImConversationType.GROUP) {
    return EMPTY_MENTIONS
  }
  // 群成员预建 Map，避免每个 atUserId 走一次 array find（@全体成员场景下成员数 × atUserIds 是 N²）
  const members = useGroupStore().getGroup(conversation.targetId)?.members || []
  const memberById = new Map(members.map((m) => [m.userId, m]))
  const friendStore = useFriendStore()
  const candidates: MentionCandidate[] = []
  const seen = new Set<string>()
  for (const userId of atUserIds) {
    // @全体成员是虚拟伪成员，userId = -1 在 group.members 里查不到，注入字面量「所有人」候选
    if (userId === IM_AT_ALL_USER_ID) {
      const key = `${IM_AT_ALL_USER_ID}#${IM_AT_ALL_NICKNAME}`
      if (!seen.has(key)) {
        seen.add(key)
        candidates.push({
          userId: IM_AT_ALL_USER_ID,
          name: IM_AT_ALL_NICKNAME,
          displayName: IM_AT_ALL_NICKNAME
        })
      }
      continue
    }
    const member = memberById.get(userId)
    const friend = friendStore.getFriend(userId)
    const nickname = (member?.nickname || friend?.nickname || '').trim()
    if (!nickname) {
      continue
    }
    for (const literal of [nickname, friend?.displayName, member?.displayUserName]) {
      const trimmed = (literal || '').trim()
      if (!trimmed) {
        continue
      }
      const key = `${userId}#${trimmed}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      candidates.push({ userId, name: trimmed, displayName: nickname })
    }
  }
  // seen 已保证 (userId, name) 唯一，所以 countBy 出来的同 name 计数 > 1 一定是跨 userId 歧义
  const nameCount = countBy(candidates, 'name')
  for (const candidate of candidates) {
    if (nameCount[candidate.name] > 1) {
      candidate.ambiguous = true
    }
  }
  return candidates
}

/**
 * 文本 / tip 里 mention 段点击的统一入口：派生 User 弹 UserInfoCard
 *
 * 头像走 getSenderAvatar；昵称取真实昵称，friend / member 都查不到时用 fallbackName 兜底（如灰条 tip 段的字面量文本）；
 * addSource 群聊带 GROUP + 群名（用于「加为好友」的来源 + 备注弹文案），私聊降级 SEARCH；
 * @全体成员 是广播 mention 没有具体用户实体，对齐微信 PC 不弹卡片
 */
export function openMentionUserInfoCardAtEvent(
  userId: number,
  event: MouseEvent,
  fallbackName?: string
): void {
  if (userId === IM_AT_ALL_USER_ID) {
    return
  }
  const conversation = useConversationStore().activeConversation
  const isGroup = conversation?.type === ImConversationType.GROUP
  const group = isGroup ? useGroupStore().getGroup(conversation!.targetId) : undefined
  const member = group?.members?.find((m) => m.userId === userId)
  const friend = useFriendStore().getFriend(userId)
  const user: User = {
    id: userId,
    nickname: friend?.nickname || member?.nickname || fallbackName || String(userId),
    avatar: getSenderAvatar(userId, conversation?.type ?? 0, conversation?.targetId ?? 0)
  }
  useImUiStore().openUserInfoCardAtEvent(
    user,
    event,
    isGroup ? ImFriendAddSource.GROUP : ImFriendAddSource.SEARCH,
    isGroup ? group?.name || '' : ''
  )
}

/** 性别图标；UNKNOWN / null / undefined 一律不展示，对齐微信留白 */
export function getGenderIcon(sex?: number): string {
  if (sex === SystemUserSexEnum.MALE) {
    return 'mdi:human-male'
  }
  if (sex === SystemUserSexEnum.FEMALE) {
    return 'mdi:human-female'
  }
  return ''
}

/** 性别图标主题色：男蓝、女粉 */
export function getGenderColor(sex?: number): string {
  if (sex === SystemUserSexEnum.MALE) {
    return '#5b97f5'
  }
  if (sex === SystemUserSexEnum.FEMALE) {
    return '#f56c92'
  }
  return ''
}

/** 头像色卡底色调色板（参考微信） */
const AVATAR_BG_COLORS = ['#07C160', '#1A95FF', '#FA9D3B', '#9163E0', '#F76760', '#1ABC9C']

/** 头像色卡文字：中文取首字、英文取前 2 字母大写、其他取首字大写、空名返回空串 */
export function getAvatarText(name?: string): string {
  const trimmed = name?.trim()
  if (!trimmed) {
    return ''
  }
  const first = trimmed.charAt(0)
  const code = first.charCodeAt(0)
  if (code >= 0x4e00 && code <= 0x9fa5) {
    return first
  }
  const letters = trimmed.match(/[A-Za-z]/g)
  if (!letters || letters.length === 0) {
    return first.toUpperCase()
  }
  return letters.slice(0, 2).join('').toUpperCase()
}

/** 头像色卡底色：按 name charCode 之和取调色板色，空名走默认灰 */
export function getAvatarBgColor(name?: string): string {
  if (!name) {
    return '#909399'
  }
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i)
  }
  return AVATAR_BG_COLORS[hash % AVATAR_BG_COLORS.length]
}
