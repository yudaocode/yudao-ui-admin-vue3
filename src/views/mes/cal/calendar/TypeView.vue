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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import CalendarDateCell from './CalendarDateCell.vue'
import CalendarLegend from './CalendarLegend.vue'
import { useCalendar } from './useCalendar'

const { loading, currentDate, calendarDayMap, holidaySet, loadHolidays, fetchCalendar, watchMonth } =
  useCalendar()

const selectedType = ref<number>() // 当前选中的班组类型（枚举 MES_CAL_CALENDAR_TYPE）

/** 查询当前月份的排班日历，按选中分类过滤 */
const doFetch = () => {
  if (!selectedType.value) return
  fetchCalendar({ queryType: 'TYPE', calendarType: selectedType.value })
}

/** 点击左侧分类后切换并刷新日历 */
const onSelectType = (value: number) => {
  selectedType.value = value
  doFetch()
}

/** 监听月份切换，重新加载当月排班 */
watchMonth(() => {
  if (selectedType.value) {
    doFetch()
  }
})

/** 初始化：加载节假日，并默认选中第一个分类 */
onMounted(() => {
  loadHolidays()
  const opts = getIntDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE)
  if (opts.length > 0) {
    onSelectType(opts[0].value as number)
  }
})
</script>
