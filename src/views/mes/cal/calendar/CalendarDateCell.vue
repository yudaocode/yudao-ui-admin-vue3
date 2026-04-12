<!-- 排班日历 - 日历格子（公共组件） -->
<template>
  <div class="h-full p-4px flex flex-col overflow-hidden">
    <!-- 顶部：日期数字 + 上班/休息标签 -->
    <div class="flex justify-between items-center shrink-0">
      <span class="text-16px font-500" :class="{ 'text-#f56c6c': isWeekend }">
        {{ dayNumber }}
      </span>
      <el-tag v-if="isHoliday" size="small" effect="dark" type="success">休</el-tag>
      <el-tag v-else size="small" effect="dark"> 班 </el-tag>
    </div>
    <!-- 农历 / 节气 / 节日显示 -->
    <div
      class="text-11px text-#909399 mt-1px shrink-0 truncate"
      :class="{ 'text-#67c23a': hasFestivalDay }"
    >
      {{ lunarDisplay }}
    </div>
    <!-- 班次列表：节假日不显示排班 -->
    <!--
      配色规则（sort 对应轮班方式中的班次顺序）：
        sort=1  白班  → 绿色（#95d475）
        sort=2  中班  → 三班倒用橙色（#f0a020），两班倒用灰色（#909399）
        sort=3  夜班  → 灰色（#909399）
    -->
    <div v-if="!isHoliday" class="mt-2px flex flex-col gap-1px overflow-hidden">
      <div v-for="item in teamShifts" :key="item.sort">
        <!-- sort=1 白班：绿色 -->
        <div v-if="item.sort === 1" class="shift-tag bg-#95d475">
          {{ item.shiftName }} · {{ item.teamName }}
        </div>
        <!-- sort=2 中班：三班倒时橙色，两班倒时灰色 -->
        <div
          v-else-if="item.sort === 2"
          class="shift-tag"
          :class="shiftType === MesCalShiftTypeEnum.THREE ? 'bg-#f0a020' : 'bg-#909399'"
        >
          {{ item.shiftName }} · {{ item.teamName }}
        </div>
        <!-- sort=3 夜班：灰色 -->
        <div v-else-if="item.sort === 3" class="shift-tag bg-#909399">
          {{ item.shiftName }} · {{ item.teamName }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SolarDay } from 'tyme4ts'
import { MesCalShiftTypeEnum } from '@/views/mes/utils/constants'
import type { CalCalendarDayVO } from '@/api/mes/cal/calendar'

const props = defineProps<{
  day: string // 日期，格式 yyyy-MM-dd
  holidaySet: Set<string> // 节假日集合，key: yyyy-MM-dd
  calendarDayMap: Map<string, CalCalendarDayVO> // 排班数据，key: yyyy-MM-dd
}>()

const dayNumber = computed(() => props.day.split('-')[2]) // 取日期中的"日"部分展示
const isHoliday = computed(() => props.holidaySet.has(props.day)) // 是否节假日
const isWeekend = computed(() => {
  const date = new Date(props.day)
  const weekDay = date.getDay()
  return weekDay === 0 || weekDay === 6 // 0=周日，6=周六
})

const calDay = computed(() => props.calendarDayMap.get(props.day)) // 当天排班数据
const teamShifts = computed(() => calDay.value?.teamShifts || []) // 当天班组排班列表
const shiftType = computed(() => calDay.value?.shiftType) // 当天轮班方式（用于区分配色）

/** 解析当天的农历、节气、节日信息 */
const lunarInfo = computed(() => {
  const parts = props.day.split('-')
  const year = parseInt(parts[0])
  const month = parseInt(parts[1])
  const date = parseInt(parts[2])
  try {
    const solarDay = SolarDay.fromYmd(year, month, date)
    const lunarDay = solarDay.getLunarDay()
    const solarFestival = solarDay.getFestival() // 公历节日，如 元旦
    const lunarFestival = lunarDay.getFestival() // 农历节日，如 春节
    const termDay = solarDay.getTermDay()
    const termName = termDay.getDayIndex() === 0 ? termDay.getSolarTerm().getName() : null // 节气，仅节气当天取值
    const lunarMonthName = lunarDay.getLunarMonth().getName()
    const lunarDayName = lunarDay.getName()
    return {
      solarFestival: solarFestival ? solarFestival.getName() : null,
      lunarFestival: lunarFestival ? lunarFestival.getName() : null,
      termName,
      lunarText: lunarMonthName + lunarDayName // 兜底：显示农历月日，如 正月初一
    }
  } catch {
    return { solarFestival: null, lunarFestival: null, termName: null, lunarText: '' }
  }
})

/** 优先级：公历节日 > 农历节日 > 节气 > 农历月日 */
const lunarDisplay = computed(() => {
  const info = lunarInfo.value
  return info.solarFestival || info.lunarFestival || info.termName || info.lunarText
})

/** 当天是否有节日或节气（用于高亮显示农历文字） */
const hasFestivalDay = computed(() => {
  const info = lunarInfo.value
  return !!(info.solarFestival || info.lunarFestival || info.termName)
})
</script>

<style scoped>
/* 紧凑的班次标签：替代 el-button，减少纵向占用 */
.shift-tag {
  padding: 1px 4px;
  font-size: 11px;
  line-height: 1.5;
  border-radius: 3px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
</style>
