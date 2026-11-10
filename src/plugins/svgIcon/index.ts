import 'virtual:svg-icons-register'

import { addCollection, iconLoaded } from '@iconify/vue'
import { collections, offline } from 'virtual:offline-icons'
import epIcons from '@iconify/json/json/ep.json'
import faIcons from '@iconify/json/json/fa.json'
import faSolidIcons from '@iconify/json/json/fa-solid.json'

addCollection(epIcons)
addCollection(faIcons)
addCollection(faSolidIcons)

// 离线图标（VITE_USE_ONLINE_ICON=false）：构建期按源码字面量与 VITE_OFFLINE_ICONS 生成的子集，
// 在首次渲染前同步注册；在线模式下为空，图标仍按需请求 Iconify API
collections.forEach((collection) => addCollection(collection))

// 是否为离线图标模式
export const isOfflineIcon = offline

// 图标数据是否已注册（含别名）；离线模式下未注册的图标不能交给 IconifyIcon，否则会请求 Iconify API
export const isIconAvailable = (name?: string) => !!name && iconLoaded(name)

const warnedIcons = new Set<string>()

// 离线模式缺少图标时，开发环境每个名称只提示一次
export const warnUnavailableIcon = (name?: string) => {
  if (!import.meta.env.DEV || !name || warnedIcons.has(name)) return
  warnedIcons.add(name)
  console.warn(
    `[Icon] 离线图标模式未包含图标 "${name}"：请在源码中以字面量引用，或加入 VITE_OFFLINE_ICONS 后重新构建`
  )
}
