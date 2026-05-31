<template>
  <!--
    通讯录 - 新的朋友分组
    - 自治：折叠状态由组件内 ref 管理，默认展开
    - 列表项展示：头像 + 昵称 + 申请理由 + 状态标签（等待验证 / 已添加 / 已拒绝）
    - 选中态由父级 activeId 透传；点击触发 select 事件
  -->
  <div>
    <!-- 折叠分组头 -->
    <div
      class="flex gap-2 items-center px-3.5 py-2.5 text-15px text-[var(--el-text-color-primary)] cursor-pointer select-none hover:bg-[var(--el-fill-color-light)]"
      @click="expanded = !expanded"
    >
      <Icon :icon="expanded ? 'ep:caret-bottom' : 'ep:caret-right'" :size="14" />
      <span class="flex-1">新的朋友</span>
      <!-- 红点：未处理且别人加我的（统一走 store getter，避免本地 computed 跟 store 双口径） -->
      <el-badge
        v-if="friendStore.getUnhandledRequestCount > 0"
        :value="friendStore.getUnhandledRequestCount"
        :max="99"
        class="mr-2"
      />
      <span class="text-sm text-[var(--el-text-color-secondary)]">{{ requests.length }}</span>
    </div>
    <div v-show="expanded">
      <div
        v-for="{ request, peer } in enrichedRequests"
        :key="request.id"
        class="flex gap-3 items-start px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-[var(--el-fill-color-light)]"
        :class="{
          'bg-[var(--el-fill-color)]': activeId === request.id
        }"
        @click="emit('select', request)"
      >
        <UserAvatar
          :id="peer.id"
          :url="peer.avatar"
          :name="peer.nickname"
          :size="36"
          :clickable="false"
        />
        <div class="flex-1 min-w-0 overflow-hidden">
          <div class="flex justify-between gap-2 items-center">
            <span class="flex-1 text-sm font-medium truncate text-[var(--el-text-color-primary)]">
              {{ peer.nickname }}
            </span>
            <span class="flex-shrink-0 text-12px text-[var(--el-text-color-secondary)]">
              {{ getDictLabel(DICT_TYPE.IM_FRIEND_REQUEST_HANDLE_RESULT, request.handleResult) }}
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
      <!-- 加载更多：按本地最旧 requestId 游标分页拉下一批；hasMore=false 不展示 -->
      <div
        v-else-if="friendStore.hasMoreFriendRequests"
        class="py-2 text-12px text-center cursor-pointer text-[var(--el-text-color-secondary)] hover:bg-[var(--el-fill-color-light)]"
        @click="handleLoadMore"
      >
        {{ loadingMore ? '加载中…' : '加载更多' }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import UserAvatar from '../../components/user/UserAvatar.vue'
import { useFriendStore } from '../../store/friendStore'
import { getCurrentUserId } from '@/utils/auth'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import type { FriendRequest } from '../../types'

defineOptions({ name: 'ImContactFriendRequestList' })

const props = defineProps<{
  requests: FriendRequest[]
  activeId?: number
}>()

const emit = defineEmits<{
  select: [request: FriendRequest]
}>()

const friendStore = useFriendStore()
const expanded = ref(true)
/** 当前登录用户编号；用 computed 包一层，切账号后随 wsCache 重取，避免顶层求值在 keep-alive 实例里持有旧 id */
const currentUserId = computed(() => getCurrentUserId())

/** 列表项展示对端：fromUserId == 我 → 对端 = toUser；否则对端 = fromUser */
function getPeer(request: FriendRequest) {
  const sentByMe = request.fromUserId === currentUserId.value
  return {
    id: sentByMe ? request.toUserId : request.fromUserId,
    nickname: sentByMe
      ? request.toNickname || String(request.toUserId)
      : request.fromNickname || String(request.fromUserId),
    avatar: sentByMe ? request.toAvatar : request.fromAvatar
  }
}

/** 列表项预先附 peer 字段，模板里直接 {{ peer.xxx }} 一次成型，省 3 次 helper 调用 */
const enrichedRequests = computed(() =>
  props.requests.map((request) => ({ request, peer: getPeer(request) }))
)

/** 点击「加载更多」拉下一页；store 内部按 maxId 游标分页 + pending 去重 */
const loadingMore = ref(false)
async function handleLoadMore() {
  if (loadingMore.value) {
    return
  }
  loadingMore.value = true
  try {
    await friendStore.loadMoreFriendRequestList()
  } finally {
    loadingMore.value = false
  }
}
</script>
