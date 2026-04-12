import { ref, watch } from 'vue'
import { CalCalendarApi, CalCalendarDayVO } from '@/api/mes/cal/calendar'
import { CalHolidayApi, CalHolidayVO } from '@/api/mes/cal/holiday'
import { formatDate } from '@/utils/formatTime'
import { HolidayType } from '@/views/mes/utils/constants'

/**
 * 排班日历通用 composable
 *
 * 封装日历组件中通用的响应式状态、假期加载、排班查询、月份切换逻辑
 */
export function useCalendar() {
  const loading = ref(false)
  const currentDate = ref(new Date())
  const calendarDayMap = ref<Map<string, CalCalendarDayVO>>(new Map())
  const holidaySet = ref(new Set<string>())

  /** 获取节假日列表，按当前月份范围加载 */
  const loadHolidays = async () => {
    holidaySet.value.clear()
    const { startDay, endDay } = getMonthRange()
    const list = await CalHolidayApi.getHolidayList({
      startDay: formatDate(startDay, 'YYYY-MM-DD HH:mm:ss'),
      endDay: formatDate(endDay, 'YYYY-MM-DD HH:mm:ss')
    })
    if (!list) {
      return
    }
    list.forEach((item: CalHolidayVO) => {
      const day = item.day ? formatDate(item.day as any, 'YYYY-MM-DD') : ''
      if (day && item.type === HolidayType.HOLIDAY) {
        holidaySet.value.add(day)
      }
    })
  }

  /** 查询排班日历，params 由调用方提供 queryType 相关参数 */
  const fetchCalendar = async (params: Record<string, any>) => {
    loading.value = true
    try {
      const { startDay, endDay } = getMonthRange()
      const list = await CalCalendarApi.getCalendarList({
        ...params,
        startDay: formatDate(startDay, 'YYYY-MM-DD HH:mm:ss'),
        endDay: formatDate(endDay, 'YYYY-MM-DD HH:mm:ss')
      })
      calendarDayMap.value.clear()
      if (!list) {
        return
      }
      list.forEach((item: CalCalendarDayVO) => {
        const day = item.day ? formatDate(item.day as any, 'YYYY-MM-DD') : ''
        if (day) {
          calendarDayMap.value.set(day, { ...item, day })
        }
      })
    } finally {
      loading.value = false
    }
  }

  /** 计算当前月份的起止时间 */
  const getMonthRange = () => {
    const date = currentDate.value
    const year = date.getFullYear()
    const month = date.getMonth()
    return {
      startDay: new Date(year, month, 1),
      endDay: new Date(year, month + 1, 0, 23, 59, 59)
    }
  }

  /** 监听月份切换，调用回调刷新数据 */
  const watchMonth = (callback: () => void) => {
    watch(currentDate, () => {
      loadHolidays().then()
      callback()
    })
  }

  return {
    loading,
    currentDate,
    calendarDayMap,
    holidaySet,
    loadHolidays,
    fetchCalendar,
    watchMonth
  }
}
