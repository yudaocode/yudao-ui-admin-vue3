<template>
  <!--
    群成员行形态（对应 boxim group/GroupMemberItem.vue）
    - 横排、带 hover 态；slot 放 checkbox / 操作按钮等
    - 与 ChatGroupMember 的差别：带 hover 态 + slot 扩展点，适合 selector / admin 列表
  -->
  <div
    class="im-group-member-item"
    :class="{ 'is-active': active }"
    :style="{ height: height + 'px' }"
    @click="$emit('click', member)"
  >
    <UserAvatar
      :id="member.userId"
      :url="member.headImage"
      :name="member.showNickName"
      :size="avatarSize"
      :clickable="false"
    />
    <div class="im-group-member-item__name" :style="{ lineHeight: height + 'px' }">
      {{ member.showNickName }}
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import UserAvatar from '../../../components/UserAvatar.vue'
import type { GroupMemberLite } from '../../chat/components/ChatGroupMember.vue'

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

<style scoped>
.im-group-member-item {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0 1px;
  padding: 0 15px;
  box-sizing: border-box;
  white-space: nowrap;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.im-group-member-item:hover {
  background-color: #f5f7fa;
}

.im-group-member-item.is-active {
  background-color: #e1eaf7;
}

.im-group-member-item__name {
  flex: 1;
  height: 100%;
  padding-left: 4px;
  overflow: hidden;
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
