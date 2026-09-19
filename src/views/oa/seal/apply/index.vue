<template>
  <doc-alert
    title="【行政】办公用品、用印管理"
    url="https://doc.iocoder.cn/oa/administration/supply-seal/"
  />
  <!-- 搜索工作栏 -->
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
      <el-form-item label="印章" prop="sealId">
        <OaSealSelect v-model="queryParams.sealId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="单据状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择单据状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用印类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择用印类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_SEAL_APPLY_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用印方式" prop="mode">
        <el-select
          v-model="queryParams.mode"
          placeholder="请选择用印方式"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_SEAL_USE_MODE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用印状态" prop="useStatus">
        <el-select
          v-model="queryParams.useStatus"
          placeholder="请选择用印状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_SEAL_USE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="紧急" prop="urgent">
        <el-select v-model="queryParams.urgent" placeholder="请选择" clearable class="!w-240px">
          <el-option
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="String(dict.value)"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用印时间" prop="expectedUseTime">
        <el-date-picker
          v-model="queryParams.expectedUseTime"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="申请部门" prop="deptId">
        <DeptSelect v-model="queryParams.deptId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          v-hasPermi="['oa:seal-apply:create']"
          type="primary"
          plain
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <!-- 申请列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="单据编号" min-width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">
            {{ row.no }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" width="110">
        <template #default="{ row }">
          <el-tag v-if="row.status === BpmProcessInstanceStatus.NOT_START" type="info">
            未提交
          </el-tag>
          <DictTag v-else :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="印章编号" prop="sealNo" min-width="160" />
      <el-table-column label="紧急" width="80">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.urgent" />
        </template>
      </el-table-column>
      <el-table-column label="印章" prop="sealName" min-width="160" />
      <el-table-column label="用印事由" prop="reason" min-width="180" show-overflow-tooltip />
      <el-table-column label="用印类型" width="110">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SEAL_APPLY_TYPE" :value="row.type" />
        </template>
      </el-table-column>
      <el-table-column label="用印方式" width="110">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SEAL_USE_MODE" :value="row.mode" />
        </template>
      </el-table-column>
      <el-table-column label="用印状态" width="110">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SEAL_USE_STATUS" :value="row.useStatus" />
        </template>
      </el-table-column>
      <el-table-column
        label="预计用印时间"
        prop="expectedUseTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column
        label="预计归还时间"
        prop="expectedReturnTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="保管人" prop="keeperName" width="120" />
      <el-table-column label="申请人" prop="userName" width="120" />
      <el-table-column label="申请部门" prop="deptName" width="150" />
      <el-table-column label="创建时间" prop="createTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" fixed="right" width="220">
        <template #default="{ row }">
          <el-button
            v-if="row.processInstanceId"
            v-hasPermi="['oa:seal-apply:query']"
            link
            type="primary"
            @click="handleProcessDetail(row)"
          >
            进度
          </el-button>
          <template v-if="row.status === BpmProcessInstanceStatus.NOT_START">
            <el-button
              v-hasPermi="['oa:seal-apply:update']"
              link
              type="primary"
              @click="openForm('update', row.id)"
            >
              修改
            </el-button>
            <el-button
              v-hasPermi="['oa:seal-apply:create']"
              link
              type="primary"
              @click="handleSubmit(row.id)"
            >
              提交
            </el-button>
            <el-button
              v-hasPermi="['oa:seal-apply:delete']"
              link
              type="danger"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
          <el-button
            v-if="row.status === BpmProcessInstanceStatus.RUNNING"
            v-hasPermi="['oa:seal-apply:update']"
            link
            type="danger"
            @click="handleCancel(row.id)"
          >
            撤销
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
  <!-- 添加或修改用印申请弹窗 -->
  <OaSealApplyForm ref="formRef" @success="getList" />
  <!-- 用印申请详情弹窗 -->
  <OaSealApplyDetail ref="detailRef" />
</template>

<script setup lang="ts">
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import OaSealSelect from '../components/OaSealSelect.vue'
import * as SealApplyApi from '@/api/oa/seal/apply'
import { DICT_TYPE, getBoolDictOptions, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import OaSealApplyForm from './OaSealApplyForm.vue'
import OaSealApplyDetail from './OaSealApplyDetail.vue'

defineOptions({ name: 'OaSealApply' })

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由

const loading = ref(false) // 列表的加载中
const list = ref<SealApplyApi.SealApplyVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总条数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  no: undefined,
  sealId: undefined,
  deptId: undefined,
  createTime: [],
  expectedUseTime: [],
  status: undefined,
  type: undefined,
  mode: undefined,
  useStatus: undefined,
  urgent: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 添加、修改表单 Ref
const detailRef = ref() // 详情 Ref

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await SealApplyApi.getSealApplyPage(queryParams)
    list.value = data.list
    total.value = data.total
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
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
function openForm(type: string, id?: number) {
  formRef.value.open(type, id)
}

/** 查看详情操作 */
function openDetail(id: number) {
  detailRef.value.open(id)
}

/** 查看审批进度操作 */
function handleProcessDetail(row: SealApplyApi.SealApplyVO) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.processInstanceId }
  })
}

/** 提交按钮操作 */
async function handleSubmit(id: number) {
  try {
    // 提交的二次确认
    await message.confirm('确认提交用印申请？')
    // 发起提交
    await SealApplyApi.submitSealApply(id)
    message.success('提交成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 撤销按钮操作 */
async function handleCancel(id: number) {
  try {
    // 撤销的二次确认
    await message.confirm('确认撤销用印申请？')
    // 发起撤销
    await SealApplyApi.cancelSealApply(id)
    message.success('撤销成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.confirm('确认删除用印申请？')
    // 发起删除
    await SealApplyApi.deleteSealApply(id)
    message.success('删除成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
