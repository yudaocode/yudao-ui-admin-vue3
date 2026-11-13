import { defineStore } from 'pinia'
import { store } from '../index'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import type { LocaleDropdownType } from '@/layout/components/LocaleDropdown'

const { wsCache } = useCache()

const elLocaleMap = {
  'zh-CN': zhCn,
  en: en
}

// 默认语言，也是 i18n 缺失文案时的回退语言（参考上游 c7f8db52d）
export const DEFAULT_LOCALE: LocaleType = 'zh-CN'

// 缓存的语言不在支持列表内（如旧版本或同域其它应用写入的值）时回退到默认语言（参考上游 c7f8db52d）
const getCachedLocale = (): LocaleType => {
  const lang = wsCache.get(CACHE_KEY.LANG)
  return typeof lang === 'string' && Object.prototype.hasOwnProperty.call(elLocaleMap, lang)
    ? (lang as LocaleType)
    : DEFAULT_LOCALE
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
        elLocale: elLocaleMap[lang]
      },
      // 多语言
      localeMap: [
        {
          lang: 'zh-CN',
          name: '简体中文'
        },
        {
          lang: 'en',
          name: 'English'
        }
      ]
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
      this.currentLocale.elLocale = elLocaleMap[localeMap?.lang]
      wsCache.set(CACHE_KEY.LANG, localeMap?.lang)
    }
  }
})

export const useLocaleStoreWithOut = () => {
  return useLocaleStore(store)
}
