<template>
  <!--
    群成员宫格单元
    - 宫格展示的最小单位：头像在上、名字在下；列宽 = size + 16，自适应 size 留呼吸空间
    - 被 GroupMemberPickerPanel 右侧已选区（grid 形态）、ConversationGroupSide 群成员区循环使用
  -->
  <div
    class="relative flex flex-col items-center px-0.5 py-1"
    :style="{ width: `${size! + 16}px` }"
  >
    <UserAvatar
      :id="member.userId"
      :url="member.avatar"
      :name="member.nickname"
      :size="size"
      :clickable="clickable"
      :add-source="ImFriendAddSource.GROUP"
      :add-source-extra="groupName"
    />
    <div
      class="w-full mt-1 overflow-hidden text-12px leading-[18px] text-center truncate text-[var(--el-text-color-regular)]"
    >
      {{ member.showName }}
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import UserAvatar from '../user/UserAvatar.vue'
import { ImFriendAddSource } from '../../../utils/constants'
import type { GroupMemberLite } from './GroupMember.vue'

defineOptions({ name: 'ImGroupMemberGrid' })

withDefaults(
  defineProps<{
    member: GroupMemberLite
    clickable?: boolean // 头像点击是否弹 UserInfoCard；选择器宫格里需要保持关闭，避免和勾选交互冲突
    size?: number // 头像像素大小；默认 38（兼容选择器右侧已选区），群信息抽屉传 50 对齐微信 PC
    groupName?: string // 群名：加好友时拼「我是 'XX 群' 的 YY」话术，落库 add_source=GROUP
  }>(),
  {
    clickable: false,
    size: 38,
    groupName: ''
  }
)
</script>
