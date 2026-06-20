<template>
  <!--
    名片消息气泡 / 名片预览卡（240px）：用户名片 + 群名片通用
    - 头像 + 名字 + 群成员数副标题（仅群名片）+ 底部分隔条「群名片 / 个人名片」
    - 用户名片把 :id 传给 UserAvatar 让点击 avatar 弹 UserInfoCard；群名片不传 id
    - 整卡 click 由调用方监听（@click），组件不内嵌业务逻辑
  -->
  <div
    class="flex flex-col w-[240px] rounded-md overflow-hidden bg-[var(--el-bg-color)] border border-solid border-[var(--el-border-color-lighter)]"
    :class="{ 'cursor-pointer': clickable }"
  >
    <div class="flex gap-2.5 items-center px-3 py-2.5">
      <UserAvatar
        :id="isUser ? card.targetId : undefined"
        :url="card.avatar"
        :name="card.name"
        :size="40"
        :clickable="false"
      />
      <div class="flex flex-col flex-1 min-w-0">
        <div class="text-sm font-medium truncate text-[var(--el-text-color-primary)]">
          {{ card.name }}
        </div>
        <div
          v-if="!isUser && card.memberCount"
          class="text-12px truncate text-[var(--el-text-color-placeholder)]"
        >
          {{ card.memberCount }} 人群聊
        </div>
      </div>
    </div>
    <div
      class="px-3 py-1 text-12px border-t border-t-solid text-[var(--el-text-color-placeholder)] border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-lighter)]"
    >
      {{ labelInfo.label }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import UserAvatar from '../user/UserAvatar.vue'
import { isPrivateConversation } from '@/views/im/utils/constants'
import { getCardLabelInfo, type CardMessage, type CardTarget } from '@/views/im/utils/message'

defineOptions({ name: 'ImCardBubble' })

const props = withDefaults(
  defineProps<{
    /** 名片数据；CardMessage（接收侧消息体）或 CardTarget（发送侧预览）共用结构 */
    card: CardMessage | CardTarget
    /** 是否显示 cursor: pointer；调用方负责绑 @click 监听 */
    clickable?: boolean
  }>(),
  { clickable: false }
)

/** 是否用户名片：决定 UserAvatar 是否带 id 触发 UserInfoCard */
const isUser = computed(() => isPrivateConversation(props.card.targetType))
/** 名片标签信息 */
const labelInfo = computed(() => getCardLabelInfo(props.card))
</script>
