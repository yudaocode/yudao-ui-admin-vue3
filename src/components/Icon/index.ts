import Icon from './src/Icon.vue'
import IconSelect from './src/IconSelect.vue'

// IconProps 与 IconTypes 相同，保留为兼容名称
export type { IconTypes, IconTypes as IconProps } from './src/types'
export type { IconRegistry } from './src/registry'

export { registerIcons } from './src/registry'

export { Icon, IconSelect }
