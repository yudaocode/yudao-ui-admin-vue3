<template>
  <!-- TODO @AI：不够对齐微信。如果让你改时，需要提醒我给你图片 -->
  <!--
    私聊侧边抽屉
    - 抽屉形态：受 v-model 控制，由父组件 MessagePanel 管理开关
    - 顶部：好友头像 + 昵称
    - 操作：消息免打扰 / 置顶聊天
    - 与会话列表右键菜单同语义：免打扰联动 friendStore.setMuted
  -->
  <el-drawer v-model="visible" :with-header="false" direction="rtl" size="320px" append-to-body>
    <div class="flex flex-col h-full p-2.5">
      <!-- 头像 + 昵称 -->
      <div v-if="friend" class="flex flex-col gap-1.5 items-start">
        <UserAvatar
          :id="friend.friendUserId"
          :url="friend.avatar"
          :name="friend.nickname"
          :size="56"
          :clickable="false"
        />
        <div
          class="overflow-hidden text-sm font-medium truncate text-[var(--el-text-color-primary)] max-w-full"
        >
          {{ friend.nickname }}
        </div>
      </div>

      <el-divider class="im-conversation-private-side__divider" />

      <!-- 操作项 -->
      <div class="flex flex-col gap-3.5 text-sm">
        <div class="flex items-center justify-between">
          <span class="text-[var(--el-text-color-primary)]">消息免打扰</span>
          <el-switch :model-value="!!conversation?.muted" @change="onMutedChange" />
        </div>
        <div class="flex items-center justify-between">
          <span class="text-[var(--el-text-color-primary)]">置顶聊天</span>
          <el-switch :model-value="!!conversation?.top" @change="onTopChange" />
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import { useConversationStore } from '../../../../store/conversationStore'
import { useFriendStore } from '../../../../store/friendStore'
import { ImConversationType } from '../../../../../utils/constants'
import type { Conversation, Friend } from '../../../../types'
import UserAvatar from '../../../../components/UserAvatar.vue'

defineOptions({ name: 'ImConversationPrivateSide' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean // 抽屉开关（v-model）
    conversation?: Conversation | null // 当前会话（取置顶 / 免打扰态）
    friend?: Friend // 对方好友信息（取头像 / 昵称）
  }>(),
  {
    modelValue: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const conversationStore = useConversationStore()
const friendStore = useFriendStore()

function onMutedChange(value: boolean | string | number) {
  if (!props.conversation) {
    return
  }
  const next = !!value
  conversationStore.setMuted(props.conversation.type, props.conversation.targetId, next)
  if (props.conversation.type === ImConversationType.PRIVATE) {
    friendStore.setMuted(props.conversation.targetId, next)
  }
}

function onTopChange(value: boolean | string | number) {
  if (!props.conversation) {
    return
  }
  conversationStore.setTop(props.conversation.type, props.conversation.targetId, !!value)
}
</script>

<style scoped>
/* el-divider 默认 margin 较大，压成 8px，和群聊抽屉视觉对齐 */
.im-conversation-private-side__divider {
  margin: 8px 0;
}
</style>
