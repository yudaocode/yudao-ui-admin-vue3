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
// TODO @AI：webSocketStore 全称更合适。
const wsStore = useImWebSocketStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const { pullOnce } = useMessagePuller()
const { readActive, syncPrivateReadStatus } = useMessageSender()

/** 初始化：本地缓存恢复 → 远端通信/同步 → 默认视图 */
// TODO @AI：上面的“初始化：本地缓存恢复 → 远端通信/同步 → 默认视图”，有点不好理解。
onMounted(async () => {
  // TODO @AI：WS 全称 WebSocket，不要缩写。其他地方也是
  // loading=true 整段阻断 saveConversations 抖动写盘 + WS 普通消息进缓冲，
  // 避免 connect 到 pullOnce 之间收到的实时消息推进 maxId 导致 pull 跳过断线积压消息
  conversationStore.loading = true
  try {
    // TODO @AI：1 和 2，是不是改成 1.1 1.2；先拉取本地缓存。拉不到在拉远端数据。感觉更清晰一些。
    // 1. IDB 并发恢复（loadConversations 返回 void；load{Friends,Groups} 返回是否有缓存）
    const [, hasCachedFriends, hasCachedGroups] = await Promise.all([
      conversationStore.loadConversations(),
      friendStore.loadFriends(),
      groupStore.loadGroups()
    ])

    // TODO @AI：SWR 这个注释，看看怎么更好的理解。
    // TODO @AI：下面这个注释，感觉没啥层次感。
    // 2. SWR 刷新：有缓存背景刷；无缓存必须 await + 抛错中断——否则 pullOnce 会用 senderId
    //    数字给会话起名落到 IDB 后续很难自愈。无缓存分支两个 fetch 并发 Promise.all 省一个 RTT
    const requiredFetches: Promise<unknown>[] = []
    if (hasCachedFriends) {
      void friendStore.fetchFriends().catch((e) => console.warn('[IM] 后台刷好友失败', e))
    } else {
      requiredFetches.push(friendStore.fetchFriends())
    }
    if (hasCachedGroups) {
      void groupStore.fetchGroups().catch((e) => console.warn('[IM] 后台刷群列表失败', e))
    } else {
      requiredFetches.push(groupStore.fetchGroups())
    }
    if (requiredFetches.length > 0) {
      await Promise.all(requiredFetches)
    }
    // TODO @AI：3.1 3.2 是不是一起。一个是 websocket 加载数据；一个是加载离线消息。本质是解决实时通信；
    // 3. 数据就绪后再 connect——无缓存 fetch 失败会走外层 catch 提前 return，避免 WS 已连
    //    但 friend/group store 空，handle*Message 用 senderId 数字落库
    wsStore.connect()
    // 4. 拉离线消息；pullOnce finally 里把 loading 归位
    await pullOnce()

    // 5. 默认选中第一个会话
    const sorted = conversationStore.getSortedConversations
    if (sorted.length > 0 && !conversationStore.activeConversation) {
      conversationStore.setActiveConversation(sorted[0])
    }
  } catch (e) {
    // TODO @AI：注释可以写的超过一行；尽量换行的时候，是一个事情写完，不然读起来很累。【其他地方也是！！！】例子如下：
    // TODO ！首拉失败：手动复位 loading（pullOnce 没跑到，它的 finally 兜不到这里），否则后续 saveConversations 全被早 return 阻断。
    // TODO WS 不在这里 disconnect —— 路由离开走 onUnmounted 自然清理，用户也可以刷新重试
    // 首拉失败：手动复位 loading（pullOnce 没跑到，它的 finally 兜不到这里），
    // 否则后续 saveConversations 全被早 return 阻断。WS 不在这里 disconnect——
    // 路由离开走 onUnmounted 自然清理，用户也可以刷新重试
    conversationStore.loading = false
    console.error('[IM] 初始化失败', e)
  }
})

/** 离开 IM 主壳：主动断 WS（disconnect 内部已清掉 onclose 防自动重连） */
onUnmounted(() => {
  wsStore.disconnect()
})

// TODO @AI：要说下，当前对话的处理。因为不涉及其他对话呀。
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
