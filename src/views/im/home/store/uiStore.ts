import { defineStore, acceptHMRUpdate } from 'pinia'
import { reactive } from 'vue'

import type { User } from '../types'

/**
 * IM 全局 UI store
 *
 * 收纳标准：触发点 N 个、挂载点想保持 1 个的浮层状态。
 * 任意位置都可能 open，但 DOM 上只想留一份实例 → 走 store 派发，
 * 由 `Index.vue` 挂一个订阅组件统一渲染。
 */
export const useImUiStore = defineStore('imUiStore', () => {
  // ==================== 用户名片 UserInfoCard ====================
  // 用户名片悬浮卡：头像 / 昵称等触发点遍布会话、群成员、@ 选择器等列表，
  const userInfoCard = reactive({
    show: false,
    user: null as User | null,
    position: { x: 0, y: 0 }
  })

  /** 打开用户名片 */
  function openUserInfoCard(user: User, position: { x: number; y: number }) {
    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = document.documentElement.clientHeight
    userInfoCard.user = user
    userInfoCard.position.x = Math.min(position.x, viewportWidth - 350)
    userInfoCard.position.y = Math.min(position.y, viewportHeight - 220)
    userInfoCard.show = true
  }

  /** 关闭用户名片 */
  function closeUserInfoCard() {
    userInfoCard.show = false
  }

  // ==================== 右键菜单 ContextMenu ====================
  // 右键菜单虽然是一个组件挂在主壳上，但其触发时机分散在各列表
  interface ContextMenuItem {
    key: string
    name: string
    disabled?: boolean
    divided?: boolean // 是否在该项上方显示分割线（用于把"删除"等危险操作与上面的常规项隔开）
    danger?: boolean // 是否走危险操作样式（红色文字）
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

  return {
    userInfoCard,
    openUserInfoCard,
    closeUserInfoCard,

    contextMenu,
    openContextMenu,
    closeContextMenu
  }
})

// dev: 让 Pinia 的 actions / state 改动支持 HMR，避免每次改 store 都得硬刷
// 否则 Vite 把新模块推下来后，老 store 实例的 action 闭包仍指向旧函数体
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useImUiStore, import.meta.hot))
}
