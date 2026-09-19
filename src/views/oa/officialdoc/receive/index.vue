<template>
  <doc-alert title="【流程】公文管理" url="https://doc.iocoder.cn/oa/official-doc/" />
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="80px"
      class="-mb-15px"
    >
      <el-form-item label="公文标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入公文标题"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="来文字号" prop="documentNo">
        <el-input
          v-model="queryParams.documentNo"
          placeholder="请输入来文字号"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="流程状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择流程状态"
          clearable
          class="!w-240px"
        >
          <el-option label="未提交" :value="BpmProcessInstanceStatus.NOT_START" />
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          v-hasPermi="['oa:officialdoc-receive:create']"
          type="primary"
          plain
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 公文收文列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="单据编号" min-width="190">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">{{ row.no }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="公文标题" prop="title" min-width="190" show-overflow-tooltip />
      <el-table-column label="来文字号" prop="documentNo" min-width="190" />
      <el-table-column label="密级" min-width="120">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_OFFICIAL_DOC_SECRET_LEVEL" :value="row.secrecyLevel" />
        </template>
      </el-table-column>
      <el-table-column label="紧急程度" min-width="120">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_OFFICIAL_DOC_URGENCY_LEVEL" :value="row.urgencyLevel" />
        </template>
      </el-table-column>
      <el-table-column label="收文类型" min-width="120">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_OFFICIAL_DOC_RECEIVE_TYPE" :value="row.receiveType" />
        </template>
      </el-table-column>
      <el-table-column label="收文部门" prop="receiveDeptName" min-width="120" />
      <el-table-column label="主办人" prop="handlerName" min-width="120" />
      <el-table-column label="办理状态" min-width="120">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_OFFICIAL_DOC_HANDLE_STATUS" :value="row.handleStatus" />
        </template>
      </el-table-column>
      <el-table-column label="流程状态" min-width="120">
        <template #default="{ row }">
          <el-tag v-if="row.status === BpmProcessInstanceStatus.NOT_START" type="info">
            未提交
          </el-tag>
          <DictTag v-else :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        prop="createTime"
        min-width="190"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" fixed="right" width="180">
        <template #default="{ row }">
          <el-button
            v-if="row.processInstanceId"
            v-hasPermi="['oa:officialdoc-receive:query']"
            link
            type="primary"
            @click="handleProcessDetail(row)"
          >
            审批进度
          </el-button>
          <el-button
            v-if="
              row.status === BpmProcessInstanceStatus.NOT_START &&
              row.receiveType === 0 &&
              row.creator === String(userStore.getUser.id)
            "
            v-hasPermi="['oa:officialdoc-receive:update']"
            link
            type="primary"
            @click="handleSubmit(row.id)"
          >
            提交
          </el-button>
          <el-button
            v-if="
              row.sendId &&
              !row.creator &&
              row.handleStatus === OaOfficialDocHandleStatus.WAIT_CLAIM
            "
            v-hasPermi="['oa:officialdoc-receive:update']"
            link
            type="primary"
            @click="handleClaim(row.id)"
          >
            签收
          </el-button>
          <el-button
            v-if="
              row.sendId && row.creator && row.handleStatus !== OaOfficialDocHandleStatus.WAIT_CLAIM
            "
            link
            disabled
          >
            已签收
          </el-button>
          <el-button
            v-if="
              row.status === BpmProcessInstanceStatus.NOT_START &&
              row.receiveType === 0 &&
              row.creator === String(userStore.getUser.id)
            "
            v-hasPermi="['oa:officialdoc-receive:update']"
            link
            type="primary"
            @click="openForm('update', row.id)"
          >
            修改
          </el-button>
          <el-button
            v-if="
              row.status === BpmProcessInstanceStatus.RUNNING &&
              row.creator === String(userStore.getUser.id)
            "
            v-hasPermi="['oa:officialdoc-receive:update']"
            link
            type="primary"
            @click="handleCancel(row.id)"
          >
            撤销
          </el-button>
          <el-button
            v-if="
              [
                BpmProcessInstanceStatus.NOT_START,
                BpmProcessInstanceStatus.REJECT,
                BpmProcessInstanceStatus.CANCEL
              ].includes(row.status) && row.creator === String(userStore.getUser.id)
            "
            v-hasPermi="['oa:officialdoc-receive:delete']"
            link
            type="danger"
            @click="handleDelete(row.id)"
          >
            删除
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

  <!-- 表单弹窗 -->
  <OaOfficialDocReceiveForm ref="formRef" @success="getList" />
  <!-- 详情弹窗 -->
  <OaOfficialDocReceiveDetail ref="detailRef" />
</template>
<script setup lang="ts">
import * as ReceiveApi from '@/api/oa/officialdoc/receive'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import { useUserStore } from '@/store/modules/user'
import { OaOfficialDocHandleStatus } from '@/views/oa/utils/constants'
import OaOfficialDocReceiveForm from './OaOfficialDocReceiveForm.vue'
import OaOfficialDocReceiveDetail from './OaOfficialDocReceiveDetail.vue'

defineOptions({ name: 'OaOfficialDocReceive' })

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由
const { t } = useI18n() // 国际化
const userStore = useUserStore() // 当前用户

const loading = ref(true) // 列表加载中
const list = ref<ReceiveApi.OfficialDocReceiveVO[]>([]) // 列表数据
const total = ref(0) // 列表总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: undefined as string | undefined,
  documentNo: undefined as string | undefined,
  status: undefined as number | undefined
})
const queryFormRef = ref() // 搜索表单

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await ReceiveApi.getReceivePage(queryParams)
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
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 修改操作 */
const formRef = ref() // 表单 Ref
function openForm(type: string, id?: number) {
  formRef.value.open(type, id)
}

/** 提交审批 */
async function handleSubmit(id: number) {
  try {
    await message.confirm('确认提交当前公文？')
    await ReceiveApi.submitReceive(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ReceiveApi.deleteReceive(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 查看详情 */
const detailRef = ref() // 详情 Ref
function openDetail(id: number) {
  detailRef.value.open(id)
}

/** 查看审批进度 */
function handleProcessDetail(row: ReceiveApi.OfficialDocReceiveVO) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.processInstanceId }
  })
}

/** 撤销审批 */
async function handleCancel(id: number) {
  try {
    // 撤销的二次确认
    await message.confirm('确认撤销审批吗？')
    // 发起撤销
    await ReceiveApi.cancelReceive(id)
    message.success('撤销成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 签收公文 */
async function handleClaim(id: number) {
  await ReceiveApi.claimReceive(id)
  message.success('签收成功')
  await getList()
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
