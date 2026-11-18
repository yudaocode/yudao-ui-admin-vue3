<script lang="tsx">
import { ElBreadcrumb, ElBreadcrumbItem } from 'element-plus'
import { ref, watch, computed, unref, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/store/modules/permission'
import { filterBreadcrumb } from './helper'
import { filter, treeToList } from '@/utils/tree'
import type { RouteLocationNormalizedLoaded, RouteMeta } from 'vue-router'

import { Icon } from '@/components/Icon'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { getRouteTitle, isBackendTitle } from '@/utils/routeTitle'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('breadcrumb')

const appStore = useAppStore()

// 面包屑图标
const breadcrumbIcon = computed(() => appStore.getBreadcrumbIcon)

// 原始标题相同（且同为后端原文或同为语言 key）才算同名；空标题不参与
const isSameTitle = (a: AppRouteRecordRaw, b: AppRouteRecordRaw) =>
  !!a.meta?.title &&
  a.meta.title === b.meta?.title &&
  isBackendTitle(a.meta) === isBackendTitle(b.meta)

// 是否有可点击的跳转目标（与面包屑可点击规则一致）
const hasRedirect = (v: AppRouteRecordRaw) => !!v.redirect && v.redirect !== 'noredirect'

// redirect 是否就指向下一级（字符串路径，或只含 path / name 的对象）
const redirectsTo = (v: AppRouteRecordRaw, target: AppRouteRecordRaw) => {
  const redirect = v.redirect
  if (typeof redirect === 'string') return redirect === target.path
  if (redirect && typeof redirect === 'object') {
    // 带 query / hash / params 等其它字段（即使为空值）视为独立的导航目的，不算重合
    if (Object.keys(redirect).some((key) => key !== 'path' && key !== 'name')) return false
    // 与 vue-router 解析顺序一致：name 非空时按 name 跳转（忽略 path），否则才按 path
    if ('name' in redirect && redirect.name) return redirect.name === target.name
    return 'path' in redirect && redirect.path === target.path
  }
  return false
}

// 相邻同名层级只显示一次：去掉前一项，最后一项始终保留。
// 不做无条件去重：前一项有指向其它位置的跳转时保留，避免丢失祖先导航
const removeDuplicateParents = (list: AppRouteRecordRaw[]) =>
  list.filter((v, index) => {
    const next = list[index + 1]
    if (!next || !isSameTitle(v, next)) return true
    return hasRedirect(v) && !redirectsTo(v, next)
  })

export default defineComponent({
  name: 'Breadcrumb',
  setup() {
    const { currentRoute } = useRouter()

    const levelList = ref<AppRouteRecordRaw[]>([])

    const permissionStore = usePermissionStore()

    const menuRouters = computed(() => {
      const routers = permissionStore.getRouters
      return filterBreadcrumb(routers)
    })

    const getBreadcrumb = () => {
      const currentPath = currentRoute.value.matched.slice(-1)[0].path

      levelList.value = filter<AppRouteRecordRaw>(unref(menuRouters), (node: AppRouteRecordRaw) => {
        return node.path === currentPath
      })
    }

    const renderBreadcrumb = () => {
      // meta.breadcrumb 为 false 的路由不在面包屑中显示
      const breadcrumbList = removeDuplicateParents(
        treeToList<AppRouteRecordRaw[]>(unref(levelList)).filter(
          (v) => v.meta?.breadcrumb !== false
        )
      )
      return breadcrumbList.map((v, index) => {
        // 仅非最后一项且配置了 redirect 的路由可点击；其余不设置 to，
        // 避免显示为链接、点击时跳到丢失 query 的当前路径
        const canNavigate =
          index < breadcrumbList.length - 1 && !!v.redirect && v.redirect !== 'noredirect'
        // 路由未配置 meta 或 title 时回退为空
        const meta = (v.meta ?? {}) as RouteMeta
        const title = getRouteTitle(meta)
        // 渲染结构：key 在 name 缺失时回退 path；图标（右间距 5px）与标题直接作为 __inner（已是 flex 居中）的子节点
        return (
          <ElBreadcrumbItem
            to={canNavigate ? { path: v.path } : undefined}
            key={String(v.name ?? v.path)}
          >
            {meta.icon && breadcrumbIcon.value ? (
              <>
                <Icon icon={meta.icon} class="mr-[5px]"></Icon>
                {title}
              </>
            ) : (
              title
            )}
          </ElBreadcrumbItem>
        )
      })
    }

    watch(
      () => currentRoute.value,
      (route: RouteLocationNormalizedLoaded) => {
        if (route.path.startsWith('/redirect/')) {
          return
        }
        getBreadcrumb()
      },
      {
        immediate: true
      }
    )

    // 面包屑不再做切换动画，路由变化时直接显示
    return () => (
      <ElBreadcrumb separator="/" class={`${prefixCls} flex items-center h-full ml-[10px]`}>
        {renderBreadcrumb()}
      </ElBreadcrumb>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$elNamespace}-breadcrumb;

.#{$prefix-cls} {
  :deep(.#{$prefix-cls}__item) {
    display: flex;
    .#{$prefix-cls}__inner {
      display: flex;
      align-items: center;
      color: var(--top-header-text-color);

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  :deep(.#{$prefix-cls}__item):not(:last-child) {
    .#{$prefix-cls}__inner {
      color: var(--top-header-text-color);

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  :deep(.#{$prefix-cls}__item):last-child {
    .#{$prefix-cls}__inner {
      color: var(--el-text-color-placeholder);

      &:hover {
        color: var(--el-text-color-placeholder);
      }
    }
  }
}
</style>
