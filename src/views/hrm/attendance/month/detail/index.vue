<template>
  <ContentWrap v-loading="loading">
    <el-descriptions :column="4" border>
      <el-descriptions-item label="员工">
        {{ detail?.summary.employeeName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="工号">
        {{ detail?.summary.jobNumber || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="部门">
        {{ detail?.summary.deptName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="岗位">
        {{ detail?.summary.postName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="考勤组">
        {{ detail?.summary.attendanceGroupName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="入职时间">
        {{ formatHrmDateTime(detail?.summary.entryTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="员工状态">
        <dict-tag
          v-if="detail?.summary.employeeStatus !== undefined"
          :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
          :value="detail.summary.employeeStatus"
        />
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="工作城市">
        {{ detail?.summary.workCity || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="月份">{{ yearMonth }}</el-descriptions-item>
      <el-descriptions-item label="应出勤">
        {{ detail?.summary.attendDays || 0 }} 天
      </el-descriptions-item>
      <el-descriptions-item label="实际出勤">
        {{ formatHrmDays(detail?.summary.actualDays) }} 天
      </el-descriptions-item>
      <el-descriptions-item label="是否全勤">
        {{ detail?.summary.fullAttendance ? '是' : '否' }}
      </el-descriptions-item>
      <el-descriptions-item label="迟到">
        {{ detail?.summary.lateCount || 0 }} 次 / {{ detail?.summary.lateMinute || 0 }} 分钟
      </el-descriptions-item>
      <el-descriptions-item label="早退">
        {{ detail?.summary.earlyCount || 0 }} 次 / {{ detail?.summary.earlyMinute || 0 }} 分钟
      </el-descriptions-item>
      <el-descriptions-item label="缺卡">
        {{ detail?.summary.misscardCount || 0 }} 次
      </el-descriptions-item>
      <el-descriptions-item label="旷工">
        {{ formatHrmDays(detail?.summary.absenteeismDays) }} 天
      </el-descriptions-item>
      <el-descriptions-item label="请假">
        {{ formatHrmDays(detail?.summary.leaveDays) }} 天
      </el-descriptions-item>
      <el-descriptions-item label="考勤扣款">
        {{ formatHrmMoney(detail?.summary.attendanceDeductAmount) }} 元
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>

  <!-- 每日考勤日历 -->
  <ContentWrap v-loading="loading">
    <div class="mb-16px flex flex-wrap items-center justify-between gap-12px">
      <span class="text-16px font-600">
        {{ formatDate(`${yearMonth}-01`, 'YYYY 年 MM 月') }}
      </span>
      <el-radio-group v-model="dailyStatusFilter">
        <el-radio-button v-for="item in dailyStatusOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </div>
    <div class="overflow-x-auto">
      <div
        class="min-w-980px overflow-hidden border-l border-t border-[var(--el-border-color-lighter)]"
      >
        <div class="grid grid-cols-7 bg-[var(--el-fill-color-light)]">
          <div
            v-for="weekDay in HRM_WEEK_OPTIONS"
            :key="weekDay.value"
            class="border-b border-r border-[var(--el-border-color-lighter)] py-12px text-center font-600"
          >
            {{ weekDay.label }}
          </div>
        </div>
        <div class="grid grid-cols-7">
          <div
            v-for="day in calendarDays"
            :key="day.date"
            class="min-h-150px border-b border-r border-[var(--el-border-color-lighter)] p-8px"
            :class="{ 'bg-[var(--el-fill-color-lighter)]': !day.currentMonth }"
          >
            <div class="mb-8px flex items-center justify-between">
              <span
                :class="day.currentMonth ? 'font-600' : 'text-[var(--el-text-color-placeholder)]'"
              >
                {{ day.day }}
              </span>
              <el-tag
                v-if="day.detail?.attendanceResult"
                :type="getAttendanceResultType(day.detail.attendanceResult)"
                size="small"
                effect="light"
              >
                {{ day.detail.attendanceResult }}
              </el-tag>
            </div>
            <template v-if="day.currentMonth && day.detail && isDailyDetailVisible(day.detail)">
              <div class="mb-6px text-12px text-[var(--el-text-color-secondary)]">
                {{ day.detail.shiftName || '未排班' }}
              </div>
              <div
                v-for="clock in day.detail.clockList || []"
                :key="clock.id || String(clock.clockTime)"
                class="mb-4px flex items-center justify-between gap-6px text-12px"
              >
                <dict-tag :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE" :value="clock.type" />
                <span class="flex-1 text-right">
                  {{ formatDate(clock.clockTime, 'HH:mm') || '-' }}
                </span>
                <dict-tag
                  :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS"
                  :value="clock.status ?? ''"
                />
              </div>
              <div
                v-if="day.detail.leaveMinutes"
                class="mt-4px text-12px text-[var(--el-color-info)]"
              >
                请假 {{ formatHrmDays(day.detail.leaveDays) }} 天
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </ContentWrap>

  <!-- 请假记录 -->
  <ContentWrap title="请假记录">
    <div class="mb-16px">
      <el-select v-model="leaveTypeFilter" placeholder="请选择请假类型" clearable class="!w-240px">
        <el-option
          v-for="item in getStrDictOptions(DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE)"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <el-table :data="filteredLeaveList" :show-overflow-tooltip="true">
      <el-table-column label="类型" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="开始时间" width="180">
        <template #default="scope">{{ formatHrmDateTime(scope.row.startTime) }}</template>
      </el-table-column>
      <el-table-column label="结束时间" width="180">
        <template #default="scope">{{ formatHrmDateTime(scope.row.endTime) }}</template>
      </el-table-column>
      <el-table-column label="时长" width="100">
        <template #default="scope">{{ formatHrmDays(scope.row.day) }} 天</template>
      </el-table-column>
      <el-table-column label="事由" prop="reason" min-width="180" />
    </el-table>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import dayjs from 'dayjs'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as AttendanceStatisticsApi from '@/api/hrm/attendance/statistics'
import { HRM_WEEK_OPTIONS } from '@/views/hrm/utils/constants'
import { formatHrmDateTime, formatHrmDays, formatHrmMoney } from '@/views/hrm/utils/format'

/** 月度考勤详情 */
defineOptions({ name: 'HrmAttendanceMonthDetail' })

const route = useRoute() // 当前路由
const loading = ref(false) // 详情的加载中
const detail = ref<AttendanceStatisticsApi.HrmAttendanceMonthDetailVO>() // 月度考勤详情
const dailyStatusFilter = ref('all') // 每日考勤状态筛选
const leaveTypeFilter = ref<string>() // 请假类型筛选
const employeeId = computed(() => parseId(route.params.employeeId)) // 员工编号
const year = computed(() => Number(route.query.year) || dayjs().year()) // 年份
const month = computed(() => Number(route.query.month) || dayjs().month() + 1) // 月份
const yearMonth = computed(() => `${year.value}-${String(month.value).padStart(2, '0')}`) // 年月
const dailyDetailMap = computed(
  () =>
    new Map(
      (detail.value?.dailyDetails || []).map((item) => [
        formatDate(item.attendanceTime, 'YYYY-MM-DD'),
        item
      ])
    )
)
const filteredLeaveList = computed(() =>
  (detail.value?.leaves || []).filter(
    (item) => !leaveTypeFilter.value || item.type === leaveTypeFilter.value
  )
)
const dailyStatusOptions = [
  { label: '全部', value: 'all' },
  { label: '实际出勤', value: 'attendance' },
  { label: '迟到', value: 'late' },
  { label: '早退', value: 'early' },
  { label: '旷工', value: 'absenteeism' },
  { label: '缺卡', value: 'misscard' }
] as const
const calendarDays = computed(() => {
  const monthStart = dayjs(`${yearMonth.value}-01`)
  const mondayOffset = (monthStart.day() + 6) % 7
  const calendarStart = monthStart.subtract(mondayOffset, 'day')
  return Array.from({ length: 42 }, (_, index) => {
    const date = calendarStart.add(index, 'day')
    const dateValue = formatDate(date, 'YYYY-MM-DD')
    return {
      date: dateValue,
      day: date.date(),
      currentMonth: formatDate(date, 'YYYY-MM') === yearMonth.value,
      detail: dailyDetailMap.value.get(dateValue)
    }
  })
})

/** 加载月度考勤详情 */
async function getDetail() {
  if (!employeeId.value || !dayjs(`${yearMonth.value}-01`).isValid()) {
    return
  }
  loading.value = true
  try {
    detail.value = await AttendanceStatisticsApi.getAttendanceMonthDetail({
      employeeId: employeeId.value,
      year: year.value,
      month: month.value
    })
  } finally {
    loading.value = false
  }
}

/** 判断每日考勤明细是否符合筛选条件 */
function isDailyDetailVisible(item: AttendanceStatisticsApi.HrmAttendanceDailyDetailVO) {
  switch (dailyStatusFilter.value) {
    case 'attendance':
      return item.clockList?.length > 0
    case 'late':
      return item.lateCount > 0
    case 'early':
      return item.earlyCount > 0
    case 'absenteeism':
      return item.absenteeism === true
    case 'misscard':
      return (item.misscardCount || 0) > 0
    default:
      return true
  }
}

/** 获得考勤结果颜色 */
function getAttendanceResultType(result?: string): 'success' | 'warning' | 'danger' | 'info' {
  if (result === '正常') {
    return 'success'
  }
  if (result?.includes('旷工')) {
    return 'danger'
  }
  if (result?.includes('缺卡') || result?.includes('迟到') || result?.includes('早退')) {
    return 'warning'
  }
  return 'info'
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
