<template>
  <!--
    IM 外层容器：聊天模块的全屏沉浸式壳
    - 左侧 ToolBar：头像 + 三 Tab（消息/好友/群聊）+ 底部设置
    - 右侧 <router-view>：按路由渲染 MessagePage / FriendPage / GroupPage
    - 挂载全局弹层：UserInfoCard / ContextMenu
  -->
  <div class="flex w-full h-full overflow-hidden">
    <ToolBar />
    <!--
      keep-alive 缓存子页面：
      - 切 Tab 不重建组件，MessagePanel 滚动位置、输入框草稿等 UI 状态不丢
      - Vue 3 里 keep-alive 不能直接包 <router-view>（会有警告），必须走 v-slot 拿 Component
    -->
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>

    <!-- 全局弹层：由 useImUiStore 统一调度 -->
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

/** 初始化：本地缓存恢复 → 远端通信/同步 → 默认视图 */
onMounted(async () => {
  // ========== 1. 本地状态准备 ==========
  // 1.1 整段初始化期间 loading=true：阻断 saveConversations 抖动写盘 + 让 WS 普通消息进缓冲区，
  //     避免 connect 后到 pullOnce 之间到达的实时消息推进 maxId，导致 pull 跳过断线积压消息
  conversationStore.loading = true
  // 1.2 从 IndexedDB 恢复本地会话数据（按会话分桶，需 await 以保证后续步骤拿到完整列表）
  await conversationStore.loadConversations()

  // ========== 2. 远端通信 + 数据同步 ==========
  // 2.1 建立 WebSocket 长连接（跨 Tab 持续保持，不因路由切换断开）
  wsStore.connect()
  // 2.2 预拉好友 / 群列表：必须 await，pullOnce 内部要靠 friendStore / groupStore 补会话 name/avatar；
  //     发送人名渲染时再走 utils/user 实时算，不依赖这里的 store 数据，但避免冷启动期间 ConversationItem 显示 senderId 数字
  await Promise.all([
    friendStore.loadFriends().catch((e) => console.warn('[IM] 预拉好友失败', e)),
    groupStore.loadGroups().catch((e) => console.warn('[IM] 预拉群列表失败', e))
  ])
  // 2.3 增量拉取离线消息（私聊 + 群聊，使用各自 minId 游标）；pullOnce finally 里把 loading 归位
  await pullOnce()

  // ========== 3. 默认视图 ==========
  // 3.1 默认选中第一个会话（仅在消息 Tab 可见）
  const sorted = conversationStore.getSortedConversations
  if (sorted.length > 0 && !conversationStore.activeConversation) {
    conversationStore.setActiveConversation(sorted[0])
  }
})

/** 离开 IM 主壳：主动断 WS（disconnect 内部已清掉 onclose 防自动重连） */
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
    // 本地清零未读 + 上报后端已读，让其它端 / 对方 UI 同步
    await readActive()
    // 私聊补一次"对方已读到哪条"，弥补离线 / 多端漏掉的 RECEIPT 推送
    if (conversationStore.activeConversation?.type === ImConversationType.PRIVATE) {
      void syncPrivateReadStatus(targetId)
    }
  }
)
</script>
