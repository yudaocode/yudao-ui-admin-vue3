import type { RouteLocationNormalized, RouteMeta, Router, RouteRecordNormalized } from 'vue-router'
import { defineComponent, h } from 'vue'
import { createRouter, createWebHashHistory, RouteRecordRaw, RouterView } from 'vue-router'
import { isUrl } from '@/utils/is'
import { BACKEND_TITLE_SOURCE } from '@/utils/routeTitle'
import { cloneDeep, omit } from 'lodash-es'
import {
  getDynamicPathParamNames,
  getExternalRoutePath,
  parseExternalRouteLocation,
  splitDynamicRouteParams,
  splitRoutePath
} from '@/utils/routeParams'

const modules = import.meta.glob('../views/**/*.{vue,tsx}')

/**
 * 按视图路径（相对 src/views，可带前导 /、可带扩展名）查找组件模块的键：
 * 先精确匹配 .vue、.tsx 文件，未命中再按原有的包含规则匹配。
 * 精确优先，避免 oa/leave/index 这类路径先命中后缀相同的 bpm/oa/leave/index.vue
 */
const resolveViewModuleKey = (
  viewPath: string,
  modulesKeys: string[] = Object.keys(modules)
): string | undefined => {
  const normalizedPath = viewPath.replace(/^\/+/, '')
  const exactKey = [
    `../views/${normalizedPath}`,
    `../views/${normalizedPath}.vue`,
    `../views/${normalizedPath}.tsx`
  ].find((key) => key in modules)
  return exactKey ?? modulesKeys.find((key) => key.includes(viewPath))
}

/**
 * 注册一个异步组件
 * @param componentPath 例:/bpm/oa/leave/detail
 */
