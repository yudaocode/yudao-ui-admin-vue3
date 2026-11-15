declare module 'vue' {
  export interface GlobalComponents {
    Icon: (typeof import('@/components/Icon'))['Icon']
    DictTag: (typeof import('@/components/DictTag'))['DictTag']
    Permission: (typeof import('@/components/Permission'))['Permission']
  }
}

export {}
