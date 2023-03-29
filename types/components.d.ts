declare module 'vue' {
  export interface GlobalComponents {
    Icon: typeof import('@/components/Icon')['Icon']
    DictTag: typeof import('@/components/DictTag')['DictTag']
  }
}

export {}
