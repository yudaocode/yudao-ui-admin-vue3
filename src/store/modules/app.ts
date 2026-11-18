import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import { ElementPlusSize } from '@/types/elementPlus'
import { LayoutType } from '@/types/layout'
import { ThemeTypes } from '@/types/theme'
import { humpToUnderline, setCssVar } from '@/utils'
import { colorIsDark, getCssColorVariable, hexToRGB, lighten, mix } from '@/utils/color'
import { isHeaderNavLayout, normalizeLayout } from '@/utils/layout'
import { useCssVar } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { store } from '../index'

const { wsCache } = useCache()

/**
 * 主题分为主色、菜单、头部三部分：用户显式设置过的部分（customThemeParts）按已保存颜色以内联变量渲染；
 * 未设置的部分不写内联，由 var.css 按明暗提供默认值
 */
export type ThemePart = 'primary' | 'menu' | 'header'

const THEME_PARTS: ThemePart[] = ['primary', 'menu', 'header']

const THEME_PART_KEYS: Record<ThemePart, string[]> = {
  primary: ['elColorPrimary'],
  menu: [
    'leftMenuBorderColor',
    'leftMenuBgColor',
    'leftMenuBgLightColor',
    'leftMenuBgActiveColor',
    'leftMenuCollapseBgActiveColor',
    'leftMenuTextColor',
    'leftMenuTextActiveColor',
    'logoTitleTextColor',
    'logoBorderColor'
  ],
  header: ['topHeaderBgColor', 'topHeaderTextColor', 'topHeaderHoverColor', 'topToolBorderColor']
}

const getThemePart = (key: string): ThemePart | undefined =>
  THEME_PARTS.find((part) => THEME_PART_KEYS[part].includes(key))

const PRIMARY_LEVEL_VARS = [
  '--el-color-primary-light-3',
  '--el-color-primary-light-5',
  '--el-color-primary-light-7',
  '--el-color-primary-light-8',
  '--el-color-primary-light-9',
  '--el-color-primary-dark-2'
]

const removeCssVar = (prop: string) => {
  document.documentElement.style.removeProperty(prop)
}

/**
 * 已自定义的主题部分：无 THEME 缓存为全新默认（忽略残留标记）；
 * 有 THEME 缓存时只认合法标记，标记缺失或异常一律视为全部自定义，不按颜色推断用户意图
 */
const resolveCustomThemeParts = (): ThemePart[] => {
  if (!wsCache.get(CACHE_KEY.THEME)) {
    return []
  }
  const parts = wsCache.get(CACHE_KEY.THEME_CUSTOM_PARTS)
  if (Array.isArray(parts) && parts.every((part) => THEME_PARTS.includes(part))) {
    return THEME_PARTS.filter((part) => parts.includes(part))
  }
  return [...THEME_PARTS]
}

// 按菜单背景色推导菜单主题（原 setMenuTheme 规则，由 Setting 移入）
const getMenuThemeByColor = (color: string): Recordable => {
  const primaryColor = useCssVar('--el-color-primary', document.documentElement)
  const isDarkColor = colorIsDark(color)
  return {
    // 左侧菜单边框颜色
    leftMenuBorderColor: isDarkColor ? 'inherit' : '#eee',
    // 左侧菜单背景颜色
    leftMenuBgColor: color,
    // 左侧菜单浅色背景颜色
    leftMenuBgLightColor: isDarkColor ? lighten(color!, 6) : color,
    // 左侧菜单选中背景颜色
    leftMenuBgActiveColor: isDarkColor
      ? 'var(--el-color-primary)'
      : hexToRGB(primaryColor.value || '#409eff', 0.1),
    // 左侧菜单收起选中背景颜色
    leftMenuCollapseBgActiveColor: isDarkColor
      ? 'var(--el-color-primary)'
      : hexToRGB(primaryColor.value || '#409eff', 0.1),
    // 左侧菜单字体颜色
    leftMenuTextColor: isDarkColor ? '#bfcbd9' : '#333',
    // 左侧菜单选中字体颜色
    leftMenuTextActiveColor: isDarkColor ? '#fff' : 'var(--el-color-primary)',
    // logo字体颜色
    // 浅色菜单取上游浅色 Logo 标题色，避免继承暗色模式正文浅色字后在白底上不可读
    logoTitleTextColor: isDarkColor ? '#fff' : '#172033',
    // logo边框颜色
    logoBorderColor: isDarkColor ? color : '#eee'
  }
}

// 按头部背景色推导头部主题（原 setHeaderTheme 规则）
const getHeaderThemeByColor = (color: string): Recordable => {
  const isDarkColor = colorIsDark(color)
  return {
    topHeaderBgColor: color,
    topHeaderTextColor: isDarkColor ? '#fff' : 'inherit',
    topHeaderHoverColor: isDarkColor ? lighten(color!, 6) : '#f6f6f6',
    topToolBorderColor: isDarkColor ? color : '#eee'
  }
}