export const registerComponent = (componentPath: string) => {
  const key = resolveViewModuleKey(componentPath)
  if (key) {
    // 使用异步组件的方式来动态加载组件
    // @ts-ignore
    return defineAsyncComponent(modules[key])
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

export const IFrameView = () => import('@/views/IFrame/index.vue')

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

/**
 * 查找后端菜单对应的视图组件：后端传了 component 时按 component 匹配（精确路径优先，未命中再模糊包含），
 * 未传时按 path 匹配（模糊包含，规则同原逻辑）。
 * 找不到时输出诊断，仍返回 undefined，不阻断路由注册与登录；
 * 构建时去除 console（VITE_DROP_CONSOLE）的环境看不到该日志
 */
const findViewComponent = (route: AppCustomRouteRecordRaw, modulesRoutesKeys: string[]) => {
  const key = route?.component
    ? resolveViewModuleKey(route.component, modulesRoutesKeys)
    : modulesRoutesKeys.find((ev) => ev.includes(route.path))
  if (!key) {
    const component = route.component || '未配置，按 path 匹配'
    console.error(
      `[菜单路由] 未找到菜单「${route.name}」的视图组件（path: ${route.path}，component: ${component}），` +
        '请在 src/views 下创建对应的 .vue 或 .tsx 文件'
    )
    return undefined
  }
  return modules[key]
}

// 后端控制路由生成
export const generateRoute = (routes: AppCustomRouteRecordRaw[]): AppRouteRecordRaw[] => {
  const res: AppRouteRecordRaw[] = []
  const modulesRoutesKeys = Object.keys(modules)
  for (const route of routes) {
    const componentRoute = splitRoutePath(route.component)
    const pathRoute = isUrl(route.path)
      ? parseExternalRouteLocation(route.path)
      : splitRoutePath(route.path)
    if (componentRoute.path) {
      route.component = componentRoute.path
    }
    if (pathRoute.path) {
      route.path = pathRoute.path
    }
    // 1. 生成 meta 菜单元数据
    const meta = {
      title: route.name,
      // 标记 title 为后端菜单原文，展示时不按语言 key 翻译（见 getRouteTitle）
      titleSource: BACKEND_TITLE_SOURCE,
      icon: route.icon,
      hidden: !route.visible,
      noCache: !route.keepAlive,
      alwaysShow:
        route.children &&
        route.children.length > 0 &&
        (route.alwaysShow !== undefined ? route.alwaysShow : true)
    } as any
    // 后端 MenuDO.component 或 path 可通过 ?/# 携带菜单参数，对齐 vben 的 meta.query/hash/params 行为。
    const routeQuery = {
      ...((route.meta?.query as Record<string, any> | undefined) || {}),
      ...(pathRoute.query || {}),
      ...(componentRoute.query || {})
    }
    const routeParams = splitDynamicRouteParams(pathRoute.path || route.path, routeQuery)
    const metaParams = {
      ...((route.meta?.params as Record<string, any> | undefined) || {}),
      ...(routeParams.params || {})
    }
    if (routeParams.query) {
      meta.query = routeParams.query
    }
    if (Object.keys(metaParams).length) {
      meta.params = metaParams
    }
    if (route.meta?.hash || pathRoute.hash || componentRoute.hash) {
      meta.hash = componentRoute.hash || pathRoute.hash || route.meta.hash
    }

    // 2. 生成 data（AppRouteRecordRaw）
    // 路由地址转首字母大写驼峰，作为路由名称，适配keepAlive
    let data: AppRouteRecordRaw = {
      path: route.path,
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
      childrenData.component = findViewComponent(route, modulesRoutesKeys)
      data.children = [childrenData]
    } else {
      // 目录
      if (route.children?.length) {
        // 顶级目录承载后台整体框架；非顶级目录只作为 router-view 占位，避免多级菜单嵌套 Layout。
        data.component = Number(route.parentId) === 0 ? Layout : getParentLayout()
        data.redirect = getRedirect(route.path, route.children)
        // 外链
      } else if (isUrl(route.path)) {
        const externalPath = getExternalRoutePath(route.id, data.name)
        const externalChild = {
          ...data,
          path: '',
          component: IFrameView,
          meta: {
            ...meta,
            iframeSrc: pathRoute.path,
            ...(pathRoute.iframe ? {} : { link: route.path })
          }
        } as AppRouteRecordRaw
        data = {
          path: externalPath,
          name: `${data.name}ExternalParent`,
          component: Layout,
          meta: {
            ...meta,
            ...(pathRoute.iframe ? { iframeSrc: pathRoute.path } : { link: route.path })
          },
          children: [externalChild]
        } as AppRouteRecordRaw
        // 菜单
      } else {
        // 对后端传component组件路径和不传做兼容（如果后端传component组件路径，那么path可以随便写，如果不传，component组件路径会根path保持一致）
        data.component = findViewComponent(route, modulesRoutesKeys)
      }
      if (route.children) {
        data.children = generateRoute(route.children)
        // Vue Router 要求路由 name 全局唯一；后端菜单可能生成父子同名，例如 /mall/trade/delivery/express。
        // 父级只有一个同名默认页时才折叠；存在兄弟节点时必须保留子菜单，例如商城装修下的装修模板。
        const sameNameChild = findDescendantRouteByName(data.children, data.name)
        if (sameNameChild) {
          data.name = `${data.name}Parent`
          if (
            data.children.length === 1 &&
            data.children[0] === sameNameChild &&
            !sameNameChild.children?.length &&
            sameNameChild.component
          ) {
            // 只有单一默认页才折叠到父路由，避免父子同名且不影响多子菜单展示。
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
        // getRedirect 遇到 children 缺省 / null 的叶子（后端叶子的常见形态）时不生成 redirect；
        // 此时对绝对路径、可见且无 query / params / hash 的目录，按已生成的子路由补充默认跳转
        if (
          data.redirect === undefined &&
          data.children?.length &&
          data.path.startsWith('/') &&
          isPlainRouteMeta(data.meta)
        ) {
          data.redirect = getDefaultRedirect(data.path, data.children)
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

/**
 * 目录的默认跳转（getRedirect 未生成时使用），基于 generateRoute 已生成的子路由沿首个子路由向下查找。
 *
 * 只有叶子是生成后实际存在的静态页面才返回其完整路径，否则返回 undefined，保持菜单等使用方原有的 fallback：
 * 每层须可见、为站内相对路径（外链已生成为绝对路径的独立父路由），meta 中无 query / params / hash
 * （包含 path / component 携带的 ?、#）；叶子须有页面组件、无显式 redirect，完整路径无动态参数。
 * 同名折叠后的节点（children 为 []，meta 沿用父目录、不含原子节点的 hidden / query / hash）不作为默认跳转，
 * 后端 children 缺省 / null 的普通叶子生成后没有 children
 */
const getDefaultRedirect = (
  parentPath: string,
  children: AppRouteRecordRaw[] | undefined
): string | undefined => {
  const child = children?.[0]
  if (
    !child ||
    !child.path ||
    child.path.startsWith('/') ||
    isUrl(child.path) ||
    !isPlainRouteMeta(child.meta)
  ) {
    return undefined
  }
  const path = generateRoutePath(parentPath, child.path)
  if (child.children?.length) {
    return getDefaultRedirect(path, child.children)
  }
  if (
    child.children ||
    !child.component ||
    child.redirect ||
    getDynamicPathParamNames(path).length
  ) {
    return undefined
  }
  return path
}

// 可见，且无 query / params / hash（包含 path / component 携带的 ?、#）
const isPlainRouteMeta = (meta?: RouteMeta) => {
  return !meta?.hidden && !meta?.query && !meta?.params && !meta?.hash
}
const generateRoutePath = (parentPath: string, path: string) => {
  // 与 pathResolve 一致：以 / 开头的子路由由 vue-router 按绝对路径注册，默认跳转不拼接父路径
  if (path.startsWith('/')) {
    return path
  }
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
  // 以 / 开头的子路由由 vue-router 按绝对路径注册，不拼接父路径，菜单索引、面包屑等与注册路径一致；
  // 不做 trim：注册路径保留原始空白，菜单侧单独 trim 会与注册路径不一致
  if (path.startsWith('/')) return path.replace(/\/+/g, '/')
  return `${parentPath}/${path}`.replace(/\/+/g, '/')
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
