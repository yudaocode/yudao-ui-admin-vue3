import type { App } from 'vue'

import { ElLoading } from 'element-plus'

export const setupElementPlus = (app: App<Element>) => {
  app.use(ElLoading)
}
