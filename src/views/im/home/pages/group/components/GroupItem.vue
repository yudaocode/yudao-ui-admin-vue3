<template>
  <!--
    群单行项（对应 boxim group/GroupItem.vue）
    - 头像 + 群名
    - 选中态 active
  -->
  <div
    class="im-group-item"
    :class="{ 'is-active': active }"
    @click="$emit('click', group)"
  >
    <UserAvatar
      :url="group.headImage || group.headImageThumb"
      :name="group.showGroupName || group.name"
      :size="42"
      :clickable="false"
    />
    <div class="im-group-item__info">
      <div class="im-group-item__name">{{ group.showGroupName || group.name }}</div>
      <div v-if="group.memberCount != null" class="im-group-item__desc">
        {{ group.memberCount }} 位成员
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import UserAvatar from '../../../components/UserAvatar.vue'

defineOptions({ name: 'ImGroupItem' })

export interface GroupLite {
  id: string | number
  name?: string
  /** 带备注的展示名（如"我在群里的昵称"） */
  showGroupName?: string
  headImage?: string
  headImageThumb?: string
  memberCount?: number
  ownerId?: string | number
}

defineProps<{
  group: GroupLite
  active?: boolean
}>()

defineEmits<{
  click: [group: GroupLite]
}>()
</script>

<style scoped>
.im-group-item {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
  height: 50px;
  margin: 0 3px;
  padding: 5px 8px;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 10px;
  transition: background-color 0.15s;
}

.im-group-item:hover {
  background-color: #f5f7fa;
}

.im-group-item.is-active {
  background-color: #e1eaf7;
}

.im-group-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.im-group-item__name {
  overflow: hidden;
  font-size: 14px;
  color: #303133;
  text-overflow: ellipsis;
}

.im-group-item__desc {
  font-size: 12px;
  color: #909399;
}
</style>
