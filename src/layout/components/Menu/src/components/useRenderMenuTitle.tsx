import type { RouteMeta } from 'vue-router'
import { Icon } from '@/components/Icon'
import { getRouteTitle } from '@/utils/routeTitle'

export const useRenderMenuTitle = () => {
  const renderMenuTitle = (meta: RouteMeta) => {
    const { icon } = meta
    const title = meta.title === undefined ? 'Please set title' : getRouteTitle(meta)

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
