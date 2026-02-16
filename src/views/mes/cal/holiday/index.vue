<!-- MES 假期设置 - 日历视图 -->
<template>
  <ContentWrap>
    <!-- TODO @AI：从周一到周日，这样的视图； -->
    <el-calendar v-model="currentDate">
      <template #date-cell="{ data }">
        <div class="calendar-cell" @contextmenu.prevent="onRightClick(data)">
          <div class="calendar-cell-header">
            <span class="solar-day" :class="{ weekend: isWeekend(data.day) }">
              {{ data.day.split('-')[2] }}
            </span>
            <el-tag
              v-if="holidaySet.has(data.day)"
              size="small"
              effect="dark"
              type="success"
            >
              休
            </el-tag>
            <el-tag
              v-else-if="workdaySet.has(data.day)"
              size="small"
              effect="dark"
              type="primary"
            >
              班
            </el-tag>
          </div>
          <div class="lunar-day" :class="{ festival: hasFestival(data.day) }">
            {{ getLunarDisplay(data.day) }}
          </div>
        </div>
      </template>
    </el-calendar>

    <!-- 假期设置表单弹窗 -->
    <HolidayForm ref="formRef" @success="getList" />
  </ContentWrap>
</template>
<script setup lang="ts">
import { CalHolidayApi, CalHolidayVO } from '@/api/mes/cal/holiday'
import dayjs from 'dayjs'
import PluginLunar from 'dayjs-plugin-lunar'
import { SolarDay } from 'tyme4ts'
import HolidayForm from './HolidayForm.vue'
import { checkPermi } from '@/utils/permission'

dayjs.extend(PluginLunar)

defineOptions({ name: 'MesCalHoliday' })

const message = useMessage()
const currentDate = ref(new Date())
const holidaySet = ref(new Set<string>()) // HOLIDAY 日期集合
const workdaySet = ref(new Set<string>()) // WORKDAY 日期集合
const formRef = ref()

/** 获取假期列表 */
const getList = async () => {
  holidaySet.value.clear()
  workdaySet.value.clear()
  const list = await CalHolidayApi.getHolidayList()
  if (list) {
    list.forEach((item: CalHolidayVO) => {
      // 后端返回的 theDay 为 datetime 格式，取前 10 位（yyyy-MM-dd）
      const day = item.theDay ? item.theDay.substring(0, 10) : ''
      if (!day) {
        return
      }
      if (item.type === 'HOLIDAY') {
        holidaySet.value.add(day)
      } else if (item.type === 'WORKDAY') {
        workdaySet.value.add(day)
      }
    })
  }
}

/** 右键点击日期 */
const onRightClick = (data: { day: string }) => {
  // 权限校验
  if (!checkPermi(['mes:cal-holiday:create'])) {
    message.warning('没有假期设置权限')
    return
  }
  formRef.value.open(data.day)
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
  const y = parseInt(parts[0]), m = parseInt(parts[1]), d = parseInt(parts[2])
  try {
    const solarDay = SolarDay.fromYmd(y, m, d)
    const lunarDay = solarDay.getLunarDay()
    // 公历节日
    const solarFestival = solarDay.getFestival()
    // 农历节日
    const lunarFestival = lunarDay.getFestival()
    // 节气：dayIndex === 0 表示当天恰好是节气日
    const termDay = solarDay.getTermDay()
    const termName = termDay.getDayIndex() === 0 ? termDay.getSolarTerm().getName() : null
    // 农历月日
    const lunarMonthName = lunarDay.getLunarMonth().getName() // 正月、二月...
    const lunarDayName = lunarDay.getName() // 初一、初二...
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
  // 优先显示节日、节气，其次显示农历日
  return info.solarFestival || info.lunarFestival || info.termName || info.lunarText
}

/** 判断是否有节日 */
const hasFestival = (day: string): boolean => {
  const info = getLunarInfo(day)
  return !!(info.solarFestival || info.lunarFestival || info.termName)
}

/** 初始化 */
onMounted(() => {
  getList()
})
// TODO @AI：使用 unocss 简化 style；
</script>
<style scoped>
.calendar-cell {
  height: 100%;
  padding: 4px;
}

.calendar-cell-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.solar-day {
  font-size: 16px;
  font-weight: 500;
}

.solar-day.weekend {
  color: #f56c6c;
}

.lunar-day {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.lunar-day.festival {
  color: #67c23a;
}
</style>
