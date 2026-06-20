import type { LayoutRenderMode, LayoutType, VbenLayoutType } from '@/types/layout'

const DEFAULT_LAYOUT: VbenLayoutType = 'sidebar-nav'

const LEGACY_LAYOUT_MAP: Record<string, VbenLayoutType> = {
  classic: 'sidebar-nav',
  cutMenu: 'sidebar-mixed-nav',
  top: 'header-nav',
  topLeft: 'header-sidebar-nav'
}

const RENDER_MODE_MAP: Record<VbenLayoutType, LayoutRenderMode> = {
  'header-mixed-nav': 'cutMenu',
  'header-nav': 'top',
  'header-sidebar-nav': 'topLeft',
  'mixed-nav': 'topLeft',
  'sidebar-mixed-nav': 'cutMenu',
  'sidebar-nav': 'classic'
}

const VBEN_LAYOUTS = Object.keys(RENDER_MODE_MAP)

export const normalizeLayout = (layout?: LayoutType | string | null): VbenLayoutType => {
  if (!layout) {
    return DEFAULT_LAYOUT
  }
  if (VBEN_LAYOUTS.includes(layout)) {
    return layout as VbenLayoutType
  }
  return LEGACY_LAYOUT_MAP[layout] || DEFAULT_LAYOUT
}

export const getLayoutRenderMode = (layout?: LayoutType | string | null): LayoutRenderMode => {
  return RENDER_MODE_MAP[normalizeLayout(layout)]
}

export const isHeaderNavLayout = (layout?: LayoutType | string | null): boolean => {
  return normalizeLayout(layout) === 'header-nav'
}

export const isHorizontalMenuLayout = (layout?: LayoutType | string | null): boolean => {
  const normalized = normalizeLayout(layout)
  return (
    normalized === 'header-nav' || normalized === 'mixed-nav' || normalized === 'header-mixed-nav'
  )
}

export const isMixedNavLayout = (layout?: LayoutType | string | null): boolean => {
  return normalizeLayout(layout) === 'mixed-nav'
}

export const isHeaderMixedNavLayout = (layout?: LayoutType | string | null): boolean => {
  return normalizeLayout(layout) === 'header-mixed-nav'
}

export const isTwoColumnLayout = (layout?: LayoutType | string | null): boolean => {
  const normalized = normalizeLayout(layout)
  return normalized === 'sidebar-mixed-nav' || normalized === 'header-mixed-nav'
}

export const getRootPath = (path = '/'): string => {
  if (!path || path === '/') {
    return '/'
  }
  const segments = path.split('/').filter(Boolean)
  return segments.length ? `/${segments[0]}` : '/'
}
