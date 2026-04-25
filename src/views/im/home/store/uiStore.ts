import { defineStore } from 'pinia'
import { reactive } from 'vue'

import type { UserInfo } from '../types'

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
    user: null as UserInfo | null,
    position: { x: 0, y: 0 }
  })

  /** 打开用户名片 */
  function openUserInfoCard(user: UserInfo, position: { x: number; y: number }) {
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
