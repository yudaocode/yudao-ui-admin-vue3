<template>
  <doc-alert
    title="【绩效】绩效考核、绩效档案"
    url="https://doc.iocoder.cn/hrm/performance/assessment/"
  />

  <ContentWrap>
    <div class="mb-16px flex items-center justify-between">
      <div class="flex items-center gap-12px">
        <el-button link title="返回" @click="close">
          <Icon icon="ep:arrow-left" />
        </el-button>
        <el-avatar :size="44">{{ employee.employeeName?.slice(0, 1) }}</el-avatar>
        <div class="text-20px font-600">{{ employee.employeeName || '-' }}的绩效档案</div>
      </div>
      <el-button
        v-hasPermi="['hrm:performance:archive:delete']"
        type="danger"
        plain
        :disabled="!selectedIds.length"
        @click="handleDelete(selectedIds)"
      >
        <Icon icon="ep:delete" class="mr-5px" /> 批量删除
      </el-button>
    </div>
    <el-descriptions :column="4" border class="mb-16px">
      <el-descriptions-item label="部门">{{ employee.deptName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="职位">{{ employee.postName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="工号">{{ employee.jobNumber || '-' }}</el-descriptions-item>
      <el-descriptions-item label="聘用形式">
        <dict-tag
          v-if="employee.employeeType != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
          :value="employee.employeeType"
        />
        <span v-else>-</span>
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>

  <ContentWrap>
    <el-form :model="queryParams" :inline="true" label-width="68px">
      <el-form-item label="考核计划">
        <el-select
          v-model="queryParams.planId"
          class="!w-260px"
          clearable
          filterable
          placeholder="请选择考核计划"
          @change="handleQuery"
        >
          <el-option v-for="plan in planList" :key="plan.id" :label="plan.name" :value="plan.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="46" />
      <el-table-column label="考核方案名称" prop="name" min-width="180" show-overflow-tooltip>
        <template #default="scope">
          <el-button link type="primary" @click="openAssessmentDetail(scope.row.id)">
            {{ scope.row.name || '-' }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="考核周期类型" align="center" width="120">
        <template #default="scope">
          {{ formatHrmPerformanceCycleType(scope.row.cycleType) }}
        </template>
      </el-table-column>
      <el-table-column label="考核周期" prop="cycle" min-width="130" show-overflow-tooltip />
      <el-table-column label="考核状态" align="center" width="100">
        <template #default><el-tag type="info">已归档</el-tag></template>
      </el-table-column>
      <el-table-column label="评分" align="center" prop="score" width="90" />
      <el-table-column label="考核结果" align="center" prop="resultLevel" width="100" />
      <el-table-column label="操作" align="center" width="110" fixed="right">
        <template #default="scope">
          <el-button
            v-hasPermi="['hrm:performance:archive:delete']"
            link
            type="danger"
            @click="handleDelete([scope.row.id])"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
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
import { useTagsViewStore } from '@/store/modules/tagsView'
import { DICT_TYPE } from '@/utils/dict'
import * as PerformanceAssessmentApi from '@/api/hrm/performance/assessment'
import { formatHrmPerformanceCycleType } from '@/views/hrm/utils/format'

defineOptions({ name: 'HrmPerformanceAssessmentEmployee' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const route = useRoute() // 当前路由
const { currentRoute, push } = useRouter() // 路由操作
const { delView } = useTagsViewStore() // 页签操作
const employeeId = Number(route.params.employeeId) // 员工编号
const loading = ref(false) // 加载中
const total = ref(0) // 列表总数
const list = ref<PerformanceAssessmentApi.PerformanceAssessmentVO[]>([]) // 列表数据
const planList = ref<PerformanceAssessmentApi.PerformanceArchivePlanVO[]>([]) // 绩效计划列表
const employee = ref<PerformanceAssessmentApi.PerformanceArchiveEmployeeVO>({
  employeeId,
  employeeName: '',
  assessmentCount: 0
})
const selectedRows = ref<PerformanceAssessmentApi.PerformanceAssessmentVO[]>([]) // 选中的数据
const selectedIds = computed(() =>
  selectedRows.value.map((row) => row.id).filter((id): id is number => id !== undefined)
)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  employeeId,
  planId: undefined as number | undefined
})

/** 关闭员工绩效档案 */
function close() {
  delView(unref(currentRoute))
  push('/hrm/performance/assessment')
}

/** 查询员工考核记录 */
async function getList() {
  loading.value = true
  try {
    const data = await PerformanceAssessmentApi.getPerformanceAssessmentArchivePage(queryParams)
    list.value = data.list
    total.value = data.total
    const assessment = data.list[0]
    if (assessment) {
      employee.value.employeeName = assessment.employeeName || ''
      employee.value.jobNumber = assessment.jobNumber
      employee.value.deptName = assessment.deptName
      employee.value.postName = assessment.postName
      employee.value.employeeType = assessment.employeeType
      employee.value.assessmentCount = data.total
    }
    selectedRows.value = []
  } finally {
    loading.value = false
  }
}

/** 查询归档计划 */
async function getPlanList() {
  planList.value = await PerformanceAssessmentApi.getPerformanceArchivePlanSimpleList()
}

/** 搜索 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置搜索 */
function resetQuery() {
  queryParams.planId = undefined
  handleQuery()
}

/** 打开单次考核详情 */
function openAssessmentDetail(id?: number) {
  if (!id) {
    return
  }
  push({
    name: 'HrmPerformanceAssessmentDetail',
    params: { id },
    query: { employeeId, archived: 'true' }
  })
}

/** 选择考核记录 */
function handleSelectionChange(rows: PerformanceAssessmentApi.PerformanceAssessmentVO[]) {
  selectedRows.value = rows
}

/** 删除考核记录 */
async function handleDelete(ids: number[]) {
  if (!ids.length) {
    return
  }
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await PerformanceAssessmentApi.deletePerformanceArchiveRecords(ids)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
    if (!total.value) {
      close()
    }
  } catch {}
}

/** 初始化 */
onMounted(() => {
  Promise.all([getList(), getPlanList()])
})
</script>
