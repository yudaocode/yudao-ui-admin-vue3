import Infotip from './src/Infotip.vue'

// 与上游一致的类型入口；类型定义在 ./src/types（参考上游 24c8af918）。InfoTipSchema 为上游名称，与原 TipSchema 相同
export type { TipSchema, TipSchema as InfoTipSchema } from './src/types'

export { Infotip }
