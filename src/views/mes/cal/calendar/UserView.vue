<!-- 排班日历 - 按个人视图 -->
<template>
  <div>
    <!-- 顶部：人员选择 -->
    <el-form :inline="true" label-width="80px" class="mb-10px">
      <el-form-item label="人员">
        <el-select
          v-model="userId"
          filterable
          placeholder="请选择人员"
          class="!w-200px"
          @change="onUserQuery"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.nickname"
            :value="user.id"
          />
        </el-select>
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
import { CalCalendarApi, CalCalendarDayVO } from '@/api/mes/cal/calendar'
import { CalHolidayApi, CalHolidayVO } from '@/api/mes/cal/holiday'
import { getSimpleUserList, UserVO } from '@/api/system/user'
import { formatDate } from '@/utils/formatTime'
import { HolidayType } from '@/views/mes/utils/constants'
import CalendarDateCell from './CalendarDateCell.vue'
import CalendarLegend from './CalendarLegend.vue'

const loading = ref(false)
const currentDate = ref(new Date()) // 日历当前显示月份
const userId = ref<number>() // 当前选中的用户编号
const userList = ref<UserVO[]>([]) // 所有用户列表
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

/** 查询当前月份的排班日历，按选中人员过滤 */
const fetchCalendar = async () => {
  if (!userId.value) return
  loading.value = true
  try {
    // 计算当前月份的起止时间
    const date = currentDate.value
    const year = date.getFullYear()
    const month = date.getMonth()
    const startDay = new Date(year, month, 1)
    const endDay = new Date(year, month + 1, 0, 23, 59, 59)
    const list = await CalCalendarApi.getCalendarList({
      queryType: 'USER',
      userId: userId.value,
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

/** 查询按钮 / 下拉选人后刷新日历 */
const onUserQuery = () => {
  fetchCalendar()
}

/** 监听月份切换，重新加载当月排班 */
watch(currentDate, () => {
  if (userId.value) {
    fetchCalendar()
  }
})

/** 初始化 */
onMounted(async () => {
  userList.value = await getSimpleUserList()
  await getHolidayList()
})
</script>
