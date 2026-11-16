<template>
  <doc-alert title="【考勤】考勤管理" url="https://doc.iocoder.cn/hrm/attendance/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px"
      :model="queryParams"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="月份" prop="month">
        <el-date-picker
          v-model="queryParams.month"
          type="month"
          value-format="YYYY-MM"
          :clearable="false"
          class="!w-240px"
          @change="handleMonthChange"
        />
      </el-form-item>
      <el-form-item label="员工" prop="employeeKeyword">
        <el-input
          v-model="queryParams.employeeKeyword"
          placeholder="请输入员工姓名或工号"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="部门" prop="deptIds">
        <DeptSelect v-model="queryParams.deptIds" multiple class="!w-240px" />
      </el-form-item>
      <el-form-item label="请假类型" prop="types">
        <el-select
          v-model="queryParams.types"
          placeholder="请选择请假类型"
          clearable
          multiple
          collapse-tags
          class="!w-240px"
        >
          <el-option
            v-for="item in getStrDictOptions(DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="审批状态" prop="approvalStatus">
        <el-select
          v-model="queryParams.approvalStatus"
          placeholder="请选择审批状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="item in getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          v-hasPermi="['hrm:attendance:leave:export']"
          plain
          :loading="exportLoading"
          @click="handleExport"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      stripe
      @sort-change="handleSortChange"
    >
      <el-table-column label="姓名" align="center" prop="employeeName" min-width="110" />
      <el-table-column label="工号" align="center" prop="jobNumber" min-width="110" />
      <el-table-column label="部门" align="center" prop="deptName" min-width="120" />
      <el-table-column label="岗位" align="center" prop="postName" min-width="120" />
      <el-table-column label="请假类型" align="center" width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column
        label="请假开始时间"
        align="center"
        prop="startTime"
        width="170"
        sortable="custom"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="请假结束时间"
        align="center"
        prop="endTime"
        width="170"
        sortable="custom"
        :formatter="dateFormatter"
      />
      <el-table-column label="请假天数" align="center" prop="day" width="100" sortable="custom">
        <template #default="scope">{{ scope.row.day || 0 }} 天</template>
      </el-table-column>
      <el-table-column label="请假事由" align="center" prop="reason" min-width="160" />
      <el-table-column label="备注" align="center" prop="remark" min-width="140" />
      <el-table-column label="审批状态" align="center" width="110">
        <template #default="scope">
          <dict-tag
            :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
            :value="scope.row.approvalStatus"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.processInstanceId"
            link
            type="primary"
            @click="openProcessDetail(scope.row.processInstanceId)"
          >
            审批进度
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { dateFormatter, formatDate, getMonthRange } from '@/utils/formatTime'
import download from '@/utils/download'
import { buildSortingField } from '@/utils'
import * as AttendanceLeaveApi from '@/api/hrm/attendance/leave'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'

/** 请假记录 */
defineOptions({ name: 'HrmAttendanceLeave' })

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由
const loading = ref(true) // 列表的加载中
const exportLoading = ref(false) // 导出的加载中
const total = ref(0) // 列表的总页数
const list = ref<AttendanceLeaveApi.HrmAttendanceLeaveVO[]>([]) // 列表的数据
const queryFormRef = ref<FormInstance>() // 搜索的表单
const currentMonth = formatDate(new Date(), 'YYYY-MM') // 当前月份
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  month: currentMonth,
  startTime: getMonthRange(currentMonth),
  employeeKeyword: '',
  deptIds: [] as number[],
  types: [] as string[],
  approvalStatus: undefined as number | undefined,
  sortingFields: [] as ReturnType<typeof buildSortingField>[]
})

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await AttendanceLeaveApi.getAttendanceLeavePage(getQueryParams())
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 获得请求参数 */
function getQueryParams() {
  const { month: _, ...params } = queryParams
  return params
}

/** 月份变化 */
function handleMonthChange() {
  queryParams.startTime = getMonthRange(queryParams.month)
  handleQuery()
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  queryParams.startTime = getMonthRange(queryParams.month)
  handleQuery()
}

/** 表格排序操作 */
function handleSortChange(params: { prop: string | null; order: string | null }) {
  queryParams.sortingFields = params.order ? [buildSortingField(params)] : []
  handleQuery()
}

/** 导出按钮操作 */
async function handleExport() {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await AttendanceLeaveApi.exportAttendanceLeave(getQueryParams())
    download.excel(data, '请假记录.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 打开审批进度 */
function openProcessDetail(processInstanceId?: string) {
  if (!processInstanceId) {
    return
  }
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: {
      id: processInstanceId
    }
  })
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
