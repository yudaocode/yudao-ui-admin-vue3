<template>
  <!--
    IM 外层容器：聊天模块的全屏沉浸式壳
    - 左侧 ToolBar：头像 + 三 Tab（消息/好友/群聊）+ 底部设置
    - 右侧 <router-view>：按路由渲染 MessagePage / FriendPage / GroupPage
    - 挂载全局弹层：UserInfoCard / GroupInfoCard / ContextMenu
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
    <GroupInfoCard />
    <ContextMenu />

    <!-- 实时通话浮层；监听 rtcStore 全局状态，可在任意 IM 子页弹出 -->
    <RtcCallContainer />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

import { useAppStore } from '@/store/modules/app'
import { useConversationStore } from './store/conversationStore'
import { useImWebSocketStore } from './store/websocketStore'
import { useFriendStore } from './store/friendStore'
import { useGroupStore } from './store/groupStore'
import { useGroupRequestStore } from './store/groupRequestStore'
import { useDraftStore } from './store/draftStore'
import { useFaceStore } from './store/faceStore'
import { useMessagePuller } from './composables/useMessagePuller'
import { useMessageSender } from './composables/useMessageSender'
import { useVoicePlayer } from './composables/useVoicePlayer'
import { ImConversationType } from '../utils/constants'
import { StorageKeys } from '../utils/storage'
import type { Conversation } from './types'
import ToolBar from './components/ToolBar.vue'
import UserInfoCard from './components/user/UserInfoCard.vue'
import GroupInfoCard from './components/group/GroupInfoCard.vue'
import ContextMenu from './components/ContextMenu.vue'
import RtcCallContainer from './components/rtc/RtcCallContainer.vue'

defineOptions({ name: 'ImIndex' })

const route = useRoute()
const appStore = useAppStore()
const conversationStore = useConversationStore()
const webSocketStore = useImWebSocketStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const groupRequestStore = useGroupRequestStore()
const draftStore = useDraftStore()
const faceStore = useFaceStore()
const { pullOnce } = useMessagePuller()
const { readActive, syncPrivateReadStatus } = useMessageSender()
const voicePlayer = useVoicePlayer()

/** 初始化：先吃本地缓存让首屏立即渲染，再远端刷新最新数据，最后建实时通信拉离线消息 */
onMounted(async () => {
  // 0.1 系统表情包后台预拉：独立链路与首屏 IDB / 远端拉取并发，消除表情面板首次展开白屏；失败仅记日志，不阻塞主流程
  void faceStore.ensureFacePacks().catch((e) => console.warn('[IM] 后台预拉表情包失败', e))
  // 0.2 我管理的群下未处理加群申请：会话列表全局入口 / 群顶部横幅都从这份 store 派生；后台拉，不阻断
  void groupRequestStore.fetchUnhandledList().catch((e) =>
    console.warn('[IM] 拉取未处理加群申请失败', e)
  )

  // 1.1 整段 loading=true 阻断 saveConversations 抖动写盘 + WebSocket 普通消息进缓冲，避免 connect 到 pullOnce 之间收到的实时消息推进 maxId 导致 pull 跳过断线积压消息
  conversationStore.loading = true
  try {
    // 1.2 四个 store 并发从 IDB 读取本地缓存（loadConversations / loadDrafts 返回 void；load{Friends,Groups} 返回是否命中缓存）
    const [, hasCachedFriends, hasCachedGroups] = await Promise.all([
      conversationStore.loadConversations(),
      friendStore.loadFriends(),
      groupStore.loadGroups(),
      draftStore.loadDrafts()
    ])

    // 2.1 有缓存：异步背景刷新，失败仅记日志（IDB 数据已经够撑首屏，pullOnce 也能正常入库）
    // 2.2 无缓存（首登 / 切账号回切）：必须 await + 失败抛出中断本轮 onMounted，
    //     否则 pullOnce 会用 senderId 数字给会话起名落到 IDB 后续基本无法自愈；无缓存分支两个 fetch 并发 Promise.all 省一个 RTT
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

    // 3. 实时通信：建 WebSocket 长连接 + 拉离线消息（pullOnce finally 把 loading 归位）
    webSocketStore.connect()
    await pullOnce()

    // 4. 默认选中第一个会话；若置顶分组处于折叠态，需跳过被折叠隐藏的置顶项，避免自动展开折叠
    const sorted = conversationStore.getSortedConversations
    const firstVisible = pickFirstVisibleConversation(sorted)
    if (firstVisible && !conversationStore.activeConversation) {
      conversationStore.setActiveConversation(firstVisible)
    }
  } catch (e) {
    // 1. 首拉失败：手动复位 loading（pullOnce 没跑到，它的 finally 兜不到这里），否则后续 saveConversations 全被早 return 阻断
    // 2. WebSocket 不在这里 disconnect——路由离开会走 onUnmounted 自然清理，用户也可以刷新重试
    conversationStore.loading = false
    console.error('[IM] 初始化失败', e)
  }
})

