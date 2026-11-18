import { useTimeAgo as useTimeAgoCore, UseTimeAgoMessages } from '@vueuse/core'
import { useLocaleStoreWithOut } from '@/store/modules/locale'

// 按语言注册表的全部语言配置词表：注册表新增语言而这里未补齐时，类型检查会报错
const TIME_AGO_MESSAGE_MAP: Record<LocaleType, UseTimeAgoMessages> = {
  'zh-CN': {
    justNow: '刚刚',
    invalid: '无效时间',
    past: (n) => (n.match(/\d/) ? `${n}前` : n),
    future: (n) => (n.match(/\d/) ? `${n}后` : n),
    month: (n, past) => (n === 1 ? (past ? '上个月' : '下个月') : `${n} 个月`),
    year: (n, past) => (n === 1 ? (past ? '去年' : '明年') : `${n} 年`),
    day: (n, past) => (n === 1 ? (past ? '昨天' : '明天') : `${n} 天`),
    week: (n, past) => (n === 1 ? (past ? '上周' : '下周') : `${n} 周`),
    hour: (n) => `${n} 小时`,
    minute: (n) => `${n} 分钟`,
    second: (n) => `${n} 秒`
  },
  en: {
    justNow: 'just now',
    invalid: 'Invalid Date',
    past: (n) => (n.match(/\d/) ? `${n} ago` : n),
    future: (n) => (n.match(/\d/) ? `in ${n}` : n),
    month: (n, past) =>
      n === 1 ? (past ? 'last month' : 'next month') : `${n} month${n > 1 ? 's' : ''}`,
    year: (n, past) =>
      n === 1 ? (past ? 'last year' : 'next year') : `${n} year${n > 1 ? 's' : ''}`,
    day: (n, past) => (n === 1 ? (past ? 'yesterday' : 'tomorrow') : `${n} day${n > 1 ? 's' : ''}`),
    week: (n, past) =>
      n === 1 ? (past ? 'last week' : 'next week') : `${n} week${n > 1 ? 's' : ''}`,
    hour: (n) => `${n} hour${n > 1 ? 's' : ''}`,
    minute: (n) => `${n} minute${n > 1 ? 's' : ''}`,
    second: (n) => `${n} second${n > 1 ? 's' : ''}`
  }
}

export const useTimeAgo = (time: Date | number | string) => {
  const localeStore = useLocaleStoreWithOut()

  // 词表随无刷新语言切换：VueUse 的 messages 不接受 ref，这里用 getter，
  // 由其内部 computed 每次格式化时读取当前语言并建立依赖，共用同一时钟
  const timeAgo = useTimeAgoCore(time, {
    get messages() {
      return TIME_AGO_MESSAGE_MAP[localeStore.getCurrentLocale.lang]
    }
  })

  return timeAgo
}
