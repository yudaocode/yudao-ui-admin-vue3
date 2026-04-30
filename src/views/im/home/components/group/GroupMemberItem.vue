<template>
  <!--
    群成员行形态
    - 横排、带 hover 态；slot 放 checkbox / 操作按钮等
    - 与 GroupMember 的差别：带 hover 态 + slot 扩展点，适合 selector / admin 列表
  -->
  <div
    class="relative flex gap-2.5 items-center mx-px px-4 box-border whitespace-nowrap rounded cursor-pointer transition-colors hover:bg-[var(--el-fill-color)]"
    :class="{ '!bg-[#e1eaf7] dark:!bg-[var(--el-color-primary-light-8)]': active }"
    :style="{ height: height + 'px' }"
    @click="$emit('click', member)"
  >
    <UserAvatar
      :id="member.userId"
      :url="member.avatar"
      :name="member.nickname"
      :size="avatarSize"
      :clickable="false"
    />
    <div
      class="flex-1 h-full pl-1 overflow-hidden text-sm truncate text-[var(--el-text-color-primary)]"
      :style="{ lineHeight: height + 'px' }"
    >
      {{ member.showName }}
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import UserAvatar from '../user/UserAvatar.vue'
import type { GroupMemberLite } from './GroupMember.vue'

defineOptions({ name: 'ImGroupMemberItem' })

const props = withDefaults(
  defineProps<{
    member: GroupMemberLite
    height?: number
    active?: boolean
  }>(),
  {
    height: 50,
    active: false
  }
)

defineEmits<{
  click: [member: GroupMemberLite]
}>()

const avatarSize = computed(() => Math.ceil(props.height * 0.75))
</script>
