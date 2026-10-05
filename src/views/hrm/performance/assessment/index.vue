<template>
  <doc-alert
    title="【绩效】绩效考核、绩效档案"
    url="https://doc.iocoder.cn/hrm/performance/assessment/"
  />

  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px"
      :model="queryParams"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="员工" prop="search">
        <el-input
          v-model="queryParams.search"
          class="!w-240px"
          clearable
          placeholder="请输入员工姓名或工号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-button
      v-hasPermi="['hrm:performance:archive:delete']"
      type="danger"
      plain
      :disabled="!selectedEmployeeIds.length"
      @click="handleDelete(selectedEmployeeIds)"
    >
      <Icon icon="ep:delete" class="mr-5px" /> 批量删除
    </el-button>
    <el-table
      v-loading="loading"
      class="mt-12px"
      :data="list"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="46" />
      <el-table-column label="员工姓名" prop="employeeName" min-width="130" fixed="left">
        <template #default="scope">
          <el-button link type="primary" @click="openDetail(scope.row.employeeId)">
            {{ scope.row.employeeName }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="工号" prop="jobNumber" min-width="120" show-overflow-tooltip />
      <el-table-column label="部门" prop="deptName" min-width="120" show-overflow-tooltip />
      <el-table-column label="职位" prop="postName" min-width="130" show-overflow-tooltip />
      <el-table-column label="手机号" prop="mobile" width="130" />
      <el-table-column label="员工状态" align="center" width="100">
        <template #default="scope">
          <dict-tag
            v-if="scope.row.employeeStatus != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
            :value="scope.row.employeeStatus"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="最近考核计划"
        prop="latestPlanName"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column label="最近绩效评分" align="center" prop="latestScore" width="120" />
      <el-table-column label="最近绩效等级" align="center" prop="latestResultLevel" width="120" />
      <el-table-column label="考核次数" align="center" prop="assessmentCount" width="100" />
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import * as PerformanceAssessmentApi from '@/api/hrm/performance/assessment'

defineOptions({ name: 'HrmPerformanceAssessment' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { push } = useRouter() // 路由操作
const loading = ref(false) // 加载中
const total = ref(0) // 列表总数
const list = ref<PerformanceAssessmentApi.PerformanceArchiveEmployeeVO[]>([]) // 列表数据
const selectedRows = ref<PerformanceAssessmentApi.PerformanceArchiveEmployeeVO[]>([]) // 选中的数据
const selectedEmployeeIds = computed(() => selectedRows.value.map((row) => row.employeeId)) // 选中的员工编号
const queryFormRef = ref() // 搜索表单 Ref
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  search: undefined
})

/** 查询绩效档案列表 */
async function getList() {
  loading.value = true
  try {
    const data = await PerformanceAssessmentApi.getPerformanceArchiveEmployeePage(queryParams)
    list.value = data.list
    total.value = data.total
    selectedRows.value = []
  } finally {
    loading.value = false
  }
}

/** 搜索 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置搜索 */
function resetQuery() {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 选择员工 */
function handleSelectionChange(rows: PerformanceAssessmentApi.PerformanceArchiveEmployeeVO[]) {
  selectedRows.value = rows
}

/** 打开员工绩效档案详情 */
function openDetail(employeeId: number) {
  push({ name: 'HrmPerformanceAssessmentEmployee', params: { employeeId } })
}

/** 删除员工的全部绩效档案 */
async function handleDelete(employeeIds: number[]) {
  if (!employeeIds.length) {
    return
  }
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await PerformanceAssessmentApi.deletePerformanceArchiveEmployeeRecords(employeeIds)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
