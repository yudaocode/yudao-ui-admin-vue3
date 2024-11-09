import type { App } from 'vue'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

const { t } = useI18n() // 国际化

export function hasRole(app: App<Element>) {
  app.directive('hasRole', (el, binding) => {
    const { wsCache } = useCache()
    const { value } = binding
    const super_admin = 'super_admin'
    const userInfo = wsCache.get(CACHE_KEY.USER)
    const roles = userInfo?.roles || []

    if (value && value instanceof Array && value.length > 0) {
      const roleFlag = value

      const hasRole = roles.some((role: string) => {
        return super_admin === role || roleFlag.includes(role)
      })

      if (!hasRole) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error(t('permission.hasRole'))
    }
  })
}
