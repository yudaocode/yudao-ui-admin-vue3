import { i18n } from '@/plugins/vueI18n'
import { useLocaleStoreWithOut } from '@/store/modules/locale'
import { setHtmlPageLang } from '@/plugins/vueI18n/helper'

const setI18nLanguage = (locale: LocaleType) => {
  const localeStore = useLocaleStoreWithOut()

  if (i18n.mode === 'legacy') {
    i18n.global.locale = locale
  } else {
    ;(i18n.global.locale as any).value = locale
  }
  localeStore.setCurrentLocale({
    lang: locale
  })
  setHtmlPageLang(locale)
}

export const useLocale = () => {
  // Switching the language will change the locale of useI18n
  // And submit to configuration modification
  // 语言包已在 setupI18n 中静态注册，切换时同步生效，无需网络加载
  const changeLocale = (locale: LocaleType) => {
    if (locale === useLocaleStoreWithOut().getCurrentLocale.lang) return
    setI18nLanguage(locale)
  }

  return {
    changeLocale
  }
}
