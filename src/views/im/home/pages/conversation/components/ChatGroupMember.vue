<template>
  <!--
    群成员单行
    跨子域复用：@候选 (MentionPicker) / 已读列表 (MessageReadStatus) / 群成员宫格 (ChatGroupSide)
  -->
  <div
    class="relative flex items-center px-[5px] box-border whitespace-nowrap"
    :class="{ 'bg-[#e1eaf7] dark:bg-[var(--el-color-primary-light-9)]': active }"
    :style="{ height: height + 'px' }"
  >
    <UserAvatar
      :size="avatarSize"
      :name="member.showNickName"
      :url="member.showImage"
      :clickable="clickable"
      :id="member.userId"
    />
    <div
      class="flex-1 h-full pl-2.5 overflow-hidden text-sm text-left truncate text-[var(--el-text-color-regular)]"
      :style="{ lineHeight: height + 'px' }"
    >
      {{ member.showNickName }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import UserAvatar from '../../../components/UserAvatar.vue'

defineOptions({ name: 'ImChatGroupMember' })

/** 群成员结构（跨多处使用，放这里做窄接口；独立于 types/index.ts） */
export interface GroupMemberLite {
  userId: number // 用户编号；特殊值见 IM_AT_ALL_USER_ID（@ 全体成员）
  showNickName: string // 展示昵称：优先群备注，再群昵称，再用户昵称
  showImage?: string
  // 群成员状态：直接透传 GroupMember.status；消费方（过滤已退群成员等）按
  // CommonStatusEnum.DISABLE 自行判断，不在 producer 端预翻译成 quit
  status?: number
}

const props = withDefaults(
  defineProps<{
    member: GroupMemberLite
    height?: number // 行高（px），影响头像大小
    active?: boolean // 选中态（@候选键盘高亮等）
    clickable?: boolean // 头像点击是否弹 UserInfoCard；@候选场景通常禁用（避免嵌套交互）
  }>(),
  {
    height: 50,
    active: false,
    clickable: false
  }
)

const avatarSize = computed(() => Math.ceil(props.height * 0.75))
</script>
