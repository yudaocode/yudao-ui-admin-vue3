import type { RouteMeta } from 'vue-router'
import { Icon } from '@/components/Icon'
import { getRouteTitle } from '@/utils/routeTitle'

export const useRenderMenuTitle = () => {
  const renderMenuTitle = (meta: RouteMeta) => {
    const { icon } = meta
    const title = meta.title === undefined ? 'Please set title' : getRouteTitle(meta)

    // truncate 与原 overflow-hidden text-ellipsis whitespace-nowrap 生成相同样式，类名与上游一致（参考上游 e66532cf9）
    return icon ? (
      <>
        <Icon icon={meta.icon}></Icon>
        <span class="v-menu__title truncate">{title}</span>
      </>
    ) : (
      <span class="v-menu__title truncate">{title}</span>
    )
  }

  return {
    renderMenuTitle
  }
}
