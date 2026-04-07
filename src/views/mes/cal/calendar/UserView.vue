<!-- 排班日历 - 按个人视图 -->
<template>
  <div>
    <!-- 顶部：人员选择 -->
    <el-form :inline="true" label-width="80px" class="mb-10px">
      <el-form-item label="人员">
        <UserSelectV2
          v-model="userId"
          placeholder="请输入人员姓名搜索"
          class="!w-200px"
          @change="onUserQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onUserQuery">
          <Icon icon="ep:search" class="mr-5px" /> 查询
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 日历 -->
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
</template>

<script setup lang="ts">
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import CalendarDateCell from './CalendarDateCell.vue'
import CalendarLegend from './CalendarLegend.vue'
import { useCalendar } from './useCalendar'

const {
  loading,
  currentDate,
  calendarDayMap,
  holidaySet,
  loadHolidays,
  fetchCalendar,
  watchMonth
} = useCalendar()

const userId = ref<number>() // 当前选中的用户编号

/** 查询当前月份的排班日历，按选中人员过滤 */
const doFetch = () => {
  if (!userId.value) return
  fetchCalendar({ queryType: 'USER', userId: userId.value })
}

/** 查询按钮 / 下拉选人后刷新日历 */
const onUserQuery = () => {
  doFetch()
}

/** 监听月份切换，重新加载当月排班 */
watchMonth(() => {
  if (userId.value) {
    doFetch()
  }
})

/** 初始化 */
onMounted(async () => {
  await loadHolidays()
})
</script>