/**
 * 选首屏自动激活的会话；置顶分组折叠时跳过被折叠隐藏的置顶项，避免激活后被自动顶上来
 *
 * 折叠态判定只看用户开关；非置顶 / 有未读的置顶项始终可见，全是可折叠置顶时回退到 sorted[0] 兜底
 */
function pickFirstVisibleConversation(sorted: Conversation[]): Conversation | undefined {
  if (sorted.length === 0) {
    return undefined
  }
  const pinnedExpanded = localStorage.getItem(StorageKeys.conversationPinnedExpanded) === 'true'
  if (pinnedExpanded) {
    return sorted[0]
  }
  return sorted.find((c) => !c.top || (!c.silent && (c.unreadCount || 0) > 0)) ?? sorted[0]
}

/** 标签关闭前 flush 草稿队列；debounce 默认 trail-edge 触发，最后一次输入可能还压在队列里 */
function onBeforeUnload() {
  draftStore.flushPersist()
}
window.addEventListener('beforeunload', onBeforeUnload)

/** 离开 IM 主壳：主动断 WebSocket（disconnect 内部已清掉 onclose 防自动重连）+ flush 草稿 + 表情缓存 reset + 解绑 unload + 停语音 */
onUnmounted(() => {
  webSocketStore.disconnect()
  draftStore.flushPersist()
  faceStore.reset()
  // 模块级单例 audio 不会随视图卸载自动停，主动停掉避免切路由后语音继续响
  voicePlayer.stop()
  window.removeEventListener('beforeunload', onBeforeUnload)
})

/**
 * 当前会话切换：本地清零未读 + 上报后端已读 + 私聊补"对方已读到哪条"
 *
 * type+targetId 一起监听：私聊与群聊 id 同号时切换也能触发；其它会话已读状态由 WebSocket
 * READ / RECEIPT 事件被动同步。私聊补一次拉对方已读位置，弥补离线 / 多端漏掉的 RECEIPT 推送
 */
watch(
  () => [
    conversationStore.activeConversation?.type,
    conversationStore.activeConversation?.targetId
  ],
  async ([type, targetId]) => {
    if (!targetId) {
      return
    }
    // 本地清零未读 + 上报后端已读，让其它端 / 对方 UI 同步
    await readActive()
    // 私聊补一次"对方已读到哪条"，弥补离线 / 多端漏掉的 RECEIPT 推送
    if (type === ImConversationType.PRIVATE) {
      void syncPrivateReadStatus(targetId)
    }
  }
)

/**
 * 浏览器标签 title 拼上未读数前缀；例：(63条未读)芋道源码
 *
 * 路由切换时 router.afterEach 会调 useTitle 重置 title；用 nextTick 排在它之后再覆盖
 * 一并监听 route.fullPath，IM 子路由切换（消息 / 通讯录）也能重新加上前缀
 */
watch(
  [() => conversationStore.getTotalUnread, () => route.fullPath],
  ([count]) => {
    nextTick(() => {
      const base = appStore.getTitle
      document.title = count > 0 ? `(${count > 99 ? '99+' : count}条未读)${base}` : base
    })
  },
  { immediate: true }
)
</script>
