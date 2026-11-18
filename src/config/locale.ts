// 语言注册表：支持的语言、显示名称、i18n 语言包与 Element Plus 语言对象的唯一来源。
// 新增语言时在这里登记；全局 LocaleType 由此推导，useTimeAgo 等按语言配置的词表会在类型检查时提示补齐
// 支持的语言包体积很小，静态引入后切换语言无需再按需加载 chunk（避免加载失败触发整页刷新、丢失未保存的输入）
import zhCNMessages from '@/locales/zh-CN'
import enMessages from '@/locales/en'
import zhCNElement from 'element-plus/es/locale/lang/zh-cn'
import enElement from 'element-plus/es/locale/lang/en'

export const localeRegistry = {
  'zh-CN': {
    label: '简体中文',
    messages: zhCNMessages,
    elementLocale: zhCNElement
  },
  en: {
    label: 'English',
    messages: enMessages,
    elementLocale: enElement
  }
} as const

export type LocaleCode = keyof typeof localeRegistry

// 默认语言，也是 i18n 缺失文案时的回退语言
export const DEFAULT_LOCALE: LocaleCode = 'zh-CN'

// 只认注册表自身登记的语言：`in` 会沿原型链把 'toString'、'constructor' 等判为合法；
// 非字符串（null、数字、对象等）与原型链上的键一律返回 false
export const isLocale = (value: unknown): value is LocaleCode =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(localeRegistry, value)

export const localeOptions = (Object.keys(localeRegistry) as LocaleCode[]).map((value) => ({
  value,
  label: localeRegistry[value].label
}))

export const localeMessages = Object.fromEntries(
  (Object.keys(localeRegistry) as LocaleCode[]).map((locale) => [
    locale,
    localeRegistry[locale].messages
  ])
)
