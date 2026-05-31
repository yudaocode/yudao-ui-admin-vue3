<template>
  <!--
    通讯录 - 群聊分组
    - 自治：折叠状态 + 关键字过滤本组件内闭环
    - 选中态由父级 activeId 透传，避免子组件持有 selection 知识
  -->
  <div>
    <!-- 折叠分组头：字号对齐微信 PC（15px），hover 浅底色反馈 -->
    <div
      class="flex gap-2 items-center px-3.5 py-2.5 text-15px text-[var(--el-text-color-primary)] cursor-pointer select-none hover:bg-[var(--el-fill-color-light)]"
      @click="expanded = !expanded"
    >
      <Icon :icon="expanded ? 'ep:caret-bottom' : 'ep:caret-right'" :size="14" />
      <span class="flex-1">群聊</span>
      <span class="text-sm text-[var(--el-text-color-secondary)]">{{ filtered.length }}</span>
    </div>
    <div v-show="expanded">
      <GroupItem
        v-for="group in filtered"
        :key="group.id"
        :group="group"
        :active="activeId === group.id"
        @click="emit('select', group)"
      />
      <div
        v-if="filtered.length === 0"
        class="py-3 text-12px text-center text-[var(--el-text-color-disabled)]"
      >
        {{ keyword ? '没有匹配的群聊' : '暂无群聊' }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import GroupItem from '../../components/group/GroupItem.vue'
import type { GroupLite } from '../../types'

defineOptions({ name: 'ImContactGroupList' })

const props = defineProps<{
  groups: GroupLite[]
  keyword: string
  activeId?: number
}>()

const emit = defineEmits<{ select: [group: GroupLite] }>()

const expanded = ref(true)

const filtered = computed(() => {
  const keywordLower = props.keyword.trim().toLowerCase()
  if (!keywordLower) {
    return props.groups
  }
  return props.groups.filter((group) =>
    (group.showGroupName || group.name || '').toLowerCase().includes(keywordLower)
  )
})
</script>
