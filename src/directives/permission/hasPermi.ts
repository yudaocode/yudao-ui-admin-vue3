import type {App} from 'vue'
import {useUserStore} from "@/store/modules/user";

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
const userStore = useUserStore();
const all_permission = '*:*:*'
export const hasPermission = (permission: string[]) => {
  return userStore.permissionsSet.has(all_permission) ||
    permission.some(permission => userStore.permissionsSet.has(permission))
}
