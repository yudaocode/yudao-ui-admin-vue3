<template>
  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="所在周" prop="startDate">
        <el-date-picker
          v-model="queryParams.startDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择周内任意日期"
          :clearable="false"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="员工" prop="userId">
        <UserSelectV2 v-model="queryParams.userId" class="!w-220px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handlePreviousWeek">上一周</el-button>
        <el-button @click="handleCurrentWeek">本周</el-button>
        <el-button @click="handleNextWeek">下一周</el-button>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 周报列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="员工" prop="userName" align="center" fixed="left" width="120" />
      <el-table-column label="部门" prop="deptName" align="center" fixed="left" width="120" />
      <el-table-column
        v-for="(day, index) in weekDays"
        :key="day.date"
        :label="`${day.label} ${day.date.slice(5)}`"
        align="center"
        min-width="150"
      >
        <template #default="scope">
          <div class="leading-24px">
            <div>
              上班：{{
                getClockText(scope.row.dailyAttendances[index], OA_ATTENDANCE_TYPE.CLOCK_IN)
              }}
            </div>
            <div>
              下班：{{
                getClockText(scope.row.dailyAttendances[index], OA_ATTENDANCE_TYPE.CLOCK_OUT)
              }}
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { OA_ATTENDANCE_TYPE } from '@/views/oa/utils/constants'
import * as AttendanceApi from '@/api/oa/attendance'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'

defineOptions({ name: 'OaAttendanceWeekReport' })

const loading = ref(true) // 列表的加载中
const list = ref<AttendanceApi.OaAttendanceWeekReportVO[]>([]) // 周报列表
const queryParams = reactive({
  startDate: getWeekStartDate(dayjs()),
  userId: undefined as number | undefined
})
const queryFormRef = ref() // 搜索的表单

/** 当前周的日期列 */
const weekDays = computed(() => {
  const weekDayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const weekStartDate = dayjs(getWeekStartDate(dayjs(queryParams.startDate)))
  return weekDayLabels.map((label, index) => ({
    label,
    date: weekStartDate.add(index, 'day').format('YYYY-MM-DD')
  }))
})

/** 查询考勤周报 */
async function getList() {
  loading.value = true
  try {
    list.value = await AttendanceApi.getAttendanceWeekReport({
      startDate: getWeekStartDate(dayjs(queryParams.startDate)),
      userId: queryParams.userId
    })
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  getList()
}

/** 切换到上一周 */
function handlePreviousWeek() {
  queryParams.startDate = dayjs(queryParams.startDate).subtract(7, 'day').format('YYYY-MM-DD')
  getList()
}

/** 切换到本周 */
function handleCurrentWeek() {
  queryParams.startDate = getWeekStartDate(dayjs())
  getList()
}

/** 切换到下一周 */
function handleNextWeek() {
  queryParams.startDate = dayjs(queryParams.startDate).add(7, 'day').format('YYYY-MM-DD')
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 获得日期所在周的周一 */
function getWeekStartDate(date: dayjs.Dayjs) {
  return date.subtract((date.day() + 6) % 7, 'day').format('YYYY-MM-DD')
}

/** 获得打卡展示文案 */
function getClockText(
  attendance: AttendanceApi.OaAttendanceWeekReportVO['dailyAttendances'][number] | undefined,
  attendanceType: number
) {
  const isClockIn = attendanceType === OA_ATTENDANCE_TYPE.CLOCK_IN
  const attendanceTime = isClockIn ? attendance?.clockInTime : attendance?.clockOutTime
  if (!attendanceTime) {
    return '-'
  }
  const status = isClockIn ? attendance?.clockInStatus : attendance?.clockOutStatus
  return `${dayjs(attendanceTime).format('HH:mm:ss')} ${getDictLabel(DICT_TYPE.OA_ATTENDANCE_STATUS, status)}`
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
