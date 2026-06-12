export type LegacyLayoutType = 'classic' | 'topLeft' | 'top' | 'cutMenu'

export type VbenLayoutType =
  | 'header-mixed-nav'
  | 'header-nav'
  | 'header-sidebar-nav'
  | 'mixed-nav'
  | 'sidebar-mixed-nav'
  | 'sidebar-nav'

export type LayoutType = LegacyLayoutType | VbenLayoutType

export type LayoutRenderMode = LegacyLayoutType
