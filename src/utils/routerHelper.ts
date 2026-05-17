import type { RouteLocationNormalized, Router, RouteRecordNormalized } from 'vue-router'
import { defineComponent, h } from 'vue'
import { createRouter, createWebHashHistory, RouteRecordRaw, RouterView } from 'vue-router'
import { isUrl } from '@/utils/is'
import { cloneDeep, omit } from 'lodash-es'
import qs from 'qs'

const modules = import.meta.glob('../views/**/*.{vue,tsx}')
/**
 * 注册一个异步组件
 * @param componentPath 例:/bpm/oa/leave/detail
 */
export const registerComponent = (componentPath: string) => {
  for (const item in modules) {
    if (item.includes(componentPath)) {
      // 使用异步组件的方式来动态加载组件
      // @ts-ignore
      return defineAsyncComponent(modules[item])
    }
  }
}
/* Layout */
export const Layout = () => import('@/layout/Layout.vue')

// 嵌套动态目录只需要透传子路由；不能再次渲染完整 Layout，否则内容区会重复出现顶部栏和侧边栏。
// vue-router 5 对 component 更严格，这里必须返回带 render 的真实组件，不能只返回 { name: 'ParentLayout' }。
const ParentLayout = defineComponent({
  name: 'ParentLayout',
  setup() {
    return () => h(RouterView)
  }
})

export const getParentLayout = () => ParentLayout

// 按照路由中meta下的rank等级升序来排序路由
export const ascending = (arr: any[]) => {
  arr.forEach((v) => {
    if (v?.meta?.rank === null) v.meta.rank = undefined
    if (v?.meta?.rank === 0) {
      if (v.name !== 'home' && v.path !== '/') {
        console.warn('rank only the home page can be 0')
      }
    }
  })
  return arr.sort((a: { meta: { rank: number } }, b: { meta: { rank: number } }) => {
    return a?.meta?.rank - b?.meta?.rank
  })
}

export const getRawRoute = (route: RouteLocationNormalized): RouteLocationNormalized => {
  if (!route) return route
  const { matched, ...opt } = route
  return {
    ...opt,
    matched: (matched
      ? matched.map((item) => ({
          meta: item.meta,
          name: item.name,
          path: item.path
        }))
      : undefined) as RouteRecordNormalized[]
  }
}

// 后端控制路由生成
export const generateRoute = (routes: AppCustomRouteRecordRaw[]): AppRouteRecordRaw[] => {
  const res: AppRouteRecordRaw[] = []
  const modulesRoutesKeys = Object.keys(modules)
  for (const route of routes) {
    // 1. 生成 meta 菜单元数据
    const meta = {
      title: route.name,
      icon: route.icon,
      hidden: !route.visible,
      noCache: !route.keepAlive,
      alwaysShow:
        route.children &&
        route.children.length > 0 &&
        (route.alwaysShow !== undefined ? route.alwaysShow : true)
    } as any
    // 特殊逻辑：如果后端配置的 MenuDO.component 包含 ?，则表示需要传递参数
    // 此时，我们需要解析参数，并且将参数放到 meta.query 中
    // 这样，后续在 Vue 文件中，可以通过 const { currentRoute } = useRouter() 中，通过 meta.query 获取到参数
    if (route.component && route.component.indexOf('?') > -1) {
      const query = route.component.split('?')[1]
      route.component = route.component.split('?')[0]
      meta.query = qs.parse(query)
    }

    // 2. 生成 data（AppRouteRecordRaw）
    // 路由地址转首字母大写驼峰，作为路由名称，适配keepAlive
    let data: AppRouteRecordRaw = {
      path:
        route.path.indexOf('?') > -1 && !isUrl(route.path) ? route.path.split('?')[0] : route.path, // 注意，需要排除 http 这种 url，避免它带 ? 参数被截取掉
      name:
        route.componentName && route.componentName.length > 0
          ? route.componentName
          : toCamelCase(route.path, true),
      redirect: route.redirect,
      meta: meta
    }
    //处理顶级非目录路由
    if (!route.children && Number(route.parentId) === 0 && route.component) {
      data.component = Layout
      data.meta = {
        hidden: meta.hidden
      }
      data.name = toCamelCase(route.path, true) + 'Parent'
      data.redirect = ''
      meta.alwaysShow = true
      const childrenData: AppRouteRecordRaw = {
        path: '',
        name:
          route.componentName && route.componentName.length > 0
            ? route.componentName
            : toCamelCase(route.path, true),
        redirect: route.redirect,
        meta: meta
      }
      const index = route?.component
        ? modulesRoutesKeys.findIndex((ev) => ev.includes(route.component))
        : modulesRoutesKeys.findIndex((ev) => ev.includes(route.path))
      childrenData.component = modules[modulesRoutesKeys[index]]
      data.children = [childrenData]
    } else {
      // 目录
      if (route.children?.length) {
        // 顶级目录承载后台整体框架；非顶级目录只作为 router-view 占位，避免多级菜单嵌套 Layout。
        data.component = Number(route.parentId) === 0 ? Layout : getParentLayout()
        data.redirect = getRedirect(route.path, route.children)
        // 外链
      } else if (isUrl(route.path)) {
        data = {
          path: '/external-link',
          component: Layout,
          meta: {
            name: route.name
          },
          children: [data]
        } as AppRouteRecordRaw
        // 菜单
      } else {
        // 对后端传component组件路径和不传做兼容（如果后端传component组件路径，那么path可以随便写，如果不传，component组件路径会根path保持一致）
        const index = route?.component
          ? modulesRoutesKeys.findIndex((ev) => ev.includes(route.component))
          : modulesRoutesKeys.findIndex((ev) => ev.includes(route.path))
        data.component = modules[modulesRoutesKeys[index]]
      }
      if (route.children) {
        data.children = generateRoute(route.children)
        // vue-router 5 要求路由 name 全局唯一；后端菜单可能生成父子同名，例如 /mall/trade/delivery/express。
        // 父路由改名后，如果同名子是叶子页面，则把页面 component 折叠到父路由，保持原 URL 可访问。
        const sameNameChild = findDescendantRouteByName(data.children, data.name)
        if (sameNameChild) {
          data.name = `${data.name}Parent`
          if (!sameNameChild.children?.length && sameNameChild.component) {
            // 只移除被折叠的同名子，保留其它兄弟节点，避免后续菜单扩展时丢路由。
            const remainingChildren = removeDescendantRoute(data.children, sameNameChild)
            data.component = sameNameChild.component
            data.redirect = sameNameChild.redirect
            data.children = remainingChildren
            data.meta = {
              ...data.meta,
              alwaysShow: remainingChildren.length > 0 ? data.meta.alwaysShow : false
            }
          }
        }
      }
    }
    res.push(data as AppRouteRecordRaw)
  }
  return res
}

