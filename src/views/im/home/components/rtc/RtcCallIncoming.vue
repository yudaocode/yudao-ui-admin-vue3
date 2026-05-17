<template>
  <!--
    被叫端来电小条；参考微信，右上角固定悬浮；
    群聊：左头像 + 中（邀请人 + 文案一行 / 通话成员行）+ 右下角拒绝 / 接听；
    私聊：左头像 + 中（邀请人 + 文案两行）+ 右下角拒绝 / 接听
  -->
  <div
    class="fixed top-5 right-5 rounded-2xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.4)] z-[9999] flex gap-3 items-end p-3 text-white bg-[#2a2a2c]"
    :class="isGroup ? 'w-[360px]' : 'w-[340px]'"
  >
    <!-- 左：邀请者头像 -->
    <UserAvatar
      :url="payload?.inviterAvatar"
      :name="payload?.inviterNickname"
      :size="48"
      radius="8px"
      :clickable="false"
      class="self-start"
    />

    <!-- 中：群聊单行（邀请人 + 文案）+ 通话成员；私聊两行 -->
    <div class="flex flex-col flex-1 gap-1 self-start min-w-0">
      <template v-if="isGroup">
        <div class="text-sm truncate">
          <span class="font-medium">{{ payload?.inviterNickname || '对方' }}</span>
          <span class="ml-1 text-white/60">{{ tipText }}</span>
        </div>
        <template v-if="callMembers.length > 0">
          <div class="mt-1 text-xs text-white/45">通话成员</div>
          <div class="flex flex-wrap gap-1">
            <UserAvatar
              v-for="m in callMembers"
              :key="m.userId"
              :url="m.avatar"
              :name="m.nickname"
              :size="22"
              radius="4px"
              :clickable="false"
            />
          </div>
        </template>
      </template>
      <template v-else>
        <div class="text-sm font-medium truncate">{{ payload?.inviterNickname || '对方' }}</div>
        <div class="text-13px text-white/60 truncate">{{ tipText }}</div>
      </template>
    </div>

    <!-- 右下角：拒绝 / 接听 -->
    <div class="flex flex-shrink-0 gap-2 items-center">
      <button
        class="flex flex-shrink-0 justify-center items-center w-10 h-10 text-white rounded-full transition-opacity bg-[#f04a4a] hover:opacity-90"
        @click="$emit('reject')"
      >
        <Icon icon="ant-design:phone-outlined" :size="18" class="rotate-[135deg]" />
      </button>
      <button
        class="flex flex-shrink-0 justify-center items-center w-10 h-10 text-white rounded-full transition-opacity bg-[#2ec27e] hover:opacity-90"
        @click="$emit('accept')"
      >
        <Icon icon="ant-design:phone-outlined" :size="18" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import UserAvatar from '../user/UserAvatar.vue'
import { useRtcStore } from '../../store/rtcStore'
import type { ImRtcCallNotification } from '../../store/rtcStore'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { ImConversationType } from '@/views/im/utils/constants'
import { getCurrentUserId } from '@/views/im/utils/storage'
import { getSenderAvatar, getSenderDisplayName } from '@/views/im/utils/user'

const props = defineProps<{
  payload: ImRtcCallNotification | null
  isGroup?: boolean
}>()

defineEmits<{ accept: []; reject: [] }>()

const rtcStore = useRtcStore()

/** 来电提示文案；区分语音 / 视频 */
const tipText = computed(() => {
  if (!props.payload) return ''
  return `邀请你${getDictLabel(DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE, props.payload.mediaType)}通话`
})

/** 群聊：已加入通话的成员（自己除外）；缓存里 joinedUserIds 为空时降级到主叫，保证至少一头像 */
const callMembers = computed(() => {
  if (!props.isGroup) {
    return []
  }
  const groupId = props.payload?.groupId
  if (!groupId) {
    return []
  }
  const myId = getCurrentUserId()
  const joined = rtcStore.getGroupCall(groupId)?.joinedUserIds ?? []
  const ids = joined.length > 0
    ? joined.filter((id) => id !== myId)
    : props.payload?.inviterUserId
      ? [props.payload.inviterUserId]
      : []
  return ids.map((userId) => ({
    userId,
    nickname: getSenderDisplayName(userId, ImConversationType.GROUP, groupId),
    avatar: getSenderAvatar(userId, ImConversationType.GROUP, groupId) || undefined
  }))
})
</script>
