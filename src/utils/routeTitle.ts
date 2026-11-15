import type { RouteMeta } from 'vue-router'
import { useI18n } from '@/hooks/web/useI18n'

// meta.titleSource 取值：title 为后端菜单原文（generateRoute 生成），展示时不翻译
export const BACKEND_TITLE_SOURCE = 'backend'

// title 是否为后端菜单原文：只看显式来源标记，不按字符串形状推断
export const isBackendTitle = (meta?: RouteMeta) => meta?.titleSource === BACKEND_TITLE_SOURCE

/**
 * 路由标题的展示文本（标签页、菜单、面包屑、页面标题、菜单搜索统一使用）。
 *
 * 后端菜单标题原样展示，即使形如语言 key（如 router.home）；
 * 其余标题（静态路由的语言 key、useTagsView.setTitle 设置的标题）沿用 useI18n 的 t，随语言切换更新
 */
export const getRouteTitle = (meta?: RouteMeta): string => {
  const title = meta?.title
  if (!title) return ''
  return isBackendTitle(meta) ? title : useI18n().t(title)
}
