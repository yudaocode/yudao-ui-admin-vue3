import ContextMenu from './src/ContextMenu.vue'
import type { ElDropdown } from 'element-plus'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

// 与上游一致的类型入口；类型定义在 ./src/types（参考上游 4f8330a4f）。ContextMenuSchema 为上游名称的主定义，contextMenuSchema 为兼容别名
export type { ContextMenuSchema, contextMenuSchema } from './src/types'

export interface ContextMenuExpose {
  elDropdownMenuRef: ComponentRef<typeof ElDropdown>
  tagItem: RouteLocationNormalizedLoaded
}

export { ContextMenu }
