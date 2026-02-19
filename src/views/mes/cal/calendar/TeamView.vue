<!-- 排班日历 - 按班组视图 -->
<template>
  <div class="flex">
    <!-- 左侧：班组列表选择 -->
    <div
      class="w-150px shrink-0 mr-12px border border-solid border-#dcdfe6 rounded-4px overflow-hidden"
    >
      <div
        v-for="team in teamList"
        :key="team.id"
        class="px-16px py-10px cursor-pointer text-14px text-#606266 border-b border-b-solid border-b-#ebeef5 last:border-b-0 hover:bg-#f5f7fa transition-colors"
        :class="selectedTeamId === team.id ? 'bg-#ecf5ff text-#409eff font-500' : ''"
        @click="onSelectTeam(team.id)"
      >
        {{ team.name }}
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
import { CalTeamApi, CalTeamVO } from '@/api/mes/cal/team'
import { CalHolidayApi, CalHolidayVO } from '@/api/mes/cal/holiday'
import { formatDate } from '@/utils/formatTime'
import { HolidayType } from '@/views/mes/utils/constants'
import CalendarDateCell from './CalendarDateCell.vue'
import CalendarLegend from './CalendarLegend.vue'

const loading = ref(false)
const currentDate = ref(new Date()) // 日历当前显示月份
const selectedTeamId = ref<number>() // 当前选中的班组编号
const teamList = ref<CalTeamVO[]>([]) // 所有班组列表
const calendarDayMap = ref<Map<string, CalCalendarDayVO>>(new Map()) // key: yyyy-MM-dd
const holidaySet = ref(new Set<string>()) // 节假日日期集合，key: yyyy-MM-dd

/** 获取班组列表，并默认选中第一个 */
const getTeamList = async () => {
  teamList.value = await CalTeamApi.getTeamList()
  if (teamList.value.length > 0) {
    onSelectTeam(teamList.value[0].id)
  }
}

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

/** 查询当前月份的排班日历，按选中班组过滤 */
const fetchCalendar = async () => {
  if (!selectedTeamId.value) return
  loading.value = true
  try {
    // 计算当前月份的起止时间
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
    // 转为 Map 方便按日期快速查找
    calendarDayMap.value.clear()
    if (!list) {
      return
    }
    list.forEach((item: CalCalendarDayVO) => {
      calendarDayMap.value.set(item.day, item)
    })
  } finally {
    loading.value = false
  }
}

/** 点击左侧班组后切换并刷新日历 */
const onSelectTeam = (id: number) => {
  selectedTeamId.value = id
  fetchCalendar()
}

/** 监听月份切换，重新加载当月排班 */
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
