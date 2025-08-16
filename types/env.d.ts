/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
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
  readonly VITE_GOVIEW_URL: string
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
