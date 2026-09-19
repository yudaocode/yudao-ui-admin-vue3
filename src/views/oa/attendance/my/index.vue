<template>
  <!-- 今日打卡 -->
  <ContentWrap>
    <div class="flex flex-wrap items-center justify-between gap-16px">
      <div>
        <div class="text-18px font-600">今日考勤</div>
        <div class="mt-8px text-14px text-[var(--el-text-color-secondary)]">
          上班：{{ getClockText(OA_ATTENDANCE_TYPE.CLOCK_IN) }}　 下班：{{
            getClockText(OA_ATTENDANCE_TYPE.CLOCK_OUT)
          }}
        </div>
      </div>
      <el-button type="primary" :loading="clockLoading" @click="handleClock">
        {{ clockButtonText }}
      </el-button>
    </div>
  </ContentWrap>

  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="考勤类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择考勤类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_ATTENDANCE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="考勤状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择考勤状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_ATTENDANCE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="考勤时间" prop="attendanceTime">
        <el-date-picker
          v-model="queryParams.attendanceTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="datetimerange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 我的考勤记录 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="考勤类型" align="center" width="110">
        <template #default="scope">
          <DictTag :type="DICT_TYPE.OA_ATTENDANCE_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="考勤状态" align="center" width="100">
        <template #default="scope">
          <DictTag :type="DICT_TYPE.OA_ATTENDANCE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="考勤时间"
        prop="attendanceTime"
        :formatter="dateFormatter"
        align="center"
        width="180"
      />
      <el-table-column label="考勤 IP" prop="attendanceIp" align="center" min-width="130" />
      <el-table-column
        label="备注"
        prop="remark"
        align="center"
        min-width="180"
        show-overflow-tooltip
      />
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import { OA_ATTENDANCE_TYPE } from '@/views/oa/utils/constants'
import * as AttendanceApi from '@/api/oa/attendance'

defineOptions({ name: 'OaAttendanceMy' })

const message = useMessage() // 消息弹窗

const clockLoading = ref(false) // 打卡的加载中
const todayAttendanceList = ref<AttendanceApi.OaAttendanceVO[]>([]) // 今日考勤记录
const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<AttendanceApi.OaAttendanceVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: undefined as number | undefined,
  status: undefined as number | undefined,
  attendanceTime: [] as string[]
})
const queryFormRef = ref() // 搜索的表单

/** 获得打卡按钮文案 */
const clockButtonText = computed(() => {
  if (!todayAttendanceList.value.some((item) => item.type === OA_ATTENDANCE_TYPE.CLOCK_IN)) {
    return '上班打卡'
  }
  return todayAttendanceList.value.some((item) => item.type === OA_ATTENDANCE_TYPE.CLOCK_OUT)
    ? '更新下班打卡'
    : '下班打卡'
})

/** 查询今日考勤 */
const getTodayAttendanceList = async () => {
  todayAttendanceList.value = await AttendanceApi.getMyTodayAttendanceList()
}

/** 查询我的考勤列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await AttendanceApi.getMyAttendancePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 执行打卡 */
const handleClock = async () => {
  clockLoading.value = true
  try {
    // 发起打卡
    await AttendanceApi.clockAttendance()
    message.success('打卡成功')
    // 刷新今日考勤和考勤记录
    await Promise.all([getTodayAttendanceList(), getList()])
  } finally {
    clockLoading.value = false
  }
}

/** 获得指定类型的今日打卡文案 */
const getClockText = (type: number) => {
  const attendance = todayAttendanceList.value.find((item) => item.type === type)
  if (!attendance) {
    return '未打卡'
  }
  return `${formatDate(attendance.attendanceTime, 'HH:mm:ss')}（${getDictLabel(DICT_TYPE.OA_ATTENDANCE_STATUS, attendance.status)}）`
}

/** 初始化 */
onMounted(() => {
  getTodayAttendanceList()
  getList()
})
</script>
