<!-- MES 生产报工列表 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="报工单号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入报工单号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="报工类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择报工类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_FEEDBACK_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- TODO @AI：select；增加一个 workOrder 的 select 组件 -->
      <el-form-item label="生产工单" prop="workOrderId">
        <el-select
          v-model="queryParams.workOrderId"
          filterable
          remote
          reserve-keyword
          :remote-method="searchWorkOrder"
          placeholder="请搜索工单编码"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="item in workOrderOptions"
            :key="item.id"
            :label="item.code"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <!-- TODO @AI：产品物料 select -->
      <!-- TODO @AI：报工人 select -->
      <!-- TODO @AI：记录人 select -->
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_FEEDBACK_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="报工时间" prop="feedbackTime">
        <el-date-picker
          v-model="queryParams.feedbackTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:pro-feedback:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:pro-feedback:export']"
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
      :stripe="true"
      :show-overflow-tooltip="true"
      row-key="id"
    >
      <el-table-column label="报工单号" align="center" prop="code" width="160" />
      <el-table-column label="报工类型" align="center" prop="type" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_FEEDBACK_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="工作站" align="center" prop="workstationName" width="120" />
      <el-table-column label="工序" align="center" prop="processName" width="100" />
      <el-table-column label="生产工单编码" align="center" prop="workOrderCode" width="160" />
      <el-table-column label="产品物料编码" align="center" prop="itemCode" width="120" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" width="120" />
      <el-table-column label="规格型号" align="center" prop="itemSpec" width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="报工数量" align="center" prop="feedbackQuantity" width="100" />
      <el-table-column label="报工人" align="center" prop="feedbackUserNickname" width="100" />
      <el-table-column
        label="报工时间"
        align="center"
        prop="feedbackTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="审核人" align="center" prop="approveUserNickname" width="100" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_FEEDBACK_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿状态：编辑、提交、删除 -->
          <template v-if="scope.row.status === MesProFeedbackStatusEnum.PREPARE">
            <el-button
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['mes:pro-feedback:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="success"
              @click="handleSubmit(scope.row.id)"
              v-hasPermi="['mes:pro-feedback:update']"
            >
              提交
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['mes:pro-feedback:delete']"
            >
              删除
            </el-button>
          </template>
          <!-- 审批中状态：驳回、执行、取消 -->
          <template v-if="scope.row.status === MesProFeedbackStatusEnum.APPROVING">
            <el-button
              link
              type="warning"
              @click="handleReject(scope.row.id)"
              v-hasPermi="['mes:pro-feedback:update']"
            >
              驳回
            </el-button>
            <el-button
              link
              type="success"
              @click="handleExecute(scope.row.id)"
              v-hasPermi="['mes:pro-feedback:update']"
            >
              执行
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleCancel(scope.row.id)"
              v-hasPermi="['mes:pro-feedback:update']"
              >取消</el-button
            >
          </template>
          <!-- 所有状态：详情 -->
          <el-button
            link
            type="primary"
            @click="openForm('detail', scope.row.id)"
            v-hasPermi="['mes:pro-feedback:query']"
            >详情</el-button
          >
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

  <!-- 表单弹窗：添加/修改 -->
  <FeedbackForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { ProFeedbackApi, ProFeedbackVO } from '@/api/mes/pro/feedback'
import { ProWorkOrderApi } from '@/api/mes/pro/workorder'
import FeedbackForm from './FeedbackForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { MesProFeedbackStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesProFeedback' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<ProFeedbackVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  type: undefined,
  workOrderId: undefined,
  status: undefined,
  feedbackTime: undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

/** 工单远程搜索选项 */
const workOrderOptions = ref<any[]>([])
const searchWorkOrder = async (query: string) => {
  if (!query) return
  const data = await ProWorkOrderApi.getWorkOrderPage({ pageNo: 1, pageSize: 20, code: query })
  workOrderOptions.value = data.list
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProFeedbackApi.getFeedbackPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProFeedbackApi.deleteFeedback(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const handleSubmit = async (id: number) => {
  try {
    await message.confirm('确认要提交该报工单吗？')
    await ProFeedbackApi.submitFeedback(id)
    message.success('报工单已提交')
    await getList()
  } catch {}
}

const handleReject = async (id: number) => {
  try {
    await message.confirm('确认要驳回该报工单吗？')
    await ProFeedbackApi.rejectFeedback(id)
    message.success('报工单已驳回')
    await getList()
  } catch {}
}

const handleExecute = async (id: number) => {
  try {
    await message.confirm('确认要执行该报工单吗？')
    await ProFeedbackApi.executeFeedback(id)
    message.success('报工单已执行')
    await getList()
  } catch {}
}

const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认要取消该报工单吗？')
    await ProFeedbackApi.cancelFeedback(id)
    message.success('报工单已取消')
    await getList()
  } catch {}
}

const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ProFeedbackApi.exportFeedback(queryParams)
    download.excel(data, '生产报工.xls')
  } finally {
    exportLoading.value = false
  }
}

onMounted(async () => {
  await getList()
})
</script>
