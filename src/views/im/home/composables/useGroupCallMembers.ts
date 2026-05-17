import { computed, type ComputedRef, type Ref } from 'vue'
import { useRtcStore } from '../store/rtcStore'
import { ImConversationType } from '../../utils/constants'
import { getSenderAvatar, getSenderDisplayName } from '../../utils/user'

/** 群通话成员视图模型：已加入 + 接入中；pending 头像 UI 半透明，joined 不透明 */
export interface GroupCallMember {
  userId: number
  nickname: string
  avatar?: string
  pending: boolean
}

/**
 * 群通话成员列表 computed：joined 在前，未 joined 的 invitee 在后；
 * 缓存为空（来电首屏渲染早于 syncGroupActiveCall 回写）时用 fallback 主叫兜底，避免空白
 *
 * @param groupId 群编号
 * @param fallbackInviterId 兜底主叫；缓存为空时填一个头像，标记为已加入而非 pending
 */
export function useGroupCallMembers(
  groupId: Ref<number | undefined>,
  fallbackInviterId?: Ref<number | undefined>
): ComputedRef<GroupCallMember[]> {
  const rtcStore = useRtcStore()
  return computed(() => {
    const gid = groupId.value
    if (!gid) {
      return []
    }
    const groupCall = rtcStore.getGroupCall(gid)
    const joinedIds = groupCall?.joinedUserIds ?? []
    const inviteeIds = groupCall?.inviteeIds ?? []
    const joinedSet = new Set(joinedIds)
    const orderedIds = [...joinedIds, ...inviteeIds.filter((id) => !joinedSet.has(id))]
    if (orderedIds.length > 0) {
      return orderedIds.map((userId) => toVM(userId, gid, !joinedSet.has(userId)))
    }
    const fallback = fallbackInviterId?.value
    return fallback ? [toVM(fallback, gid, false)] : []
  })
}

/** 把 userId 翻译成视图模型，统一走 user.ts helper 解析昵称 / 头像 */
function toVM(userId: number, groupId: number, pending: boolean): GroupCallMember {
  return {
    userId,
    nickname: getSenderDisplayName(userId, ImConversationType.GROUP, groupId),
    avatar: getSenderAvatar(userId, ImConversationType.GROUP, groupId) || undefined,
    pending
  }
}
