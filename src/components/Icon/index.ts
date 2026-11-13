import Icon from './src/Icon.vue'
import IconSelect from './src/IconSelect.vue'

// 与上游一致的类型入口；类型定义在 ./src/types（参考上游 24c8af918）。IconProps 为上游 14d2bec7b 改用的名称，与 IconTypes 相同
export type { IconTypes, IconTypes as IconProps } from './src/types'

export { Icon, IconSelect }
