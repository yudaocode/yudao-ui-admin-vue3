<template>
  <!--
    群成员选择面板：用于「移除成员 / 设置管理员 / 转让群主 / 禁言成员」等场景
    - 左：搜索 + 群成员列表（圆形勾选）
    - 右：已选数标题 + 已选成员（list / grid 两种形态可配，默认 list 对齐微信新视觉）
    - Panel 不带 el-dialog 壳；dialog 由业务壳持有
    - 三态语义：hide > locked > disabled
  -->
  <div class="flex h-full">
    <!-- 左栏 -->
    <div
      class="flex flex-col flex-1 min-w-0 border-r border-r-solid border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-light)]"
    >
      <!-- 搜索框 -->
      <div class="flex-shrink-0 px-3 py-2">
        <el-input v-model="keyword" placeholder="搜索成员" clearable>
          <template #prefix>
            <Icon icon="ant-design:search-outlined" />
          </template>
        </el-input>
      </div>

      <div class="flex-1 min-h-0">
        <PagedScroller :items="shownMembers" :page-size="30" item-key="userId">
          <template #default="{ item }">
            <GroupMemberItem
              :member="item as GroupMemberLite"
              :height="46"
              @click="handleToggle(item as GroupMemberLite)"
            >
              <span
                class="flex flex-shrink-0 justify-center items-center w-5 h-5 rounded-full transition-colors"
                :class="getCheckClass(item as GroupMemberLite)"
              >
                <Icon
                  v-if="isSelected(item as GroupMemberLite) || isLocked(item as GroupMemberLite)"
                  icon="ant-design:check-outlined"
                  :size="12"
                  color="#fff"
                />
              </span>
            </GroupMemberItem>
          </template>
        </PagedScroller>
      </div>
    </div>

    <!-- 右栏 -->
    <div class="flex flex-col flex-1 min-w-0">
      <!-- 标题：已选数；高度对齐左侧 input default（32px） -->
      <div
        class="flex-shrink-0 h-12 px-4 leading-[3rem] border-b border-b-solid text-13px text-[var(--el-text-color-secondary)] border-[var(--el-border-color-lighter)]"
      >
        已选择 {{ selectedCount }} 位成员
      </div>

      <el-scrollbar class="flex-1">
        <!-- list 形态：纵向行，每行带 × 移除（locked 不渲染 ×） -->
        <template v-if="selectedDisplay === 'list'">
          <div
            v-for="member in selectedMembers"
            :key="member.userId"
            class="flex gap-2.5 items-center px-4 py-2"
          >
            <UserAvatar
              :id="member.userId"
              :url="member.avatar"
              :name="member.nickname"
              :size="36"
              :clickable="false"
            />
            <span
              class="flex-1 min-w-0 overflow-hidden text-sm truncate text-[var(--el-text-color-primary)]"
            >
              {{ member.showName }}
            </span>
            <Icon
              v-if="!isLocked(member)"
              icon="ant-design:close-outlined"
              :size="14"
              class="flex-shrink-0 cursor-pointer transition-colors text-[var(--el-text-color-placeholder)] hover:text-[var(--el-color-danger)]"
              @click="handleToggle(member)"
            />
          </div>
        </template>

        <!-- grid 形态：宫格预览；非 locked 成员右上角叠加 × 移除（locked 不渲染） -->
        <div v-else class="flex flex-wrap p-2.5">
          <GroupMemberGrid v-for="member in selectedMembers" :key="member.userId" :member="member">
            <Icon
              v-if="!isLocked(member)"
              icon="ant-design:close-circle-filled"
              :size="16"
              class="absolute top-0 right-0 cursor-pointer transition-colors text-[var(--el-text-color-placeholder)] hover:text-[var(--el-color-danger)]"
              @click="handleToggle(member)"
            />
          </GroupMemberGrid>
        </div>

        <div
          v-if="selectedMembers.length === 0"
          class="py-10 text-13px text-center text-[var(--el-text-color-disabled)]"
        >
          请从左侧选择成员
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { CommonStatusEnum } from '@/utils/constants'
import GroupMemberItem from '../group/GroupMemberItem.vue'
import GroupMemberGrid from '../group/GroupMemberGrid.vue'
import UserAvatar from '../user/UserAvatar.vue'
import PagedScroller from '../PagedScroller.vue'
import { useSelectedItems } from '../../composables/useSelectedItems'
import type { GroupMemberLite } from '../group/GroupMember.vue'

