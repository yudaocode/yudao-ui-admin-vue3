import { defineStore } from 'pinia'
import { store } from '../index'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import type { LocaleDropdownType } from '@/layout/components/LocaleDropdown'
import { DEFAULT_LOCALE, isLocale, localeOptions, localeRegistry } from '@/config/locale'

const { wsCache } = useCache()

// 默认语言，也是 i18n 缺失文案时的回退语言；这里再导出以兼容既有导入
export { DEFAULT_LOCALE }

// Element Plus 语言对象取自语言注册表；不支持的语言返回 undefined
const getElementLocale = (lang: unknown) =>
  isLocale(lang) ? localeRegistry[lang].elementLocale : undefined

// 缓存的语言不在支持列表内（如旧版本或同域其它应用写入的值）时回退到默认语言
const getCachedLocale = (): LocaleType => {
  const lang = wsCache.get(CACHE_KEY.LANG)
  return isLocale(lang) ? lang : DEFAULT_LOCALE
}

interface LocaleState {
  currentLocale: LocaleDropdownType
  localeMap: LocaleDropdownType[]
}

export const useLocaleStore = defineStore('locales', {
  state: (): LocaleState => {
    const lang = getCachedLocale()
    return {
      currentLocale: {
        lang,
        elLocale: getElementLocale(lang)
      },
      // 多语言：名称与顺序取自语言注册表
      localeMap: localeOptions.map(({ value, label }) => ({ lang: value, name: label }))
    }
  },
  getters: {
    getCurrentLocale(): LocaleDropdownType {
      return this.currentLocale
    },
    getLocaleMap(): LocaleDropdownType[] {
      return this.localeMap
    }
  },
  actions: {
    setCurrentLocale(localeMap: LocaleDropdownType) {
      // this.locale = Object.assign(this.locale, localeMap)
      this.currentLocale.lang = localeMap?.lang
      this.currentLocale.elLocale = getElementLocale(localeMap?.lang)
      wsCache.set(CACHE_KEY.LANG, localeMap?.lang)
    }
  }
})

export const useLocaleStoreWithOut = () => {
  return useLocaleStore(store)
}
