import type { App } from 'vue'
import { Icon } from './Icon'
import { Permission } from './Permission'
import { BaseButton } from './Button'

export const setupGlobCom = (app: App<Element>): void => {
  app.component('Icon', Icon)
  // 与上游一致的全局组件名；按文件名自动解析的 Button / Permission 不受影响
  app.component('Permission', Permission)
  app.component('BaseButton', BaseButton)
}
