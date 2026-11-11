<script lang="tsx">
import { ElBreadcrumb, ElBreadcrumbItem } from 'element-plus'
import { ref, watch, computed, unref, defineComponent, TransitionGroup } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/store/modules/permission'
import { filterBreadcrumb } from './helper'
import { filter, treeToList } from '@/utils/tree'
import type { RouteLocationNormalizedLoaded, RouteMeta } from 'vue-router'

import { Icon } from '@/components/Icon'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { getRouteTitle } from '@/utils/routeTitle'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('breadcrumb')

const appStore = useAppStore()

// 面包屑图标
const breadcrumbIcon = computed(() => appStore.getBreadcrumbIcon)

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
      // meta.breadcrumb 为 false 的路由不在面包屑中显示（参考上游 e66532cf9）
      const breadcrumbList = treeToList<AppRouteRecordRaw[]>(unref(levelList)).filter(
        (v) => v.meta?.breadcrumb !== false
      )
      return breadcrumbList.map((v, index) => {
        // 仅非最后一项且配置了 redirect 的路由可点击；其余不设置 to，
        // 避免显示为链接、点击时跳到丢失 query 的当前路径（参考上游 e66532cf9）
        const canNavigate =
          index < breadcrumbList.length - 1 && !!v.redirect && v.redirect !== 'noredirect'
        // 路由未配置 meta 或 title 时回退为空
        const meta = (v.meta ?? {}) as RouteMeta
        const title = getRouteTitle(meta)
        return (
          <ElBreadcrumbItem to={canNavigate ? { path: v.path } : undefined} key={v.name}>
            {meta.icon && breadcrumbIcon.value ? (
              <div class="flex items-center">
                <Icon icon={meta.icon} class="mr-[2px]" svgClass="inline-block"></Icon>
                {title}
              </div>
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

    return () => (
      <ElBreadcrumb separator="/" class={`${prefixCls} flex items-center h-full ml-[10px]`}>
        <TransitionGroup appear enter-active-class="animate__animated animate__fadeInRight">
          {renderBreadcrumb()}
        </TransitionGroup>
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
      display: flex;
      align-items: center;
      color: var(--el-text-color-placeholder);

      &:hover {
        color: var(--el-text-color-placeholder);
      }
    }
  }
}
</style>
