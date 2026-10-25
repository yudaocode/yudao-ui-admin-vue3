import type { App } from 'vue'
import { useUserStoreWithOut } from '@/store/modules/user'

const { t } = useI18n() // 国际化

/** 判断权限的指令 directive */
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

/** 判断权限的方法 function */
// 模块求值早于 setupStore，需显式传入 store
const userStore = useUserStoreWithOut()
const all_permission = '*:*:*'
export const hasPermission = (permission: string[]) => {
  return (
    userStore.permissions.has(all_permission) ||
    permission.some((permission) => userStore.permissions.has(permission))
  )
}
