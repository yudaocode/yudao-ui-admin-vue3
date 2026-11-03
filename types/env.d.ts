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

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
