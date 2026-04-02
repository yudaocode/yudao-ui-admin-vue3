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
import { CalTeamApi, CalTeamVO } from '@/api/mes/cal/team'
import CalendarDateCell from './CalendarDateCell.vue'
import CalendarLegend from './CalendarLegend.vue'
import { useCalendar } from './useCalendar'

const { loading, currentDate, calendarDayMap, holidaySet, loadHolidays, fetchCalendar, watchMonth } =
  useCalendar()

const selectedTeamId = ref<number>() // 当前选中的班组编号
const teamList = ref<CalTeamVO[]>([]) // 所有班组列表

/** 获取班组列表，并默认选中第一个 */
const getTeamList = async () => {
  teamList.value = await CalTeamApi.getTeamList()
  if (teamList.value.length > 0) {
    onSelectTeam(teamList.value[0].id)
  }
}

/** 查询当前月份的排班日历，按选中班组过滤 */
const doFetch = () => {
  if (!selectedTeamId.value) return
  fetchCalendar({ queryType: 'TEAM', teamId: selectedTeamId.value })
}

/** 点击左侧班组后切换并刷新日历 */
const onSelectTeam = (id: number) => {
  selectedTeamId.value = id
  doFetch()
}

/** 监听月份切换，重新加载当月排班 */
watchMonth(() => {
  if (selectedTeamId.value) {
    doFetch()
  }
})

/** 初始化 */
onMounted(() => {
  getTeamList()
  loadHolidays()
})
</script>
