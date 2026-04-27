<template>
  <!--
    群成员宫格单元（对应 boxim group/GroupMember.vue）
    - 宫格展示的最小单位：50px 窄列，头像在上、名字在下
    - 被 GroupMemberSelector 右侧已选区、ChatGroupSide 群成员区循环使用
  -->
  <div class="im-group-member-grid">
    <UserAvatar
      :id="member.userId"
      :url="member.headImage"
      :name="member.showNickName"
      :size="38"
      :clickable="false"
    />
    <div class="im-group-member-grid__name">{{ member.showNickName }}</div>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import UserAvatar from '../../../components/UserAvatar.vue'
import type { GroupMemberLite } from '../../chat/components/ChatGroupMember.vue'

defineOptions({ name: 'ImGroupMemberGrid' })

defineProps<{
  member: GroupMemberLite
}>()
</script>

<style scoped>
.im-group-member-grid {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 54px;
  padding: 4px 2px;
}

.im-group-member-grid__name {
  width: 100%;
  margin-top: 2px;
  overflow: hidden;
  font-size: 12px;
  line-height: 18px;
  color: #606266;
  text-align: center;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
