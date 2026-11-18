import type { App } from 'vue'
import { useUserStoreWithOut } from '@/store/modules/user'

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
      // 指令模块在 setupI18n 之前加载，翻译在抛错时再取，避免模块顶层绑定到原样返回 key 的函数
      const { t } = useI18n()
      throw new Error(t('permission.hasPermission'))
    }
  })
}

/** 判断权限的方法 function */
const all_permission = '*:*:*'
export const hasPermission = (permission: string[]) => {
  // 调用时再获取 store：模块可能在 setupStore 之前加载，此时还没有激活的 Pinia
  const userStore = useUserStoreWithOut()
  return (
    userStore.permissions.has(all_permission) ||
    permission.some((permission) => userStore.permissions.has(permission))
  )
}
