import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import { useLocaleStoreWithOut } from '@/store/modules/locale'
// 语言包与默认语言取自语言注册表；语言包仍为静态引入，切换语言无需加载 chunk
import { DEFAULT_LOCALE, localeMessages } from '@/config/locale'

const createAppI18n = (locale: LocaleType) =>
  createI18n({
    legacy: false,
    locale,
    // 当前语言缺失的文案回退到默认语言显示，而不是显示原始 key
    fallbackLocale: DEFAULT_LOCALE,
    messages: localeMessages,
    missingWarn: false,
    // 回退到默认语言时不告警
    fallbackWarn: false
  })

// 组合式 i18n 实例，供 @/hooks/web/useI18n、useLocale 在组件外使用
export let i18n: ReturnType<typeof createAppI18n>

// 语言包为静态引入，安装过程无异步步骤，同步执行
export const setupI18n = (app: App<Element>) => {
  const localeStore = useLocaleStoreWithOut()
  const lang = localeStore.getCurrentLocale.lang

  // 写回规范化后的语言：缓存值不受支持时 store 已回退默认语言，这里同步缓存与 Element Plus 语言对象
  localeStore.setCurrentLocale({ lang })
  document.documentElement.lang = lang

  i18n = createAppI18n(lang)
  app.use(i18n)
}
