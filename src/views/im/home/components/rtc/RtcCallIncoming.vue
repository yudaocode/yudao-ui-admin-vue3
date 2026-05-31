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

    <!-- 中：群聊单行（邀请人 + 文案）+ 通话成员；私聊两行（名 / 文案） -->
    <div class="flex flex-col flex-1 gap-1 self-start min-w-0">
      <!-- 名 + 文案：群单行内联，私聊上下两行 -->
      <div v-if="isGroup" class="text-sm truncate">
        <span class="font-medium">{{ payload?.inviterNickname || '对方' }}</span>
        <span class="ml-1 text-white/60">{{ tipText }}</span>
      </div>
      <template v-else>
        <div class="text-sm font-medium truncate">{{ payload?.inviterNickname || '对方' }}</div>
        <div class="text-13px text-white/60 truncate">{{ tipText }}</div>
      </template>

      <!-- 群通话成员行；私聊无；接入中的人半透明展示 -->
      <template v-if="isGroup && callMembers.length > 0">
        <div class="mt-1 text-xs text-white/45">通话成员</div>
        <div class="flex flex-wrap gap-1">
          <UserAvatar
            v-for="member in callMembers"
            :key="member.userId"
            :url="member.avatar"
            :name="member.nickname"
            :size="22"
            radius="4px"
            :clickable="false"
            :class="{ 'opacity-50': member.pending }"
            :title="member.pending ? `${member.nickname}（接入中）` : member.nickname"
          />
        </div>
      </template>
    </div>

    <!-- 右下角：拒绝 / 接听 -->
    <div class="flex flex-shrink-0 gap-2 items-center">
      <button
        class="flex flex-shrink-0 justify-center items-center w-10 h-10 text-white rounded-full transition-opacity bg-[#f04a4a] hover:opacity-90"
        :class="{ 'opacity-60 cursor-not-allowed': rejectDisabled }"
        :disabled="rejectDisabled"
        @click="$emit('reject')"
      >
        <Icon icon="ant-design:phone-outlined" :size="18" class="rotate-[135deg]" />
      </button>
      <button
        class="flex flex-shrink-0 justify-center items-center w-10 h-10 text-white rounded-full transition-opacity bg-[#2ec27e] hover:opacity-90"
        :class="{ 'opacity-60 cursor-not-allowed': acceptDisabled }"
        :disabled="acceptDisabled"
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
import type { ImRtcCallNotification } from '../../store/rtcStore'
import { useGroupCallMembers } from '../../composables/useGroupCallMembers'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'

const props = defineProps<{
  payload: ImRtcCallNotification | null
  isGroup?: boolean
  accepting?: boolean
  rejecting?: boolean
}>()

defineEmits<{ accept: []; reject: [] }>()

/** 来电提示文案；区分语音 / 视频 */
const tipText = computed(() => {
  if (!props.payload) return ''
  return `邀请你${getDictLabel(DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE, props.payload.mediaType)}通话`
})

/** 接听按钮禁用态 */
const acceptDisabled = computed(() => !!props.accepting || !!props.rejecting)

/** 拒绝按钮禁用态 */
const rejectDisabled = computed(() => !!props.rejecting || !!props.accepting)

/** 群通话成员；缓存为空时用 INVITE 载荷里的主叫兜底，避免空白 */
const callMembers = useGroupCallMembers(
  computed(() => (props.isGroup ? props.payload?.groupId : undefined)),
  computed(() => props.payload?.inviterUserId)
)
</script>
