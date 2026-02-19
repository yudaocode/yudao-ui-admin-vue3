<!-- 排班日历 - 按分类视图 -->
<template>
  <div class="flex">
    <!-- 左侧：班组类型选择 -->
    <div
      class="w-150px shrink-0 mr-12px border border-solid border-#dcdfe6 rounded-4px overflow-hidden"
    >
      <div
        v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE)"
        :key="dict.value"
        class="px-16px py-10px cursor-pointer text-14px text-#606266 border-b border-b-solid border-b-#ebeef5 last:border-b-0 hover:bg-#f5f7fa transition-colors"
        :class="selectedType === dict.value ? 'bg-#ecf5ff text-#409eff font-500' : ''"
        @click="onSelectType(dict.value)"
      >
        {{ dict.label }}
      </div>
    </div>

    <!-- 右侧：日历 -->
    <div class="flex-1">
      <CalendarLegend />
      <el-calendar v-model="currentDate" v-loading="loading">
        <template #date-cell="{ data }">
          <CalendarDateCell
            :day="data.day"
            :holiday-set="holidaySet"
            :calendar-day-map="calendarDayMap"
          />
        </template>
      </el-calendar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalCalendarApi, CalCalendarDayVO } from '@/api/mes/cal/calendar'
import { CalHolidayApi, CalHolidayVO } from '@/api/mes/cal/holiday'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { HolidayType } from '@/views/mes/utils/constants'
import CalendarDateCell from './CalendarDateCell.vue'
import CalendarLegend from './CalendarLegend.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import PluginLunar from 'dayjs-plugin-lunar'

dayjs.locale('zh-cn')
dayjs.extend(PluginLunar)

const loading = ref(false)
const currentDate = ref(new Date()) // 日历当前显示月份
const selectedType = ref<number>() // 当前选中的班组类型（枚举 MES_CAL_CALENDAR_TYPE）
const calendarDayMap = ref<Map<string, CalCalendarDayVO>>(new Map()) // key: yyyy-MM-dd
const holidaySet = ref(new Set<string>()) // 节假日日期集合，key: yyyy-MM-dd

/** 获取节假日列表，构建节假日日期集合 */
const getHolidayList = async () => {
  holidaySet.value.clear()
  const list = await CalHolidayApi.getHolidayList()
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

/** 查询当前月份的排班日历，按选中分类过滤 */
const fetchCalendar = async () => {
  if (!selectedType.value) return
  loading.value = true
  try {
    // 计算当前月份的起止时间
    const date = currentDate.value
    const year = date.getFullYear()
    const month = date.getMonth()
    const startDay = new Date(year, month, 1)
    const endDay = new Date(year, month + 1, 0, 23, 59, 59)
    const list = await CalCalendarApi.getCalendarList({
      queryType: 'TYPE',
      calendarType: selectedType.value,
      startDay: formatDate(startDay, 'YYYY-MM-DD HH:mm:ss'),
      endDay: formatDate(endDay, 'YYYY-MM-DD HH:mm:ss')
    })
    // 转为 Map 方便按日期快速查找
    calendarDayMap.value.clear()
    if (!list) {
      return
    }
    list.forEach((item: CalCalendarDayVO) => {
      // 后端返回的 day 为时间戳（long），格式化为 yyyy-MM-dd 作为 Map key
      const day = item.day ? formatDate(item.day as any, 'YYYY-MM-DD') : ''
      if (day) {
        calendarDayMap.value.set(day, { ...item, day })
      }
    })
  } finally {
    loading.value = false
  }
}

/** 点击左侧分类后切换并刷新日历 */
const onSelectType = (value: number) => {
  selectedType.value = value
  fetchCalendar()
}

/** 监听月份切换，重新加载当月排班 */
watch(currentDate, () => {
  if (selectedType.value) {
    fetchCalendar()
  }
})

/** 初始化：加载节假日，并默认选中第一个分类 */
onMounted(() => {
  getHolidayList()
  const opts = getIntDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE)
  if (opts.length > 0) {
    onSelectType(opts[0].value as number)
  }
})
</script>
