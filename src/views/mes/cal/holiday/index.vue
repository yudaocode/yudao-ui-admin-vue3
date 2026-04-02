<!-- MES 假期设置 - 日历视图 -->
<template>
  <ContentWrap>
    <el-calendar v-model="currentDate">
      <template #date-cell="{ data }">
        <div class="h-full p-4px" @click.stop="onClickDay(data)">
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
            class="text-12px text-#909399 mt-4px"
            :class="{ 'text-#67c23a': hasFestival(data.day) }"
          >
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
import { formatDate } from '@/utils/formatTime'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import PluginLunar from 'dayjs-plugin-lunar'
import { SolarDay } from 'tyme4ts'
import HolidayForm from './HolidayForm.vue'
import { checkPermi } from '@/utils/permission'
import { HolidayType } from '@/views/mes/utils/constants'

dayjs.locale('zh-cn')
dayjs.extend(PluginLunar)

defineOptions({ name: 'MesCalHoliday' })

const message = useMessage()
const currentDate = ref(new Date())
const holidaySet = ref(new Set<string>()) // 节假日日期集合
const formRef = ref()
const lastFetchedMonth = ref('') // 用于避免同月重复请求

/** 获取假期列表（按当前日历可见范围过滤） */
const getList = async () => {
  holidaySet.value.clear()
  // 计算日历组件可见范围：当月 ± 1 月（el-calendar 会显示上月末和下月初）
  const current = dayjs(currentDate.value)
  const startDay = current.subtract(1, 'month').startOf('month').format('YYYY-MM-DD 00:00:00')
  const endDay = current.add(1, 'month').endOf('month').format('YYYY-MM-DD 23:59:59')
  const list = await CalHolidayApi.getHolidayList({ startDay, endDay })
  if (list) {
    list.forEach((item: CalHolidayVO) => {
      // 后端返回的 day 为时间戳（long），格式化为 yyyy-MM-dd
      const day = item.day ? formatDate(item.day as any, 'YYYY-MM-DD') : ''
      if (day && item.type === HolidayType.HOLIDAY) {
        holidaySet.value.add(day)
      }
    })
  }
  lastFetchedMonth.value = current.format('YYYY-MM')
}

/** 监听月份切换，重新加载可见范围内的数据 */
watch(currentDate, (newDate) => {
  const newMonth = dayjs(newDate).format('YYYY-MM')
  if (newMonth !== lastFetchedMonth.value) {
    getList()
  }
})

/** 点击日期 */
const onClickDay = (data: { type: string; day: string }) => {
  // 非当前月日期，不处理（避免切换月份）
  if (data.type !== 'current-month') {
    return
  }
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
  const year = parseInt(parts[0])
  const month = parseInt(parts[1])
  const date = parseInt(parts[2])
  try {
    const solarDay = SolarDay.fromYmd(year, month, date)
    const lunarDay = solarDay.getLunarDay()
    const solarFestival = solarDay.getFestival() // 公历节日
    const lunarFestival = lunarDay.getFestival() // 农历节日
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
</script>
