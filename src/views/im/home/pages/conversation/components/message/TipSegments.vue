<!--
  会话内灰条 tip 片段渲染：依赖 activeConversation 推断点击落点的 addSource / 群名
-->
<template>
  <template v-for="(segment, _index) in segments" :key="_index">
    <span
      v-if="segment.type === 'mention'"
      class="cursor-pointer text-[#576b95] hover:underline"
      @click.stop="handleMentionClick(segment, $event)"
      >{{ segment.text }}</span
    >
    <span v-else>{{ segment.text }}</span>
  </template>
</template>

<script lang="ts" setup>
import { ImConversationType, ImFriendAddSource } from '@/views/im/utils/constants'
import type { TipSegment } from '@/views/im/utils/message'
import { getSenderAvatar } from '@/views/im/utils/user'
import type { User } from '../../../../types'
import { useConversationStore } from '../../../../store/conversationStore'
import { useFriendStore } from '../../../../store/friendStore'
import { useGroupStore } from '../../../../store/groupStore'
import { useImUiStore } from '../../../../store/uiStore'

defineOptions({ name: 'ImTipSegments' })

defineProps<{
  segments: TipSegment[]
}>()

/**
 * nickname 不传 friend.displayName / member.displayUserName 等备注，避免 UserInfo 首屏闪非真实昵称；
 * addSourceExtra 不用 conversation.name 兜底，conversation.name = groupRemark || group.name，
 * 个人备注会污染加好友话术
 */
function handleMentionClick(
  segment: { type: 'mention'; userId: number; text: string },
  event: MouseEvent
) {
  const conversation = useConversationStore().activeConversation
  const isGroup = conversation?.type === ImConversationType.GROUP
  const group = isGroup ? useGroupStore().getGroup(conversation!.targetId) : undefined
  const member = group?.members?.find((m) => m.userId === segment.userId)
  const friend = useFriendStore().getFriend(segment.userId)
  const user: User = {
    id: segment.userId,
    nickname: friend?.nickname || member?.nickname || segment.text,
    avatar: getSenderAvatar(
      segment.userId,
      conversation?.type ?? 0,
      conversation?.targetId ?? 0
    )
  }
  useImUiStore().openUserInfoCardAtEvent(
    user,
    event,
    isGroup ? ImFriendAddSource.GROUP : ImFriendAddSource.SEARCH,
    isGroup ? group?.name || '' : ''
  )
}
</script>
