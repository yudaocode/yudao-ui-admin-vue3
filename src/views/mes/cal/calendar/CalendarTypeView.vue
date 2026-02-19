<!-- 排班日历 - 按分类视图 -->
<template>
  <div class="flex">
    <!-- 左侧：班组类型选择 -->
    <div class="w-150px mr-10px">
      <el-radio-group v-model="selectedType" class="flex flex-col" @change="onTypeSelected">
        <el-radio-button
          v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE)"
          :key="dict.value"
          :value="dict.value"
          class="!rounded-0 !border-b-1px !border-b-solid !border-b-gray-200"
        >
          {{ dict.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <!-- 右侧：日历 -->
    <div class="flex-1">
      <el-calendar v-model="currentDate" v-loading="loading">
        <template #date-cell="{ data }">
          <div class="h-full p-4px">
            <div class="flex justify-between items-center">
              <span class="text-16px font-500" :class="{ 'text-#f56c6c': isWeekend(data.day) }">
                {{ data.day.split('-')[2] }}
              </span>
              <el-tag v-if="holidaySet.has(data.day)" size="small" effect="dark" type="success">
                休
              </el-tag>
              <el-tag v-else size="small" effect="dark"> 班 </el-tag>
            </div>
            <div
              class="text-12px text-#909399 mt-2px"
              :class="{ 'text-#67c23a': hasFestival(data.day) }"
            >
              {{ getLunarDisplay(data.day) }}
            </div>
            <!-- 班次信息 -->
            <template v-if="!holidaySet.has(data.day)">
              <div
                v-for="item in getTeamShiftsForDay(data.day)"
                :key="item.sort"
                class="mt-2px"
              >
                <el-button
                  v-if="item.sort === 1"
                  type="success"
                  size="small"
                  class="!w-full !text-12px"
                >
                  {{ item.teamName }}
                </el-button>
                <el-button
                  v-else-if="item.sort === 2"
                  :type="getShiftTypeForDay(data.day) === MesCalShiftTypeEnum.THREE ? 'warning' : 'info'"
                  size="small"
                  class="!w-full !text-12px"
                >
                  {{ item.teamName }}
                </el-button>
                <el-button
                  v-else-if="item.sort === 3"
                  type="info"
                  size="small"
                  class="!w-full !text-12px"
                >
                  {{ item.teamName }}
                </el-button>
              </div>
            </template>
          </div>
        </template>
      </el-calendar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalCalendarApi, CalCalendarDayVO } from '@/api/mes/cal/calendar'
import { CalHolidayApi, CalHolidayVO } from '@/api/mes/cal/holiday'
import { formatDate } from '@/utils/formatTime'
import { SolarDay } from 'tyme4ts'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { HolidayType, MesCalShiftTypeEnum } from '@/views/mes/utils/constants'

const loading = ref(false)
const currentDate = ref(new Date())
const selectedType = ref<number>()
const calendarDayMap = ref<Map<string, CalCalendarDayVO>>(new Map())
const holidaySet = ref(new Set<string>())

/** 获取假期列表 */
const getHolidayList = async () => {
  holidaySet.value.clear()
  const list = await CalHolidayApi.getHolidayList()
  if (list) {
    list.forEach((item: CalHolidayVO) => {
      const day = item.day ? formatDate(item.day as any, 'YYYY-MM-DD') : ''
      if (day && item.type === HolidayType.HOLIDAY) {
        holidaySet.value.add(day)
      }
    })
  }
}

/** 查询排班日历 */
const fetchCalendar = async () => {
  if (!selectedType.value) return
  loading.value = true
  try {
    // 计算当前月份的起止日期
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
    calendarDayMap.value.clear()
    if (list) {
      list.forEach((item: CalCalendarDayVO) => {
        calendarDayMap.value.set(item.day, item)
      })
    }
  } finally {
    loading.value = false
  }
}

/** 选择分类 */
const onTypeSelected = () => {
  fetchCalendar()
}

/** 获取指定日期的班次列表 */
const getTeamShiftsForDay = (day: string) => {
  const calDay = calendarDayMap.value.get(day)
  return calDay?.teamShifts || []
}

/** 获取指定日期的轮班方式 */
const getShiftTypeForDay = (day: string) => {
  const calDay = calendarDayMap.value.get(day)
  return calDay?.shiftType
}

/** 判断是否周末 */
const isWeekend = (day: string): boolean => {
  const date = new Date(day)
  const weekDay = date.getDay()
  return weekDay === 0 || weekDay === 6
}

/** 获取农历显示信息 */
const getLunarInfo = (day: string) => {
  const parts = day.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1])
  const date = parseInt(parts[2])
  try {
    const solarDay = SolarDay.fromYmd(year, month, date)
    const lunarDay = solarDay.getLunarDay()
    const solarFestival = solarDay.getFestival()
    const lunarFestival = lunarDay.getFestival()
    const termDay = solarDay.getTermDay()
    const termName = termDay.getDayIndex() === 0 ? termDay.getSolarTerm().getName() : null
    const lunarMonthName = lunarDay.getLunarMonth().getName()
    const lunarDayName = lunarDay.getName()
    return {
      solarFestival: solarFestival ? solarFestival.getName() : null,
      lunarFestival: lunarFestival ? lunarFestival.getName() : null,
      termName,
      lunarText: lunarMonthName + lunarDayName
    }
  } catch {
    return { solarFestival: null, lunarFestival: null, termName: null, lunarText: '' }
  }
}

/** 获取农历显示文本 */
const getLunarDisplay = (day: string): string => {
  const info = getLunarInfo(day)
  return info.solarFestival || info.lunarFestival || info.termName || info.lunarText
}

/** 判断是否有节日 */
const hasFestival = (day: string): boolean => {
  const info = getLunarInfo(day)
  return !!(info.solarFestival || info.lunarFestival || info.termName)
}

// 监听月份变化
watch(currentDate, () => {
  if (selectedType.value) {
    fetchCalendar()
  }
})

/** 初始化 */
onMounted(() => {
  getHolidayList()
})
</script>