interface AppState {
  breadcrumb: boolean
  breadcrumbIcon: boolean
  collapse: boolean
  uniqueOpened: boolean
  hamburger: boolean
  screenfull: boolean
  search: boolean
  size: boolean
  locale: boolean
  message: boolean
  im: boolean
  tagsView: boolean
  tagsViewImmerse: boolean
  tagsViewIcon: boolean
  logo: boolean
  fixedHeader: boolean
  greyMode: boolean
  pageLoading: boolean
  layout: LayoutType
  title: string
  isDark: boolean
  currentSize: ElementPlusSize
  sizeMap: ElementPlusSize[]
  mobile: boolean
  footer: boolean
  theme: ThemeTypes
  customThemeParts: ThemePart[]
  fixedMenu: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => {
    return {
      sizeMap: ['default', 'large', 'small'],
      mobile: false, // 是否是移动端
      title: import.meta.env.VITE_APP_TITLE, // 标题
      pageLoading: false, // 路由跳转loading

      breadcrumb: true, // 面包屑
      breadcrumbIcon: true, // 面包屑图标
      // 折叠菜单：刷新后恢复桌面端上次的折叠状态，只认布尔 true
      collapse: wsCache.get(CACHE_KEY.COLLAPSE) === true,
      uniqueOpened: false, // 是否只保持一个子菜单的展开
      hamburger: true, // 折叠图标
      screenfull: true, // 全屏图标
      search: true, // 搜索图标
      size: true, // 尺寸图标
      locale: true, // 多语言图标
      message: true, // 消息图标
      im: true, //IM即时通讯图标
      tagsView: true, // 标签页
      tagsViewImmerse: false, // 标签页沉浸
      tagsViewIcon: true, // 是否显示标签图标
      logo: true, // logo
      fixedHeader: true, // 固定toolheader
      footer: true, // 显示页脚
      greyMode: false, // 是否开始灰色模式，用于特殊悼念日
      fixedMenu: wsCache.get(CACHE_KEY.FIXED_MENU) || false, // 是否固定菜单

      layout: normalizeLayout(wsCache.get(CACHE_KEY.LAYOUT)), // layout布局
      isDark: wsCache.get(CACHE_KEY.IS_DARK) || false, // 是否是暗黑模式
      currentSize: wsCache.get(CACHE_KEY.CURRENT_SIZE) || 'default', // 组件尺寸
      // 已显式自定义的主题部分（见 resolveCustomThemeParts），只有显式设置主题时才会增加
      customThemeParts: resolveCustomThemeParts(),
      // 已保存的主题缓存原样使用；仅无缓存时采用默认主题对象（仅作展示与拷贝，未自定义的部分不按它渲染）：
      // 主色 #409eff + 浅色菜单（选中背景为主色 10%，Logo 标题 #172033）
      theme: wsCache.get(CACHE_KEY.THEME) || {
        // 主题色
        elColorPrimary: '#409eff',
        // 左侧菜单边框颜色
        leftMenuBorderColor: '#eee',
        // 左侧菜单背景颜色
        leftMenuBgColor: '#fff',
        // 左侧菜单浅色背景颜色
        leftMenuBgLightColor: '#fff',
        // 左侧菜单选中背景颜色
        leftMenuBgActiveColor: 'RGBA(64,158,255,0.1)',
        // 左侧菜单收起选中背景颜色
        leftMenuCollapseBgActiveColor: 'RGBA(64,158,255,0.1)',
        // 左侧菜单字体颜色
        leftMenuTextColor: '#333',
        // 左侧菜单选中字体颜色
        leftMenuTextActiveColor: 'var(--el-color-primary)',
        // logo字体颜色
        logoTitleTextColor: '#172033',
        // logo边框颜色
        logoBorderColor: '#eee',
        // 头部背景颜色
        topHeaderBgColor: '#fff',
        // 头部字体颜色（与 var.css 浅色默认一致）
        topHeaderTextColor: '#526077',
        // 头部悬停颜色
        topHeaderHoverColor: '#f4f5fb',
        // 头部边框颜色
        topToolBorderColor: '#eee'
      }
    }
  },
  getters: {
    getBreadcrumb(): boolean {
      return this.breadcrumb
    },
    getBreadcrumbIcon(): boolean {
      return this.breadcrumbIcon
    },
    getCollapse(): boolean {
      return this.collapse
    },
    getUniqueOpened(): boolean {
      return this.uniqueOpened
    },
    getHamburger(): boolean {
      return this.hamburger
    },
    getScreenfull(): boolean {
      return this.screenfull
    },
    getSize(): boolean {
      return this.size
    },
    getLocale(): boolean {
      return this.locale
    },
    getMessage(): boolean {
      return this.message
    },
    getIm(): boolean {
      return this.im
    },
    getTagsView(): boolean {
      return this.tagsView
    },
    getTagsViewImmerse(): boolean {
      return this.tagsViewImmerse
    },
    getTagsViewIcon(): boolean {
      return this.tagsViewIcon
    },
    getLogo(): boolean {
      return this.logo
    },
    getFixedHeader(): boolean {
      return this.fixedHeader
    },
    getGreyMode(): boolean {
      return this.greyMode
    },
    getFixedMenu(): boolean {
      return this.fixedMenu
    },
    getPageLoading(): boolean {
      return this.pageLoading
    },
    getLayout(): LayoutType {
      return this.layout
    },
    getTitle(): string {
      return this.title
    },
    getIsDark(): boolean {
      return this.isDark
    },
    getCurrentSize(): ElementPlusSize {
      return this.currentSize
    },
    getSizeMap(): ElementPlusSize[] {
      return this.sizeMap
    },
    getMobile(): boolean {
      return this.mobile
    },
    getTheme(): ThemeTypes {
      return this.theme
    },
    getCustomThemeParts(): ThemePart[] {
      return this.customThemeParts
    },
    getFooter(): boolean {
      return this.footer
    }
  },
  actions: {
    setPrimaryLight() {
      if (this.customThemeParts.includes('primary') && this.theme.elColorPrimary) {
        const elColorPrimary = this.theme.elColorPrimary
        // 与 Element Plus 一致：light-* 明色混白、暗色混暗色背景 #141414；dark-2 明色混黑、暗色混白
        const lightBase = this.isDark ? '#141414' : '#ffffff'
        const darkBase = this.isDark ? '#ffffff' : '#000000'
        const lightList = [3, 5, 7, 8, 9]
        lightList.forEach((v) => {
          setCssVar(`--el-color-primary-light-${v}`, mix(lightBase, elColorPrimary, v / 10))
        })
        setCssVar(`--el-color-primary-dark-2`, mix(darkBase, elColorPrimary, 0.2))
      } else {
        // 未自定义主色：主色及色阶由 var.css 按明暗提供
        removeCssVar('--el-color-primary')
        PRIMARY_LEVEL_VARS.forEach(removeCssVar)
      }
      this.setAllColorRgbVars()
    },

    // 处理element自带的主题色和辅助色的-rgb切换主题变化，如：--el-color-primary-rgb
    setAllColorRgbVars() {
      // 需要处理的颜色类型列表
      const colorTypes = ['primary', 'success', 'warning', 'danger', 'error', 'info']

      colorTypes.forEach((type) => {
        // 获取当前颜色值
        const colorValue = getCssColorVariable(`--el-color-${type}`)
        if (colorValue) {
          // 转换为rgba并提取RGB部分
          const rgbaString = hexToRGB(colorValue, 1)
          const rgbValues = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
          if (rgbValues) {
            const [, r, g, b] = rgbValues
            // 设置对应的RGB变量
            setCssVar(`--el-color-${type}-rgb`, `${r}, ${g}, ${b}`)
          }
        }
      })
    },
    setBreadcrumb(breadcrumb: boolean) {
      this.breadcrumb = breadcrumb
    },
    setBreadcrumbIcon(breadcrumbIcon: boolean) {
      this.breadcrumbIcon = breadcrumbIcon
    },
    setCollapse(collapse: boolean) {
      this.collapse = collapse
      // 移动端的自动收起、抽屉开合不写入缓存，避免回到桌面端刷新后沿用移动端状态
      if (!this.mobile) {
        wsCache.set(CACHE_KEY.COLLAPSE, collapse)
      }
    },
    setUniqueOpened(uniqueOpened: boolean) {
      this.uniqueOpened = uniqueOpened
    },
    setHamburger(hamburger: boolean) {
      this.hamburger = hamburger
    },
    setScreenfull(screenfull: boolean) {
      this.screenfull = screenfull
    },
    setSize(size: boolean) {
      this.size = size
    },
    setLocale(locale: boolean) {
      this.locale = locale
    },
    setMessage(message: boolean) {
      this.message = message
    },
    setIm(im: boolean) {
      this.im = im
    },
    setTagsView(tagsView: boolean) {
      this.tagsView = tagsView
    },
    setTagsViewImmerse(tagsViewImmerse: boolean) {
      this.tagsViewImmerse = tagsViewImmerse
    },
    setTagsViewIcon(tagsViewIcon: boolean) {
      this.tagsViewIcon = tagsViewIcon
    },
    setLogo(logo: boolean) {
      this.logo = logo
    },
    setFixedHeader(fixedHeader: boolean) {
      this.fixedHeader = fixedHeader
    },
    setGreyMode(greyMode: boolean) {
      this.greyMode = greyMode
    },
    setFixedMenu(fixedMenu: boolean) {
      wsCache.set(CACHE_KEY.FIXED_MENU, fixedMenu)
      this.fixedMenu = fixedMenu
    },
    setPageLoading(pageLoading: boolean) {
      this.pageLoading = pageLoading
    },
    setLayout(layout: LayoutType) {
      const normalizedLayout = normalizeLayout(layout)
      if (this.mobile && normalizedLayout !== 'sidebar-nav') {
        ElMessage.warning('移动端模式下不支持切换其他布局')
        return
      }
      this.layout = normalizedLayout
      // 移动端强制的 sidebar-nav 只用于显示，不写入缓存，回到桌面端由 restoreLayout 恢复用户选择的布局
      if (!this.mobile) {
        wsCache.set(CACHE_KEY.LAYOUT, this.layout)
      }
      // 顶部导航布局的菜单跟随头部色显示：只重新渲染，不改已保存的主题
      this.setCssVarTheme()
    },
    // 从移动端回到桌面端时，恢复缓存中用户选择的布局
    restoreLayout() {
      const layout = normalizeLayout(wsCache.get(CACHE_KEY.LAYOUT))
      if (layout !== this.layout) {
        this.layout = layout
        this.setCssVarTheme()
      }
    },
    setTitle(title: string) {
      this.title = title
    },
    setIsDark(isDark: boolean) {
      this.isDark = isDark
      if (this.isDark) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }
      wsCache.set(CACHE_KEY.IS_DARK, this.isDark)
      this.setPrimaryLight()
    },
    setCurrentSize(currentSize: ElementPlusSize) {
      this.currentSize = currentSize
      wsCache.set(CACHE_KEY.CURRENT_SIZE, this.currentSize)
    },
    setMobile(mobile: boolean) {
      this.mobile = mobile
    },
    // 显式设置主题（设置抽屉选色或外部直接调用）：合并并持久化，传入键所属部分记为已自定义，随后渲染
    setTheme(theme: ThemeTypes) {
      this.theme = Object.assign(this.theme, theme)
      Object.keys(theme).forEach((key) => {
        const part = getThemePart(key)
        if (part && !this.customThemeParts.includes(part)) {
          this.customThemeParts.push(part)
        }
      })
      wsCache.set(CACHE_KEY.THEME, this.theme)
      wsCache.set(CACHE_KEY.THEME_CUSTOM_PARTS, this.customThemeParts)
      this.setCssVarTheme()
    },
    // 按已保存主题渲染 CSS 变量；加载、切换布局、明暗切换等自动路径只走这里，不写缓存、不改主题对象。
    // 已自定义部分写内联变量，未自定义部分移除内联由 var.css 提供；顶部导航布局下菜单显示跟随头部色
    setCssVarTheme() {
      const isCustom = (part: ThemePart) => this.customThemeParts.includes(part)
      // 先渲染主色，菜单推导选中色时读取的是当前生效主色
      if (isCustom('primary') && this.theme.elColorPrimary) {
        setCssVar('--el-color-primary', this.theme.elColorPrimary)
      }
      this.setPrimaryLight()
      const headerColor = isCustom('header') ? this.theme.topHeaderBgColor : undefined
      let menuTheme: Recordable | undefined
      if (isHeaderNavLayout(this.layout)) {
        menuTheme = headerColor ? getMenuThemeByColor(headerColor) : undefined
      } else {
        menuTheme = isCustom('menu') ? this.theme : undefined
      }
      for (const key in this.theme) {
        const part = getThemePart(key)
        const prop = `--${humpToUnderline(key)}`
        if (part === 'menu') {
          menuTheme ? setCssVar(prop, menuTheme[key]) : removeCssVar(prop)
        } else if (!part || isCustom(part)) {
          setCssVar(prop, this.theme[key])
        } else {
          removeCssVar(prop)
        }
      }
      // 已自定义头部色时暗色工具栏保持原 --el-bg-color 底色；默认主题跟随头部色（var.css）
      if (isCustom('header')) {
        setCssVar('--top-tool-dark-bg-color', 'var(--el-bg-color)')
      } else {
        removeCssVar('--top-tool-dark-bg-color')
      }
    },
    // 按头部背景色设置头部主题（显式选色，由 Setting 移入）；
    // 顶部导航布局下菜单显示跟随头部色由 setCssVarTheme 渲染，不改写已保存的菜单色
    setHeaderTheme(color: string) {
      this.setTheme(getHeaderThemeByColor(color))
    },
    // 按菜单背景色设置菜单主题（显式选色，由 Setting 移入）
    setMenuTheme(color: string) {
      this.setTheme(getMenuThemeByColor(color))
    },
    setFooter(footer: boolean) {
      this.footer = footer
    }
  },
  persist: false
})

export const useAppStoreWithOut = () => {
  return useAppStore(store)
}