/**
 * 在已生成的子路由树里查找第一个同名后代路由。
 *
 * vue-router 5 要求 name 全局唯一；后端菜单可能生成“父目录”和“默认子页面”同名的结构。
 * 调用方会用返回的同名叶子节点做折叠处理，所以这里返回原始节点引用，供 removeDescendantRoute 精确移除。
 */
const findDescendantRouteByName = (
  routes: AppRouteRecordRaw[] | undefined,
  name: string
): AppRouteRecordRaw | undefined => {
  for (const route of routes || []) {
    if (route.name === name) {
      return route
    }
    const child = findDescendantRouteByName(route.children, name)
    if (child) {
      return child
    }
  }
}

/**
 * 从路由树中移除指定节点，并保留其它兄弟节点和子树。
 *
 * target 来自 findDescendantRouteByName，和 routes 属于同一棵对象树，因此可以用引用相等精确定位。
 * 不按 name 删除，是为了避免误删其它层级里可能同名但不应该折叠的节点。
 */
const removeDescendantRoute = (
  routes: AppRouteRecordRaw[] | undefined,
  target: AppRouteRecordRaw
): AppRouteRecordRaw[] => {
  return (routes || []).flatMap((route) => {
    if (route === target) {
      return []
    }
    if (!route.children?.length) {
      return [route]
    }
    return [
      {
        ...route,
        children: removeDescendantRoute(route.children, target)
      }
    ]
  })
}

export const getRedirect = (parentPath: string, children: AppCustomRouteRecordRaw[]) => {
  if (!children || children.length == 0) {
    return parentPath
  }
  const path = generateRoutePath(parentPath, children[0].path)
  // 递归子节点
  if (children[0].children) return getRedirect(path, children[0].children)
}
const generateRoutePath = (parentPath: string, path: string) => {
  if (parentPath.endsWith('/')) {
    parentPath = parentPath.slice(0, -1) // 移除默认的 /
  }
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  return parentPath + path
}
export const pathResolve = (parentPath: string, path: string) => {
  if (isUrl(path)) return path
  if (!path) return parentPath // 修复 path 为空时返回 parentPath，避免拼接出错 https://t.zsxq.com/QVr6b
  const childPath = path.startsWith('/') ? path : `/${path}`
  return `${parentPath}${childPath}`.replace(/\/+/g, '/')
}

// 路由降级
export const flatMultiLevelRoutes = (routes: AppRouteRecordRaw[]) => {
  const modules: AppRouteRecordRaw[] = cloneDeep(routes)
  for (let index = 0; index < modules.length; index++) {
    const route = modules[index]
    if (!isMultipleRoute(route)) {
      continue
    }
    promoteRouteLevel(route)
  }
  return modules
}

// 层级是否大于2
const isMultipleRoute = (route: AppRouteRecordRaw) => {
  if (!route || !Reflect.has(route, 'children') || !route.children?.length) {
    return false
  }

  const children = route.children

  let flag = false
  for (let index = 0; index < children.length; index++) {
    const child = children[index]
    if (child.children?.length) {
      flag = true
      break
    }
  }
  return flag
}

// 生成二级路由
const promoteRouteLevel = (route: AppRouteRecordRaw) => {
  let router: Router | null = createRouter({
    routes: [route as RouteRecordRaw],
    history: createWebHashHistory()
  })

  const routes = router.getRoutes()
  addToChildren(routes, route.children || [], route)
  router = null

  route.children = route.children?.map((item) => omit(item, 'children'))
}

// 添加所有子菜单
const addToChildren = (
  routes: RouteRecordNormalized[],
  children: AppRouteRecordRaw[],
  routeModule: AppRouteRecordRaw
) => {
  for (let index = 0; index < children.length; index++) {
    const child = children[index]
    const route = routes.find((item) => item.name === child.name)
    if (!route) {
      continue
    }
    routeModule.children = routeModule.children || []
    if (!routeModule.children.find((item) => item.name === route.name)) {
      routeModule.children?.push(route as unknown as AppRouteRecordRaw)
    }
    if (child.children?.length) {
      addToChildren(routes, child.children, routeModule)
    }
  }
}
const toCamelCase = (str: string, upperCaseFirst: boolean) => {
  str = (str || '')
    .replace(/-(.)/g, function (group1: string) {
      return group1.toUpperCase()
    })
    .replaceAll('-', '')

  if (upperCaseFirst && str) {
    str = str.charAt(0).toUpperCase() + str.slice(1)
  }

  return str
}
