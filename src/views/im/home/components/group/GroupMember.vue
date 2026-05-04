<template>
  <!--
    群成员单行
    跨子域复用：@候选 (MentionPicker) / 已读列表 (MessageReadStatus) / 群成员宫格 (ConversationGroupSide)
  -->
  <div
    class="relative flex items-center px-[5px] box-border whitespace-nowrap"
    :class="{ 'bg-[#e1eaf7] dark:bg-[var(--el-color-primary-light-9)]': active }"
    :style="{ height: height + 'px' }"
  >
    <UserAvatar
      :size="avatarSize"
      :name="member.nickname"
      :url="member.avatar"
      :clickable="clickable"
      :id="member.userId"
      :add-source="ImFriendAddSource.GROUP"
      :add-source-extra="groupName"
    />
    <div
      class="flex-1 h-full pl-2.5 overflow-hidden text-sm text-left truncate text-[var(--el-text-color-regular)]"
      :style="{ lineHeight: height + 'px' }"
    >
      {{ member.showName }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import UserAvatar from '../user/UserAvatar.vue'
import { ImFriendAddSource } from '../../../utils/constants'

defineOptions({ name: 'ImGroupMember' })

/** 群成员结构（跨多处使用，放这里做窄接口；独立于 types/index.ts） */
export interface GroupMemberLite {
  userId: number // 用户编号；特殊值见 IM_AT_ALL_USER_ID（@ 全体成员）
  nickname: string // 真实昵称：永远是用户的 nickname，专给 UserAvatar 色卡用，保证同一个人色卡首字母在所有界面一致
  showName: string // 展示昵称：好友备注 > 用户群备注（displayUserName） > 真实昵称（nickname），给"显示给用户看"的位置用（行内文字、@候选标签等）
  avatar?: string
  status?: number
  role?: number // 成员角色，仅在群信息抽屉等需要展示角色标签的场景透传；@候选 / 已读列表等场景可不传
}

const props = withDefaults(
  defineProps<{
    member: GroupMemberLite
    height?: number // 行高（px），影响头像大小
    active?: boolean // 选中态（@候选键盘高亮等）
    clickable?: boolean // 头像点击是否弹 UserInfoCard；@候选场景通常禁用（避免嵌套交互）
    groupName?: string // 群名：加好友时拼「我是 'XX 群' 的 YY」话术，落库 add_source=GROUP
  }>(),
  {
    height: 50,
    active: false,
    clickable: false,
    groupName: ''
  }
)

const avatarSize = computed(() => Math.ceil(props.height * 0.75))
</script>
