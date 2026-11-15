import type { App } from 'vue'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

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
      // 指令模块在 setupI18n 之前加载，翻译在抛错时再取，避免模块顶层绑定到原样返回 key 的函数
      const { t } = useI18n()
      throw new Error(t('permission.hasRole'))
    }
  })
}
