<template>
  <el-calendar
    v-loading="loading"
    :model-value="calendarDate"
    class="attendance-calendar border border-[var(--el-border-color-lighter)] border-solid"
  >
    <template #header>
      <div class="w-full flex items-center justify-between text-15px font-600">
        <span>{{ formatDate(selectedMonth, 'YYYY年MM月') }}考勤明细</span>
        <div class="flex gap-16px text-12px text-[var(--el-text-color-secondary)] font-400">
          <span class="flex items-center gap-5px">
            <i class="h-7px w-7px rounded-50% bg-[var(--el-color-success)]"></i>正常
          </span>
          <span class="flex items-center gap-5px">
            <i class="h-7px w-7px rounded-50% bg-[var(--el-color-danger)]"></i>异常
          </span>
          <span class="flex items-center gap-5px">
            <i class="h-7px w-7px rounded-50% bg-[var(--el-color-info)]"></i>休息
          </span>
        </div>
      </div>
    </template>
    <template #date-cell="{ data }">
      <div
        class="calendar-cell"
        :class="[
          data.type !== 'current-month' && 'is-other-month',
          getDayStatusClass(getDailyDetail(data.day))
        ]"
      >
        <div class="mb-8px flex items-center justify-between font-600">
          <span>{{ Number(data.day.slice(-2)) }}</span>
          <el-tag
            v-if="data.type === 'current-month' && getDailyDetail(data.day)?.attendanceResult"
            :type="getDayTagType(getDailyDetail(data.day))"
            size="small"
            effect="plain"
          >
            {{ getDailyDetail(data.day)?.attendanceResult }}
          </el-tag>
        </div>
        <template v-if="data.type === 'current-month'">
          <div
            v-for="clock in getDailyDetail(data.day)?.clockList || []"
            :key="clock.id || `${clock.type}-${clock.clockTime}`"
            class="mt-4px flex justify-between text-12px text-[var(--el-text-color-secondary)]"
          >
            <span>{{ clock.type === 2 ? '下班' : '上班' }}</span>
            <strong class="text-[var(--el-text-color-primary)] font-500">
              {{ formatDate(clock.clockTime, 'HH:mm') || '--:--' }}
            </strong>
            <em
              class="text-[var(--el-color-success)] not-italic"
              :class="clock.status ? '!text-[var(--el-color-danger)]' : ''"
            >
              {{ getClockStatusName(clock.status) }}
            </em>
          </div>
          <div
            v-if="getDailyBadges(getDailyDetail(data.day)).length"
            class="mt-5px flex flex-wrap gap-3px"
          >
            <el-tag
              v-for="badge in getDailyBadges(getDailyDetail(data.day))"
              :key="badge"
              size="small"
              effect="plain"
            >
              {{ badge }}
            </el-tag>
          </div>
          <div
            v-if="getDailyDetail(data.day) && !(getDailyDetail(data.day)?.clockList || []).length"
            class="mt-14px text-center text-12px text-[var(--el-text-color-placeholder)]"
          >
            暂无打卡
          </div>
        </template>
      </div>
    </template>
  </el-calendar>
</template>

<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import type { HrmAttendanceDailyDetailVO } from '@/api/hrm/attendance/statistics'

defineOptions({ name: 'HrmPortalAttendanceCalendar' })

const props = defineProps<{
  selectedMonth: Date
  calendarDate: Date
  loading: boolean
  dailyDetails?: HrmAttendanceDailyDetailVO[]
}>()

const dailyDetailMap = computed(
  () =>
    new Map(
      (props.dailyDetails || []).map((detail) => [
        formatDate(detail.attendanceTime, 'YYYY-MM-DD'),
        detail
      ])
    )
)

/** 获取每日考勤详情 */
function getDailyDetail(date: string) {
  return dailyDetailMap.value.get(date)
}

/** 是否为异常考勤 */
function isAbnormal(detail?: HrmAttendanceDailyDetailVO) {
  if (!detail) {
    return false
  }
  return (
    (detail.lateCount || 0) > 0 ||
    (detail.earlyCount || 0) > 0 ||
    (detail.misscardCount || 0) > 0 ||
    detail.absenteeism === true
  )
}

/** 获取日期状态样式 */
function getDayStatusClass(detail?: HrmAttendanceDailyDetailVO) {
  if (!detail) {
    return ''
  }
  if (isAbnormal(detail)) {
    return 'is-abnormal'
  }
  if (detail.scheduled === false) {
    return 'is-rest'
  }
  return detail.clockList?.length ? 'is-normal' : ''
}

/** 获取日期标签类型 */
function getDayTagType(detail?: HrmAttendanceDailyDetailVO) {
  if (isAbnormal(detail)) {
    return 'danger'
  }
  if (detail?.scheduled === false) {
    return 'info'
  }
  return 'success'
}

/** 获取打卡状态名称 */
function getClockStatusName(status?: number) {
  return ['正常', '迟到', '早退', '缺卡'][status ?? 0] || '未知'
}

/** 获取每日考勤标记 */
function getDailyBadges(detail?: HrmAttendanceDailyDetailVO) {
  if (!detail) {
    return []
  }
  const badges: string[] = []
  if (Number(detail.leaveDays || 0) > 0) {
    badges.push(`请假${detail.leaveDays}天`)
  }
  return badges
}
</script>

<style scoped>
.attendance-calendar :deep(.el-calendar__body) {
  padding: 0;
}

.attendance-calendar :deep(.el-calendar-table .el-calendar-day) {
  height: 132px;
  padding: 0;
}

.calendar-cell {
  height: 100%;
  padding: 9px 10px;
  border-top: 2px solid transparent;
  box-sizing: border-box;
}

.calendar-cell.is-normal {
  border-top-color: var(--el-color-success);
}

.calendar-cell.is-abnormal {
  border-top-color: var(--el-color-danger);
}

.calendar-cell.is-rest {
  border-top-color: var(--el-color-info-light-5);
}

.calendar-cell.is-other-month {
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-lighter);
}
</style>
