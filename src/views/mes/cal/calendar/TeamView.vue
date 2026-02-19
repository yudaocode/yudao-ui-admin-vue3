<!-- 排班日历 - 按班组视图 -->
<template>
  <div class="flex">
    <!-- 左侧：班组列表选择 -->
    <div class="w-150px shrink-0 mr-12px border border-solid border-#dcdfe6 rounded-4px overflow-hidden">
      <div
        v-for="team in teamList"
        :key="team.id"
        class="px-16px py-10px cursor-pointer text-14px text-#606266 border-b border-b-solid border-b-#ebeef5 last:border-b-0 hover:bg-#f5f7fa transition-colors"
        :class="selectedTeamId === team.id ? 'bg-#ecf5ff text-#409eff font-500' : ''"
        @click="selectedTeamId = team.id; onTeamSelected()"
      >
        {{ team.name }}
      </div>
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
import { CalTeamApi, CalTeamVO } from '@/api/mes/cal/team'
import { CalHolidayApi, CalHolidayVO } from '@/api/mes/cal/holiday'
import { formatDate } from '@/utils/formatTime'
import { SolarDay } from 'tyme4ts'
import { HolidayType, MesCalShiftTypeEnum } from '@/views/mes/utils/constants'

const loading = ref(false)
const currentDate = ref(new Date())
const selectedTeamId = ref<number>()
const teamList = ref<CalTeamVO[]>([])
const calendarDayMap = ref<Map<string, CalCalendarDayVO>>(new Map())
const holidaySet = ref(new Set<string>())

/** 获取班组列表 */
const getTeamList = async () => {
  teamList.value = await CalTeamApi.getTeamList()
}

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
  if (!selectedTeamId.value) return
  loading.value = true
  try {
    const date = currentDate.value
    const year = date.getFullYear()
    const month = date.getMonth()
    const startDay = new Date(year, month, 1)
    const endDay = new Date(year, month + 1, 0, 23, 59, 59)
    const list = await CalCalendarApi.getCalendarList({
      queryType: 'TEAM',
      teamId: selectedTeamId.value,
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

/** 选择班组 */
const onTeamSelected = () => {
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
  if (selectedTeamId.value) {
    fetchCalendar()
  }
})

/** 初始化 */
onMounted(() => {
  getTeamList()
  getHolidayList()
})
</script>
