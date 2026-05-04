<template>
  <!--
    通讯录 - 新的朋友分组
    - 自治：折叠状态由组件内 ref 管理，默认展开
    - 列表项展示：头像 + 昵称 + 申请理由 + 状态标签（等待验证 / 已添加 / 已拒绝）
    - 选中态由父级 activeId 透传；点击触发 select 事件
  -->
  <div>
    <!-- 折叠分组头 -->
    <!-- TODO @AI：tool 那，应该因为通讯录（新的朋友）有个计数；未处理数量； -->
    <div
      class="flex gap-2 items-center px-3.5 py-2.5 text-15px text-[var(--el-text-color-primary)] cursor-pointer select-none hover:bg-[var(--el-fill-color-light)]"
      @click="expanded = !expanded"
    >
      <Icon :icon="expanded ? 'ep:caret-bottom' : 'ep:caret-right'" :size="14" />
      <span class="flex-1">新的朋友</span>
      <!-- 红点：未处理且别人加我的 -->
      <el-badge v-if="unhandledCount > 0" :value="unhandledCount" :max="99" class="mr-2" />
      <span class="text-sm text-[var(--el-text-color-secondary)]">{{ requests.length }}</span>
    </div>
    <div v-show="expanded">
      <div
        v-for="request in requests"
        :key="request.id"
        class="flex gap-3 items-start px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-[var(--el-fill-color-light)]"
        :class="{
          'bg-[var(--el-fill-color)]': activeId === request.id
        }"
        @click="emit('select', request)"
      >
        <UserAvatar
          :id="getPeerUserId(request)"
          :url="getPeerAvatar(request)"
          :name="getPeerNickname(request)"
          :size="36"
          :clickable="false"
        />
        <div class="flex-1 min-w-0 overflow-hidden">
          <div class="flex justify-between gap-2 items-center">
            <span class="flex-1 text-sm font-medium truncate text-[var(--el-text-color-primary)]">
              {{ getPeerNickname(request) }}
            </span>
            <span class="flex-shrink-0 text-12px text-[var(--el-text-color-secondary)]">
              {{ statusLabel(request) }}
            </span>
          </div>
          <div
            v-if="request.applyContent"
            class="mt-0.5 text-xs truncate text-[var(--el-text-color-secondary)]"
          >
            {{ request.applyContent }}
          </div>
        </div>
      </div>
      <div
        v-if="requests.length === 0"
        class="py-3 text-12px text-center text-[var(--el-text-color-disabled)]"
      >
        暂无新的朋友
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import UserAvatar from '../../components/user/UserAvatar.vue'
import { getCurrentUserId } from '../../../utils/storage'
import type { FriendRequest } from '../../types'

defineOptions({ name: 'ImContactFriendRequestList' })

const props = defineProps<{
  requests: FriendRequest[]
  activeId?: number
}>()

const emit = defineEmits<{
  select: [request: FriendRequest]
}>()

const expanded = ref(true)
// TODO @AI：是不是不用 Number 处理；
const currentUserId = Number(getCurrentUserId() || 0)

/** 未处理 + 别人加我的（接收方=我）才进红点；我发起的不进 */
const unhandledCount = computed(
  () => props.requests.filter((r) => r.handleResult === 0 && r.toUserId === currentUserId).length
)

/** 列表项展示对端：fromUserId == 我 → 对端 = toUser；否则对端 = fromUser */
function getPeerUserId(request: FriendRequest): number {
  return request.fromUserId === currentUserId ? request.toUserId : request.fromUserId
}

// TODO @AI：注释
function getPeerNickname(request: FriendRequest): string {
  return request.fromUserId === currentUserId
    ? request.toNickname || String(request.toUserId)
    : request.fromNickname || String(request.fromUserId)
}

// TODO @AI：注释
function getPeerAvatar(request: FriendRequest): string | undefined {
  return request.fromUserId === currentUserId ? request.toAvatar : request.fromAvatar
}

/** 状态文案：未处理 / 同意 / 拒绝 */
// TODO @AI：字典添加下；这里简化掉；
function statusLabel(request: FriendRequest): string {
  if (request.handleResult === 1) {
    return '已添加'
  }
  if (request.handleResult === 2) {
    return '已拒绝'
  }
  return '等待验证'
}
</script>
