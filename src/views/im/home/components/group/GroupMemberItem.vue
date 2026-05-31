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
    <!-- 角色标签：群主 / 管理员；普通成员不显示。仅在传入 member.role 时生效 -->
    <span
      v-if="roleLabel"
      class="px-1.5 py-px rounded text-xs whitespace-nowrap"
      :class="roleLabelClass"
    >
      {{ roleLabel }}
    </span>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import UserAvatar from '../user/UserAvatar.vue'
import type { GroupMemberLite } from './GroupMember.vue'
import { ImGroupMemberRole } from '../../../utils/constants'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'

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

/** 角色标签文案：普通成员不显示，其余取 im_group_member_role 字典 label */
const roleLabel = computed(() => {
  if (props.member.role == null || props.member.role === ImGroupMemberRole.NORMAL) {
    return ''
  }
  return getDictLabel(DICT_TYPE.IM_GROUP_MEMBER_ROLE, props.member.role)
})

/** 角色标签样式：群主用主色；管理员用次要色 */
const roleLabelClass = computed(() => {
  if (props.member.role === ImGroupMemberRole.OWNER) {
    return 'text-[var(--el-color-primary)] bg-[var(--el-color-primary-light-9)]'
  }
  return 'text-[var(--el-color-info)] bg-[var(--el-fill-color)]'
})
</script>
