import ContextMenu from './src/ContextMenu.vue'
import { ElDropdown } from 'element-plus'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

// 与上游一致的类型入口；类型定义在 ./src/types（参考上游 4f8330a4f）。ContextMenuSchema 为上游名称，与原 contextMenuSchema 相同
export type { contextMenuSchema, contextMenuSchema as ContextMenuSchema } from './src/types'

export interface ContextMenuExpose {
  elDropdownMenuRef: ComponentRef<typeof ElDropdown>
  tagItem: RouteLocationNormalizedLoaded
}

export { ContextMenu }
