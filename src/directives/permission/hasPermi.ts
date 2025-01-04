import type { App } from 'vue'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

const { t } = useI18n() // 国际化

export function hasPermi(app: App<Element>) {
  app.directive('hasPermi', (el, binding) => {
    const { value } = binding

    if (value && value instanceof Array && value.length > 0) {
      const hasPermissions = hasPermission(value)

      if (!hasPermissions) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error(t('permission.hasPermission'))
    }
  })
}

export const hasPermission = (permission: string[]) => {
  const { wsCache } = useCache()
  const all_permission = '*:*:*'
  const userInfo = wsCache.get(CACHE_KEY.USER)
  const permissions = userInfo?.permissions || []

  return permissions.some((p: string) => {
    return all_permission === p || permission.includes(p)
  })
}