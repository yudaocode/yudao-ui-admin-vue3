<template>
  <doc-alert title="【考勤】考勤管理" url="https://doc.iocoder.cn/hrm/attendance/" />

  <div v-if="accessible">
    <ContentWrap title="考勤报表">
      <div class="mb-16px flex items-center gap-12px">
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          format="YYYY年MM月"
          :clearable="false"
          :disabled-date="disabledFutureDate"
          @change="handleMonthChange"
        />
        <span class="text-14px text-[var(--el-text-color-regular)]">
          考勤周期（{{ attendanceCycle }}）
        </span>
        <el-button
          v-hasPermi="['hrm:portal:attendance:leave']"
          type="primary"
          @click="openLeaveForm"
        >
          <Icon icon="ep:plus" class="mr-5px" />请假申请
        </el-button>
        <el-button type="primary" plain :loading="exportLoading" @click="handleExport">
          <Icon icon="ep:download" class="mr-5px" />导出考勤
        </el-button>
      </div>

      <div
        class="mb-16px grid grid-cols-5 border border-[var(--el-border-color-lighter)] border-solid rounded-4px"
      >
        <div
          v-for="(item, index) in summaryItems"
          :key="item.label"
          class="min-h-80px px-18px py-14px"
          :class="
            index < summaryItems.length - 1
              ? 'border-r border-[var(--el-border-color-lighter)] border-r-solid'
              : ''
          "
        >
          <span class="mb-6px block text-13px text-[var(--el-text-color-secondary)]">
            {{ item.label }}
          </span>
          <strong class="text-24px text-[var(--el-text-color-primary)] font-500">
            {{ item.value }}
          </strong>
          <small class="ml-4px text-[var(--el-text-color-secondary)]">{{ item.unit }}</small>
        </div>
      </div>

      <AttendanceCalendar
        :selected-month="selectedMonth"
        :calendar-date="calendarDate"
        :loading="loading"
        :daily-details="monthDetail?.dailyDetails"
      />
      <AttendanceLeaveList ref="leaveListRef" @changed="loadData" />
    </ContentWrap>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import download from '@/utils/download'
import { formatDate } from '@/utils/formatTime'
import * as AttendanceStatisticsApi from '@/api/hrm/portal/attendance/statistics'
import { checkHrmPortalAccess } from '@/views/hrm/utils/employee'
import { formatHrmDays } from '@/views/hrm/utils/format'
import AttendanceCalendar from './AttendanceCalendar.vue'
import AttendanceLeaveList from './AttendanceLeaveList.vue'

defineOptions({ name: 'HrmPortalAttendanceReport' })

const router = useRouter() // 路由
const route = useRoute() // 当前路由
const accessible = ref(false) // 是否可访问
const loading = ref(false) // 加载中
const exportLoading = ref(false) // 导出加载中
const selectedMonth = ref(
  dayjs(String(route.query.month || '')).isValid()
    ? dayjs(String(route.query.month)).startOf('month').toDate()
    : new Date()
)
const calendarDate = ref(selectedMonth.value) // 日历日期
const monthDetail = ref<AttendanceStatisticsApi.AttendanceMonthDetailVO>() // 月度考勤详情
const leaveListRef = ref<InstanceType<typeof AttendanceLeaveList>>() // 请假列表 Ref
const attendanceCycle = computed(() => {
  const month = dayjs(selectedMonth.value)
  return `${formatDate(month, 'MM')}月01日~${formatDate(month, 'MM')}月${formatDate(
    month.endOf('month'),
    'DD'
  )}日`
})
const summaryItems = computed(() => [
  {
    label: '应出勤天数',
    value: monthDetail.value?.summary?.attendDays ?? 0,
    unit: '天'
  },
  {
    label: '实际出勤天数',
    value: formatHrmDays(monthDetail.value?.summary?.actualDays),
    unit: '天'
  },
  { label: '迟到', value: monthDetail.value?.summary?.lateCount ?? 0, unit: '次' },
  { label: '早退', value: monthDetail.value?.summary?.earlyCount ?? 0, unit: '次' },
  { label: '缺卡', value: monthDetail.value?.summary?.misscardCount ?? 0, unit: '次' }
])

/** 禁用未来日期 */
function disabledFutureDate(date: Date) {
  return dayjs(date).startOf('month').isAfter(dayjs().startOf('month'))
}

/** 获得月度考勤详情 */
async function loadData() {
  loading.value = true
  try {
    const month = dayjs(selectedMonth.value)
    monthDetail.value = await AttendanceStatisticsApi.getAttendanceMonthDetail(
      month.year(),
      month.month() + 1
    )
  } finally {
    loading.value = false
  }
}

/** 月份切换操作 */
function handleMonthChange(value: Date) {
  calendarDate.value = dayjs(value).startOf('month').toDate()
  loadData()
}

/** 打开请假表单 */
function openLeaveForm() {
  leaveListRef.value?.openCreate()
}

/** 导出操作 */
async function handleExport() {
  const month = dayjs(selectedMonth.value)
  try {
    exportLoading.value = true
    // 发起导出
    const data = await AttendanceStatisticsApi.exportAttendanceMonthDetail(
      month.year(),
      month.month() + 1
    )
    download.excel(data, `${formatDate(month, 'YYYY年MM月')}个人考勤日报.xls`)
  } finally {
    exportLoading.value = false
  }
}

/** 页面激活时刷新考勤报告 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router)
  if (!accessible.value) {
    return
  }
  await Promise.all([loadData(), leaveListRef.value?.refresh()])
})
</script>
