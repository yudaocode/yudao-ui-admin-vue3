<template>
  <doc-alert title="【流程】出差、费用报销" url="https://doc.iocoder.cn/oa/travel-reimbursement/" />
  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="68px"
      class="-mb-15px"
    >
      <el-form-item label="单据编号" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="请输入单据编号"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="单据状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择单据状态"
          clearable
          class="!w-240px"
        >
          <el-option label="未提交" :value="-1" />
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS).filter(
              (item) => item.value !== -1
            )"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="申请部门" prop="deptId">
        <DeptSelect v-model="queryParams.deptId" placeholder="请选择申请部门" class="!w-240px" />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="报销状态" prop="reimburseStatus">
        <el-select
          v-model="queryParams.reimburseStatus"
          placeholder="请选择报销状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getBoolDictOptions(DICT_TYPE.OA_REIMBURSE_STATUS)"
            :key="String(dict.value)"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          v-hasPermi="['oa:travel-apply:save']"
          type="primary"
          plain
          @click="formRef.open('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="单据编号" min-width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">{{ row.no }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.status === -1" type="info">未提交</el-tag>
          <DictTag v-else :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="row.status" />
        </template>
      </el-table-column>

      <el-table-column
        label="出差事由"
        prop="reason"
        min-width="220"
        header-align="center"
        show-overflow-tooltip
      />
      <el-table-column label="开始日期" width="180" header-align="center">
        <template #default="{ row }">{{ formatDate(row.startTime) }}</template>
      </el-table-column>
      <el-table-column label="结束日期" width="180" header-align="center">
        <template #default="{ row }">{{ formatDate(row.endTime) }}</template>
      </el-table-column>
      <el-table-column label="天数" prop="days" width="80" align="center" />
      <el-table-column
        label="预计费用"
        prop="estimatedPrice"
        width="130"
        align="right"
        header-align="center"
      />
      <el-table-column label="报销状态" width="110" align="center">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_REIMBURSE_STATUS" :value="row.reimburseStatus" />
        </template>
      </el-table-column>
      <el-table-column label="申请人" prop="creatorName" width="120" header-align="center" />
      <el-table-column label="申请部门" prop="deptName" min-width="140" header-align="center" />
      <el-table-column
        label="创建时间"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
        header-align="center"
      />
      <el-table-column label="操作" fixed="right" width="260" align="center">
        <template #default="{ row }">
          <el-button
            v-if="isEditable(row)"
            v-hasPermi="['oa:travel-apply:save']"
            link
            type="primary"
            @click="openUpdate(row.id)"
          >
            修改
          </el-button>
          <el-button
            v-if="isEditable(row)"
            v-hasPermi="['oa:travel-apply:save']"
            link
            type="primary"
            @click="handleSubmit(row.id)"
          >
            提交
          </el-button>
          <el-button
            v-if="isEditable(row)"
            v-hasPermi="['oa:travel-apply:delete']"
            link
            type="danger"
            @click="handleDelete(row.id)"
          >
            删除
          </el-button>
          <el-button
            v-if="row.status === BpmProcessInstanceStatus.RUNNING"
            v-hasPermi="['oa:travel-apply:save']"
            link
            type="primary"
            @click="handleCancel(row.id)"
          >
            撤回
          </el-button>
          <el-button v-if="row.processInstanceId" link type="primary" @click="openProcess(row)">
            审批进度
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单及详情 -->
  <OaTravelApplyForm ref="formRef" @success="getList" />
  <OaTravelApplyDetail ref="detailRef" />
</template>

<script setup lang="ts">
import OaTravelApplyForm from './OaTravelApplyForm.vue'
import OaTravelApplyDetail from './OaTravelApplyDetail.vue'
import * as TravelApi from '@/api/oa/travel/apply'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import { DICT_TYPE, getBoolDictOptions, getIntDictOptions } from '@/utils/dict'
import { formatDate, dateFormatter } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'

defineOptions({ name: 'OaTravelApply' })

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由
const loading = ref(false) // 列表加载中
const list = ref<TravelApi.TravelApplyVO[]>([]) // 列表数据
const total = ref(0) // 总条数
const formRef = ref() // 新增、修改表单
const detailRef = ref() // 详情 Ref
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  no: undefined,
  status: undefined,
  deptId: undefined,
  createTime: [],
  reimburseStatus: undefined
}) // 查询参数
const queryFormRef = ref() // 搜索表单

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await TravelApi.getTravelApplyPage(queryParams)
    list.value = data.list
    total.value = data.total
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

/** 打开详情 */
function openDetail(id: number) {
  detailRef.value.open(id)
}

/** 修改当前单据 */
function openUpdate(id: number) {
  formRef.value.open('update', id)
}

/** 判断单据是否允许修改、提交及删除 */
function isEditable(row: TravelApi.TravelApplyVO) {
  return [
    BpmProcessInstanceStatus.NOT_START,
    BpmProcessInstanceStatus.REJECT,
    BpmProcessInstanceStatus.CANCEL
  ].includes(row.status!)
}

/** 删除单据 */
async function handleDelete(id: number) {
  try {
    await message.delConfirm()
    await TravelApi.deleteTravelApply(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 提交按钮操作 */
async function handleSubmit(id: number) {
  try {
    // 提交的二次确认
    await message.confirm('确认提交出差申请？')
    // 发起提交
    await TravelApi.submitTravelApply(id)
    message.success('提交成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 撤回按钮操作 */
async function handleCancel(id: number) {
  try {
    // 撤回的二次确认
    await message.confirm('确认撤回当前单据？')
    // 发起撤回
    await TravelApi.cancelTravelApply(id)
    message.success('撤回成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 查看审批进度 */
function openProcess(row: TravelApi.TravelApplyVO) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.processInstanceId }
  })
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
