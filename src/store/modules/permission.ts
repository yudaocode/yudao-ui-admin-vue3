import { defineStore } from 'pinia'
import { store } from '@/store'
import { cloneDeep } from 'lodash-es'
import remainingRouter from '@/router/modules/remaining'
import { flatMultiLevelRoutes, generateRoute } from '@/utils/routerHelper'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

const { wsCache } = useCache()

export interface PermissionState {
  routers: AppRouteRecordRaw[]
  addRouters: AppRouteRecordRaw[]
  menuTabRouters: AppRouteRecordRaw[]
  menuRootPath: string
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routers: [],
    addRouters: [],
    menuTabRouters: [],
    menuRootPath: ''
  }),
  getters: {
    getRouters(): AppRouteRecordRaw[] {
      return this.routers
    },
    getAddRouters(): AppRouteRecordRaw[] {
      return flatMultiLevelRoutes(cloneDeep(this.addRouters))
    },
    getMenuTabRouters(): AppRouteRecordRaw[] {
      return this.menuTabRouters
    },
    getMenuRootPath(): string {
      return this.menuRootPath
    }
  },
  actions: {
    // 生成失败（如菜单数据异常导致 generateRoute 抛错）时返回的 Promise 拒绝，且不修改 addRouters、routers
    async generateRoutes(): Promise<void> {
      // 获得菜单列表，它在登录的时候，setUserInfoAction 方法中已经进行获取
      let res: AppCustomRouteRecordRaw[] = []
      const roleRouters = wsCache.get(CACHE_KEY.ROLE_ROUTERS)
      if (roleRouters) {
        res = roleRouters as AppCustomRouteRecordRaw[]
      }
      const routerMap: AppRouteRecordRaw[] = generateRoute(res)
      // 动态路由，404一定要放到最后面
      // preschooler：vue-router@4以后已支持静态404路由，此处可不再追加
      const addRouters = routerMap.concat([
        {
          path: '/:path(.*)*',
          // redirect: '/404',
          component: () => import('@/views/Error/404.vue'),
          name: '404Page',
          meta: {
            hidden: true,
            breadcrumb: false
          }
        }
      ])
      // 渲染菜单的所有路由
      const routers = cloneDeep(remainingRouter).concat(routerMap)
      // 全部生成成功后再一起写入
      this.addRouters = addRouters
      this.routers = routers
    },
    setMenuTabRouters(routers: AppRouteRecordRaw[]): void {
      this.menuTabRouters = routers
    },
    setMenuRootPath(path: string): void {
      this.menuRootPath = path
    }
  },
  persist: false
})

export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}
