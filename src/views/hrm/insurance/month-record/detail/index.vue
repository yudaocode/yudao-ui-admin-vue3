<template>
  <ContentWrap>
    <div class="flex items-center justify-between gap-16px">
      <el-page-header :content="monthRecord.title || '月度社保详情'" @back="close" />
      <el-button
        v-if="editable"
        v-hasPermi="['hrm:insurance:month-record:update']"
        plain
        type="primary"
        @click="addEmployeeFormRef?.open(monthRecord.id!)"
      >
        <Icon icon="ep:plus" class="mr-5px" />添加参保人员
      </el-button>
    </div>
  </ContentWrap>

  <ContentWrap v-loading="recordLoading">
    <el-descriptions :column="3" border>
      <el-descriptions-item label="参保人数">
        <el-link
          :underline="false"
          type="primary"
          @click="handleStatusChange(HrmInsuranceEmployeeStatus.NORMAL)"
        >
          {{ monthRecord.insuredEmployeeCount ?? 0 }}
        </el-link>
      </el-descriptions-item>
      <el-descriptions-item label="停保人数">
        <el-link
          :underline="false"
          type="primary"
          @click="handleStatusChange(HrmInsuranceEmployeeStatus.STOPPED)"
        >
          {{ monthRecord.stoppedEmployeeCount ?? 0 }}
        </el-link>
      </el-descriptions-item>
      <el-descriptions-item label="个人社保">
        {{ formatHrmMoney(monthRecord.personalInsuranceAmount) }}
      </el-descriptions-item>
      <el-descriptions-item label="公司社保">
        {{ formatHrmMoney(monthRecord.corporateInsuranceAmount) }}
      </el-descriptions-item>
      <el-descriptions-item label="个人公积金">
        {{ formatHrmMoney(monthRecord.personalProvidentFundAmount) }}
      </el-descriptions-item>
      <el-descriptions-item label="公司公积金">
        {{ formatHrmMoney(monthRecord.corporateProvidentFundAmount) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-alert
      v-if="monthRecord.id && !editable"
      :closable="false"
      class="mt-16px"
      show-icon
      title="当前社保表已归档，仅可查询。"
      type="info"
    />
  </ContentWrap>

  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="76px"
    >
      <el-form-item label="员工姓名" prop="employeeName">
        <el-input
          v-model="queryParams.employeeName"
          clearable
          class="!w-200px"
          placeholder="请输入员工姓名"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="参保方案" prop="schemeId">
        <InsuranceSchemeSelect v-model="queryParams.schemeId" class="!w-220px" />
      </el-form-item>
      <el-form-item label="参保城市" prop="areaId">
        <AreaSelect
          v-model="queryParams.areaId"
          check-strictly
          :selectable-levels="[2, 3]"
          class="!w-180px"
          placeholder="请选择参保城市"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button
          v-if="editable"
          v-hasPermi="['hrm:insurance:month-record:update']"
          :disabled="selectedIds.length === 0"
          plain
          type="primary"
          @click="batchFormRef?.open(selectedIds)"
        >
          调整参保方案
        </el-button>
        <el-button
          v-if="editable"
          v-hasPermi="['hrm:insurance:month-record:update']"
          :disabled="stoppableSelectedIds.length === 0"
          plain
          type="danger"
          @click="handleStop(stoppableSelectedIds)"
        >
          停止参保
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      :stripe="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="editable" type="selection" width="45" />
      <el-table-column fixed="left" label="姓名" min-width="130" prop="employeeName">
        <template #default="scope">
          <el-link :underline="false" type="primary" @click="detailRef?.open(scope.row.id)">
            {{ scope.row.employeeName || '-' }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="工号" prop="jobNumber" width="110" />
      <el-table-column label="部门" min-width="120" prop="deptName" />
      <el-table-column align="center" label="入职日期" prop="entryTime" width="110">
        <template #default="scope">{{ formatHrmDate(scope.row.entryTime) }}</template>
      </el-table-column>
      <el-table-column label="手机号码" prop="mobile" width="130" />
      <el-table-column label="参保城市" min-width="160" prop="areaName" />
      <el-table-column label="参保方案" min-width="160" prop="schemeName" />
      <el-table-column align="right" label="个人社保费" width="120">
        <template #default="scope">
          {{ formatHrmMoney(scope.row.personalInsuranceAmount) }}
        </template>
      </el-table-column>
      <el-table-column align="right" label="公司社保费" width="120">
        <template #default="scope">
          {{ formatHrmMoney(scope.row.corporateInsuranceAmount) }}
        </template>
      </el-table-column>
      <el-table-column align="right" label="个人公积金费" width="130">
        <template #default="scope">
          {{ formatHrmMoney(scope.row.personalProvidentFundAmount) }}
        </template>
      </el-table-column>
      <el-table-column align="right" label="公司公积金费" width="130">
        <template #default="scope">
          {{ formatHrmMoney(scope.row.corporateProvidentFundAmount) }}
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <InsuranceEmployeeRecordForm ref="formRef" @success="refreshData" />
  <InsuranceBatchEmployeeRecordForm ref="batchFormRef" @success="refreshData" />
  <InsuranceAddEmployeeForm ref="addEmployeeFormRef" @success="refreshData" />
  <InsuranceMonthEmployeeDetail
    ref="detailRef"
    :editable="editable"
    @edit="formRef?.open($event)"
  />
</template>

<script lang="ts" setup>
import { parseId, isPositiveId } from '@/utils/id'

import type { FormInstance } from 'element-plus'
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as InsuranceMonthRecordApi from '@/api/hrm/insurance/month-record'
import * as InsuranceMonthEmployeeRecordApi from '@/api/hrm/insurance/month-record/employee'
import AreaSelect from '@/views/system/area/components/AreaSelect.vue'
import InsuranceSchemeSelect from '@/views/hrm/insurance/scheme/components/InsuranceSchemeSelect.vue'
import { HrmInsuranceEmployeeStatus, HrmInsuranceMonthStatus } from '@/views/hrm/utils/constants'
import { formatHrmDate, formatHrmMoney } from '@/views/hrm/utils/format'
import InsuranceAddEmployeeForm from './InsuranceAddEmployeeForm.vue'
import InsuranceBatchEmployeeRecordForm from './InsuranceBatchEmployeeRecordForm.vue'
import InsuranceEmployeeRecordForm from './InsuranceEmployeeRecordForm.vue'
import InsuranceMonthEmployeeDetail from './InsuranceMonthEmployeeDetail.vue'

defineOptions({ name: 'HrmInsuranceMonthRecordDetail' })

const route = useRoute() // 路由
const message = useMessage() // 消息弹窗
const { currentRoute, push } = useRouter() // 路由操作
const { delView } = useTagsViewStore() // 视图操作
const id = (parseId(route.params.id) as number) // 月度社保表编号

const recordLoading = ref(true) // 月度社保表的加载中
const loading = ref(true) // 员工月度社保列表的加载中
const monthRecord = ref<InsuranceMonthRecordApi.InsuranceMonthRecordVO>({}) // 月度社保表
const list = ref<InsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecordVO[]>([]) // 员工月度社保列表
const total = ref(0) // 员工月度社保总条数
const selectedRecords = ref<InsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecordVO[]>([]) // 选中的员工月度社保记录
const activeStatus = ref<number>(HrmInsuranceEmployeeStatus.NORMAL) // 当前参保状态
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  monthRecordId: id,
  employeeName: undefined as string | undefined,
  schemeId: undefined as number | undefined,
  areaId: undefined as number | undefined,
  status: Number(HrmInsuranceEmployeeStatus.NORMAL)
})
const queryFormRef = ref<FormInstance>() // 搜索的表单 Ref
const formRef = ref<InstanceType<typeof InsuranceEmployeeRecordForm>>() // 员工月度社保表单 Ref
const batchFormRef = ref<InstanceType<typeof InsuranceBatchEmployeeRecordForm>>() // 批量调整表单 Ref
const addEmployeeFormRef = ref<InstanceType<typeof InsuranceAddEmployeeForm>>() // 添加参保人员表单 Ref
const detailRef = ref<InstanceType<typeof InsuranceMonthEmployeeDetail>>() // 员工月度社保详情 Ref
const editable = computed(() => monthRecord.value.status === HrmInsuranceMonthStatus.UNARCHIVED) // 是否可编辑

/** 选中的员工月度社保记录编号 */
const selectedIds = computed(() =>
  selectedRecords.value.map((row) => row.id).filter((recordId): recordId is number => !!recordId)
)

/** 可停止参保的员工月度社保记录编号 */
const stoppableSelectedIds = computed(() =>
  selectedRecords.value
    .filter((row) => row.status === HrmInsuranceEmployeeStatus.NORMAL)
    .map((row) => row.id)
    .filter((recordId): recordId is number => !!recordId)
)

/** 关闭详情 */
function close() {
  delView(unref(currentRoute))
  push({ name: 'HrmInsuranceMonthRecord' })
}

/** 获得月度社保表 */
async function getMonthRecord() {
  recordLoading.value = true
  try {
    const data = await InsuranceMonthRecordApi.getInsuranceMonthRecord(id)
    if (!data) {
      message.warning('月度社保表不存在')
      close()
      return
    }
    monthRecord.value = data
  } finally {
    recordLoading.value = false
  }
}

/** 获得员工月度社保列表 */
async function getList() {
  loading.value = true
  try {
    const data =
      await InsuranceMonthEmployeeRecordApi.getInsuranceMonthEmployeeRecordPage(queryParams)
    list.value = data.list
    total.value = data.total
    selectedRecords.value = []
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  queryParams.status = activeStatus.value
  handleQuery()
}

/** 切换参保状态 */
function handleStatusChange(status: number) {
  activeStatus.value = status
  queryParams.status = status
  handleQuery()
}

/** 选择员工月度社保记录 */
function handleSelectionChange(
  rows: InsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecordVO[]
) {
  selectedRecords.value = rows
}

/** 停止员工参保 */
async function handleStop(ids: number[]) {
  if (!editable.value || ids.length === 0) {
    return
  }
  await message.confirm(`确认停止选中的 ${ids.length} 名员工参保吗？`)
  await InsuranceMonthEmployeeRecordApi.stopInsuranceMonthEmployeeRecordList({ ids })
  message.success('停止参保成功')
  await refreshData()
}

/** 刷新月度社保数据 */
async function refreshData() {
  await Promise.all([getMonthRecord(), getList()])
}

/** 初始化 */
async function init() {
  if (!isPositiveId(id)) {
    message.warning('参数错误，月度社保表不能为空！')
    close()
    return
  }
  await Promise.all([getMonthRecord(), getList()])
}

/** 初始化 */
onMounted(() => {
  init()
})
</script>
