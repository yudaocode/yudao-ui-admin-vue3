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
      <el-form-item label="月份" prop="month">
        <el-date-picker
          v-model="queryParams.month"
          type="month"
          value-format="YYYY-MM"
          placeholder="请选择月份"
          :clearable="false"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="员工" prop="userId">
        <UserSelectV2 v-model="queryParams.userId" class="!w-220px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 月报列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="员工" prop="userName" align="center" min-width="120" />
      <el-table-column label="部门" prop="deptName" align="center" min-width="120" />
      <el-table-column label="上班打卡" prop="clockInCount" align="center" width="110" />
      <el-table-column label="下班打卡" prop="clockOutCount" align="center" width="110" />
      <el-table-column label="正常次数" prop="normalCount" align="center" width="100" />
      <el-table-column label="迟到次数" prop="lateCount" align="center" width="100" />
      <el-table-column label="早退次数" prop="earlyCount" align="center" width="100" />
      <el-table-column
        label="缺少下班打卡天数"
        prop="missingClockOutDays"
        align="center"
        min-width="150"
      />
    </el-table>
  </ContentWrap>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import * as AttendanceApi from '@/api/oa/attendance'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'

defineOptions({ name: 'OaAttendanceMonthReport' })

const loading = ref(true) // 列表的加载中
const list = ref<AttendanceApi.OaAttendanceMonthReportVO[]>([]) // 月报列表
const queryParams = reactive({
  // TODO @AI：formatDate
  month: dayjs().format('YYYY-MM'),
  userId: undefined as number | undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询考勤月报 */
async function getList() {
  loading.value = true
  try {
    // 转换月份为后端需要的年份和月份
    const monthDate = dayjs(queryParams.month)
    list.value = await AttendanceApi.getAttendanceMonthReport({
      year: monthDate.year(),
      month: monthDate.month() + 1,
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

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
