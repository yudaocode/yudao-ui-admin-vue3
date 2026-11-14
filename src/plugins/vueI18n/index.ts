import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import { useLocaleStoreWithOut } from '@/store/modules/locale'
import type { I18n, I18nOptions } from 'vue-i18n'
import { setHtmlPageLang } from './helper'
// 语言包与默认语言取自语言注册表（参考上游 c7f8db52d）；语言包仍为静态引入，切换语言无需加载 chunk
import { DEFAULT_LOCALE, localeMessages } from '@/config/locale'

export let i18n: ReturnType<typeof createI18n>

// 组合式模式（legacy: false）只读取以下选项，与上游 createAppI18n 一致；
// 原先的 availableLocales、sync、silentTranslationWarn、silentFallbackWarn 仅 legacy 模式读取，已移除
const createI18nOptions = (lang: LocaleType): I18nOptions => ({
  legacy: false,
  locale: lang,
  // 当前语言缺失的文案回退到默认语言显示，而不是显示原始 key（参考上游 c7f8db52d）
  fallbackLocale: DEFAULT_LOCALE,
  messages: localeMessages,
  missingWarn: false,
  // 回退到默认语言时不告警（参考上游 c7f8db52d）
  fallbackWarn: false
})

// 语言包为静态引入，安装过程无异步步骤，与上游一样同步执行
export const setupI18n = (app: App<Element>) => {
  const localeStore = useLocaleStoreWithOut()
  const lang = localeStore.getCurrentLocale.lang

  // 写回规范化后的语言：缓存值不受支持时 store 已回退默认语言，这里同步缓存与 Element Plus 语言对象
  localeStore.setCurrentLocale({ lang })
  setHtmlPageLang(lang)

  i18n = createI18n(createI18nOptions(lang)) as I18n
  app.use(i18n)
}
