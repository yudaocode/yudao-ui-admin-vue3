import ConfigGlobal from './src/ConfigGlobal.vue'

// 与上游一致的类型入口；类型定义在 ./src/types（参考上游 4f8330a4f）。ConfigGlobalProps 为上游 14d2bec7b 改用的名称，与 ConfigGlobalTypes 相同
export type { ConfigGlobalTypes, ConfigGlobalTypes as ConfigGlobalProps } from './src/types'

export { ConfigGlobal }
