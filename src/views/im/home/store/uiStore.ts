import { defineStore, acceptHMRUpdate } from 'pinia'
import { reactive, ref } from 'vue'

import { ImFriendAddSource } from '../../utils/constants'
import type { GroupLite, User } from '../types'

/**
 * IM 全局 UI store
 *
 * 收纳标准：触发点 N 个、挂载点想保持 1 个的浮层状态。
 * 任意位置都可能 open，但 DOM 上只想留一份实例 → 走 store 派发，
 * 由 `Index.vue` 挂一个订阅组件统一渲染。
 */
export const useImUiStore = defineStore('imUiStore', () => {
  // ==================== 用户名片 UserInfoCard ====================
  // 用户名片悬浮卡

  const userInfoCard = reactive({
    show: false,
    user: null as User | null,
    position: { x: 0, y: 0 },
    // addSource / addSourceExtra 跟随触发点带入「加好友」来源（群成员入口 = GROUP + 群名；其余默认搜索）
    addSource: ImFriendAddSource.SEARCH as number,
    addSourceExtra: '' as string
  })

  /** 打开用户名片 */
  function openUserInfoCard(
    user: User,
    position: { x: number; y: number },
    addSource: number = ImFriendAddSource.SEARCH,
    addSourceExtra: string = ''
  ) {
    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = document.documentElement.clientHeight
    userInfoCard.user = user
    userInfoCard.position.x = Math.min(position.x, viewportWidth - 350)
    userInfoCard.position.y = Math.min(position.y, viewportHeight - 220)
    userInfoCard.addSource = addSource
    userInfoCard.addSourceExtra = addSourceExtra
    userInfoCard.show = true
  }

  /** 鼠标点击位置 + 20px 横向偏移打开名片：避免名片直接覆盖触发元素，对齐头像 / 名片消息等点击交互的统一观感 */
  function openUserInfoCardAtEvent(
    user: User,
    e: MouseEvent,
    addSource: number = ImFriendAddSource.SEARCH,
    addSourceExtra: string = ''
  ) {
    openUserInfoCard(user, { x: e.clientX + 20, y: e.clientY }, addSource, addSourceExtra)
  }

  /** 关闭用户名片 */
  function closeUserInfoCard() {
    userInfoCard.show = false
  }

  // ==================== 群名片 GroupInfoCard ====================

  const groupInfoCard = reactive({
    show: false,
    group: null as GroupLite | null,
    position: { x: 0, y: 0 }
  })

  /** 鼠标点击位置 + 20px 横向偏移打开群名片，对齐 UserInfoCard 的统一观感 */
  function openGroupInfoCardAtEvent(group: GroupLite, e: MouseEvent) {
    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = document.documentElement.clientHeight
    groupInfoCard.group = group
    groupInfoCard.position.x = Math.min(e.clientX + 20, viewportWidth - 350)
    groupInfoCard.position.y = Math.min(e.clientY, viewportHeight - 220)
    groupInfoCard.show = true
  }

  /** 关闭群名片 */
  function closeGroupInfoCard() {
    groupInfoCard.show = false
  }

  // ==================== 右键菜单 ContextMenu ====================
  // 右键菜单虽然是一个组件挂在主壳上，但其触发时机分散在各列表
  interface ContextMenuItem {
    key: string
    name: string
    disabled?: boolean
    divided?: boolean // 是否在该项上方显示分割线（用于把"删除"等危险操作与上面的常规项隔开）
    danger?: boolean // 是否走危险操作样式（红色文字）
    icon?: string // 可选 iconify 图标名（如 ant-design:delete-outlined）；不传则不渲染前置图标
  }

  const contextMenu = reactive({
    show: false,
    position: { x: 0, y: 0 },
    items: [] as ContextMenuItem[],
    /** 选中回调：每次 open 时由调用方传入 */
    onSelect: null as ((item: ContextMenuItem) => void) | null
  })

  /** 打开右键菜单 */
  function openContextMenu(
    position: { x: number; y: number },
    items: ContextMenuItem[],
    onSelect: (item: ContextMenuItem) => void
  ) {
    contextMenu.position = position
    contextMenu.items = items
    contextMenu.onSelect = onSelect
    contextMenu.show = true
  }

  /** 关闭右键菜单 */
  function closeContextMenu() {
    contextMenu.show = false
    contextMenu.onSelect = null
  }

  // ==================== 消息 Tab 跳转下一未读 ====================
  // 在 ImHomeConversation 页面再次点击工具栏「消息」时触发；
  // 通过递增 nonce 让 conversation/index.vue 的 watch 感知后执行滚动 + 高亮

  const nextUnreadJumpNonce = ref(0)

  /** 请求滚动到下一个未读会话（含免打扰） */
  function requestNextUnreadJump() {
    nextUnreadJumpNonce.value++
  }

  return {
    userInfoCard,
    openUserInfoCard,
    openUserInfoCardAtEvent,
    closeUserInfoCard,

    groupInfoCard,
    openGroupInfoCardAtEvent,
    closeGroupInfoCard,

    contextMenu,
    openContextMenu,
    closeContextMenu,

    nextUnreadJumpNonce,
    requestNextUnreadJump
  }
})

// dev: 让 Pinia 的 actions / state 改动支持 HMR，避免每次改 store 都得硬刷
// 否则 Vite 把新模块推下来后，老 store 实例的 action 闭包仍指向旧函数体
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useImUiStore, import.meta.hot))
}
