<!-- TODO @AI：文件名，是不是应该小写？ -->
<template>
  <!--
    IM 外层容器：聊天模块的全屏沉浸式壳
    - 左侧 ToolBar：头像 + 三 Tab（消息/好友/群聊）+ 底部设置
    - 右侧 <router-view>：按路由渲染 MessagePage / FriendPage / GroupPage
    - 挂载全局弹层：UserInfoCard / ContextMenu / ImageViewer
  -->
  <div class="flex w-full h-full overflow-hidden">
    <ToolBar />
    <!--
      keep-alive 缓存子页面：
      - 切 Tab 不重建组件，ChatPanel 滚动位置、输入框草稿等 UI 状态不丢
      - Vue 3 里 keep-alive 不能直接包 <router-view>（会有警告），必须走 v-slot 拿 Component
    -->
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>

    <!-- 全局弹层：由 useImUiStore 统一调度 -->
    <!-- TODO @AI：【是不是没必要】大图预览改为 <el-image :preview-src-list> 在调用方就地承接，不再全局挂 -->
    <UserInfoCard />
    <ContextMenu />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, watch } from 'vue'

import { useConversationStore } from './store/conversationStore'
import { useImWebSocketStore } from './store/websocketStore'
import { useFriendStore } from './store/friendStore'
import { useGroupStore } from './store/groupStore'
import { useMessagePuller } from './composables/useMessagePuller'
import { useMessageSender } from './composables/useMessageSender'
import { ImConversationType } from '../utils/constants'
import ToolBar from './components/ToolBar.vue'
import UserInfoCard from './components/UserInfoCard.vue'
import ContextMenu from './components/ContextMenu.vue'

defineOptions({ name: 'ImIndex' })

const conversationStore = useConversationStore()
const wsStore = useImWebSocketStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const { pullOnce } = useMessagePuller()
const { readActive, syncPrivateReadStatus } = useMessageSender()

// TODO @AI：注释
onMounted(async () => {
  // 1. 从 IndexedDB 恢复本地会话数据（按会话分桶，需 await 以保证后续步骤拿到完整列表）
  await conversationStore.loadConversations()
  // 2. 建立 WebSocket 长连接（跨 Tab 持续保持，不因路由切换断开）
  wsStore.connect()
  // 3. 预拉好友 / 群列表：必须 await，pullOnce 内部要靠 friendStore / groupStore 补 senderNickName 和会话 name/avatar
  await Promise.all([
    friendStore.loadFriends().catch((e) => console.warn('[IM] 预拉好友失败', e)),
    groupStore.loadGroups().catch((e) => console.warn('[IM] 预拉群列表失败', e))
  ])
  // 4. 增量拉取离线消息（私聊 + 群聊，使用各自 minId 游标）
  await pullOnce()
  // 5. 默认选中第一个会话（仅在消息 Tab 可见）
  const sorted = conversationStore.getSortedConversations
  if (sorted.length > 0 && !conversationStore.activeConversation) {
    conversationStore.setActiveConversation(sorted[0])
  }
})

// TODO @AI：注释
onUnmounted(() => {
  wsStore.disconnect()
})

/**
 * 会话切换时自动标记为已读 + 私聊下拉对方已读位置：
 * - 立刻清零本地未读
 * - 同步后端已读状态；服务端会广播 READ/RECEIPT 事件通知其它端与对方
 * - 私聊额外补一次「对方已读到哪条」，弥补离线 / 多端漏掉的 RECEIPT 推送
 */
watch(
  () => conversationStore.activeConversation?.targetId,
  async (targetId) => {
    if (!targetId) {
      return
    }
    // TODO @AI：这里增加注释
    await readActive()
    // TODO @AI：这里增加注释
    if (conversationStore.activeConversation?.type === ImConversationType.PRIVATE) {
      void syncPrivateReadStatus(targetId)
    }
  }
)
</script>
