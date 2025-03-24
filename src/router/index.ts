import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

// 自动导入modules目录下的所有静态路由，项目可以按模块分类增加路由文件
// by panda 25.03.21
const loadRouters = async (): Promise<RouteRecordRaw[]> => {
  const modules: any = import.meta.glob('./modules/*.ts')
  const allRouters: RouteRecordRaw[] = []

  try {
    // 等待所有模块加载完成
    const loadedModules = await Promise.all(
      Object.values(modules).map((importFn: () => Promise<any>) => importFn())
    )

    loadedModules.forEach((module) => {
      if (Array.isArray(module.default)) {
        allRouters.push(...module.default)
      } else {
        console.warn('Module does not export an array of routes:', module)
      }
    })
  } catch (error) {
    console.error('Error loading route modules:', error)
  }

  return allRouters
}

const allRouters = await loadRouters()

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_PATH), // createWebHashHistory URL带#，createWebHistory URL不带#
  strict: true,
  routes: allRouters, //自动导入的所有静态路由 by panda 25.03.21
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export const resetRouter = (): void => {
  const resetWhiteNameList = ['Redirect', 'Login', 'NoFind', 'Root']
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !resetWhiteNameList.includes(name as string)) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
