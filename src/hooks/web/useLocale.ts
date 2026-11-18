import { i18n } from '@/plugins/vueI18n'
import { useLocaleStoreWithOut } from '@/store/modules/locale'

const setI18nLanguage = (locale: LocaleType) => {
  const localeStore = useLocaleStoreWithOut()

  // i18n 固定为组合式实例（legacy: false），直接设置 locale
  i18n.global.locale.value = locale
  localeStore.setCurrentLocale({
    lang: locale
  })
  document.documentElement.lang = locale
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
