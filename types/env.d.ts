/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_PORT: number
  readonly VITE_OPEN: string
  readonly VITE_DEV: string
  readonly VITE_APP_CAPTCHA_ENABLE: string
  readonly VITE_APP_TENANT_ENABLE: string
  readonly VITE_APP_DEFAULT_LOGIN_TENANT: string
  readonly VITE_APP_DEFAULT_LOGIN_USERNAME: string
  readonly VITE_APP_DEFAULT_LOGIN_PASSWORD: string
  readonly VITE_APP_DOCALERT_ENABLE: string
  readonly VITE_BASE_URL: string
  readonly VITE_API_URL: string
  readonly VITE_BASE_PATH: string
  readonly VITE_DROP_DEBUGGER: string
  readonly VITE_DROP_CONSOLE: string
  readonly VITE_SOURCEMAP: string
  readonly VITE_OUT_DIR: string
  // 打包体积分析，仅 build 时为 'true' 才开启
  readonly VITE_USE_BUNDLE_ANALYZER?: string
  // CSS 分包开关，仅为 'false' 时合并为单个 CSS 文件，缺省时按 chunk 拆分
  readonly VITE_USE_CSS_SPLIT?: string
  // 是否使用在线图标，缺省时在线（按需请求 Iconify API）；仅为 'false' 时构建离线图标子集
  readonly VITE_USE_ONLINE_ICON?: string
  // 离线图标额外名称，逗号分隔的 prefix:name（如 mdi:home,tabler:ai），用于后台菜单等源码中没有字面量的图标
  readonly VITE_OFFLINE_ICONS?: string
  // Element Plus 全量样式，仅为 'true' 时一次性引入全量样式并关闭按需样式，缺省按需引入
  readonly VITE_USE_ALL_ELEMENT_PLUS_STYLE?: string
  // CSS 产物目标，逗号分隔（如 chrome87,safari14），仅影响 CSS 转换/压缩；缺省使用 Vite 默认目标
  readonly VITE_CSS_TARGET?: string
  // dev 启动后复制服务地址到剪贴板，取值 local / network，缺省不复制
  readonly VITE_DEV_URL_COPY?: string
  readonly VITE_GOVIEW_URL: string
  // 是否隐藏全局设置（顶部齿轮及设置抽屉），仅为 'true' 时隐藏，缺省时显示
  readonly VITE_HIDE_GLOBAL_SETTING?: string
  // API 加解密相关配置
  readonly VITE_APP_API_ENCRYPT_ENABLE: string
  readonly VITE_APP_API_ENCRYPT_HEADER: string
  readonly VITE_APP_API_ENCRYPT_ALGORITHM: string
  readonly VITE_APP_API_ENCRYPT_REQUEST_KEY: string
  readonly VITE_APP_API_ENCRYPT_RESPONSE_KEY: string
}

// 离线图标子集（build/vite/offlineIcons.ts 生成）
declare module 'virtual:offline-icons' {
  import type { IconifyJSON } from '@iconify/vue'
  // 是否为离线图标模式（VITE_USE_ONLINE_ICON=false）
  export const offline: boolean
  // 离线模式下需注册的图标子集；在线模式为空数组
  export const collections: IconifyJSON[]
}

// Element Plus 全量样式（build/vite/elementPlusStyle.ts 生成），仅作副作用导入
declare module 'virtual:element-plus-style' {}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
