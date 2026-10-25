import type { App } from 'vue'
import { getCurrentInstance } from 'vue'
import FcDesigner from '@form-create/designer'
import { setupFormCreate } from './index'

const installedApps = new WeakSet<App>() // 已安装表单设计器的应用

/** 安装表单设计器（依赖 form-create 渲染器及自定义组件） */
export const setupFcDesigner = (app: App) => {
  setupFormCreate(app)
  if (installedApps.has(app)) {
    return
  }
  installedApps.add(app)
  app.use(FcDesigner)
}

/**
 * 按需安装表单设计器：在使用 <fc-designer /> 的组件 setup 中同步调用，保证渲染设计器前已注册
 *
 * 注意：不在 main.ts 启动时安装，表单设计器仅在需要设计功能的页面加载
 */
export const useFcDesigner = () => {
  const instance = getCurrentInstance()
  if (instance) {
    setupFcDesigner(instance.appContext.app)
  }
}