defineOptions({ name: 'ImGroupMemberPickerPanel' })

const props = withDefaults(
  defineProps<{
    /** 群成员列表 */
    members: GroupMemberLite[]
    /** 已选 userId（v-model）；按数组顺序即为点击顺序 */
    selectedIds: number[]
    /** 锁定 userId：默认勾选、不可取消、计入已选数 */
    lockedIds?: number[]
    /** 禁用 userId：列表里展示置灰、不可勾选、不计入已选数 */
    disabledIds?: number[]
    /** 隐藏 userId：不展示（hide > locked > disabled） */
    hideIds?: number[]
    /** 已选数上限；不传或 <=0 时不限 */
    maxSize?: number
    /** 已选区展示形态：默认 list 对齐微信新视觉 */
    selectedDisplay?: 'list' | 'grid'
  }>(),
  {
    lockedIds: () => [],
    disabledIds: () => [],
    hideIds: () => [],
    maxSize: 0,
    selectedDisplay: 'list'
  }
)

const emit = defineEmits<{
  'update:selectedIds': [value: number[]]
}>()

const message = useMessage()

const keyword = ref('')

/** userId → member 映射，已选反查 / 三态判定共用 */
const byId = computed(() => {
  const map = new Map<number, GroupMemberLite>()
  for (const member of props.members) {
    map.set(member.userId, member)
  }
  return map
})

const hideSet = computed(() => new Set(props.hideIds))
const lockedSet = computed(() => new Set(props.lockedIds))
const disabledSet = computed(() => new Set(props.disabledIds))
const selectedSet = computed(() => new Set(props.selectedIds))

/** 当前展示的成员：剔除 hideIds、剔除已退群（DISABLE）、按关键字大小写无关过滤 */
const shownMembers = computed(() => {
  const keywordLower = keyword.value.trim().toLowerCase()
  return props.members.filter(
    (member) =>
      !hideSet.value.has(member.userId) &&
      member.status !== CommonStatusEnum.DISABLE &&
      (!keywordLower || member.showName.toLowerCase().includes(keywordLower))
  )
})

/** 已选数 + 已选成员列表：三态优先级 + 顺序拼接由 useSelectedItems 统一承担 */
const { selectedCount, selectedItems: selectedMembers } = useSelectedItems<GroupMemberLite>(
  () => props.selectedIds,
  () => props.lockedIds,
  () => props.disabledIds,
  () => props.hideIds,
  byId
)

/** 是否被锁定 */
function isLocked(member: GroupMemberLite): boolean {
  return lockedSet.value.has(member.userId)
}

/** 是否被禁用：locked / hide 已被前置过滤，剩下的才算 disabled */
function isDisabled(member: GroupMemberLite): boolean {
  return !lockedSet.value.has(member.userId) && disabledSet.value.has(member.userId)
}

/** 是否选中：locked 视为永远选中 */
function isSelected(member: GroupMemberLite): boolean {
  return selectedSet.value.has(member.userId)
}

/** 圆形勾选指示器的 class */
function getCheckClass(member: GroupMemberLite): string {
  if (isLocked(member) || isSelected(member)) {
    return 'bg-[#07c160] border border-solid border-[#07c160]'
  }
  if (isDisabled(member)) {
    return 'bg-[var(--el-fill-color)] border border-solid border-[var(--el-border-color)]'
  }
  return 'border border-solid border-[var(--el-border-color)] bg-[var(--el-bg-color)]'
}

/** 切换选中态：locked / disabled 不响应；右栏 × / 行 click 都走这里 */
function handleToggle(member: GroupMemberLite) {
  if (isLocked(member) || isDisabled(member)) {
    return
  }
  const next = [...props.selectedIds]
  const index = next.indexOf(member.userId)
  if (index >= 0) {
    next.splice(index, 1)
  } else {
    if (props.maxSize > 0 && selectedCount.value >= props.maxSize) {
      message.error(`最多选择 ${props.maxSize} 位成员`)
      return
    }
    next.push(member.userId)
  }
  emit('update:selectedIds', next)
}
</script>
