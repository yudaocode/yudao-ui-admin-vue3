import ContextMenu from './src/ContextMenu.vue'
import { ElDropdown } from 'element-plus'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

// 与上游一致的类型入口；类型定义仍在 @/types/contextMenu
export type { contextMenuSchema as ContextMenuSchema } from '@/types/contextMenu'

export interface ContextMenuExpose {
  elDropdownMenuRef: ComponentRef<typeof ElDropdown>
  tagItem: RouteLocationNormalizedLoaded
}

export { ContextMenu }
