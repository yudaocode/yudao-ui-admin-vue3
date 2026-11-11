import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import { DEFAULT_LOCALE, useLocaleStoreWithOut } from '@/store/modules/locale'
import type { I18n, I18nOptions } from 'vue-i18n'
import { setHtmlPageLang } from './helper'
// 支持的语言包体积很小，静态引入后切换语言无需再按需加载 chunk（避免加载失败触发整页刷新、丢失未保存的输入）
import zhCN from '@/locales/zh-CN'
import en from '@/locales/en'

export let i18n: ReturnType<typeof createI18n>

const createI18nOptions = async (): Promise<I18nOptions> => {
  const localeStore = useLocaleStoreWithOut()
  const locale = localeStore.getCurrentLocale
  const localeMap = localeStore.getLocaleMap

  setHtmlPageLang(locale.lang)

  localeStore.setCurrentLocale({
    lang: locale.lang
    // elLocale: elLocal
  })

  return {
    legacy: false,
    locale: locale.lang,
    // 当前语言缺失的文案回退到默认语言显示，而不是显示原始 key（参考上游 c7f8db52d）
    fallbackLocale: DEFAULT_LOCALE,
    messages: {
      'zh-CN': zhCN,
      en
    },
    availableLocales: localeMap.map((v) => v.lang),
    sync: true,
    silentTranslationWarn: true,
    missingWarn: false,
    // legacy: false 时 composer 只读取 fallbackWarn，回退到默认语言时不告警（参考上游 c7f8db52d）
    fallbackWarn: false,
    silentFallbackWarn: true
  }
}

export const setupI18n = async (app: App<Element>) => {
  const options = await createI18nOptions()
  i18n = createI18n(options) as I18n
  app.use(i18n)
}
