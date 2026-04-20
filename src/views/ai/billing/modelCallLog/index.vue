<template>
  <!-- 统计卡片 -->
  <el-row :gutter="16" class="mb-16px">
    <el-col :span="6">
      <el-card shadow="never">
        <template #header><span>总调用次数</span></template>
        <div class="text-24px font-bold">{{ stat.totalCount }}</div>
        <div class="text-12px text-gray-400 mt-4px">成功 {{ stat.successCount }} / 失败 {{ stat.failCount }}</div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="never">
        <template #header><span>总 Token 消耗</span></template>
        <div class="text-24px font-bold">{{ stat.totalTokens }}</div>
        <div class="text-12px text-gray-400 mt-4px">输入 {{ stat.totalPromptTokens }} / 输出 {{ stat.totalCompletionTokens }}</div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="never">
        <template #header><span>总费用</span></template>
        <div class="text-24px font-bold text-red-500">¥ {{ stat.totalCostAmountYuan?.toFixed(4) }}</div>
      </el-card>
    </el-col>
    <el-col :span="6">
      <el-card shadow="never">
        <template #header><span>平均耗时</span></template>
        <div class="text-24px font-bold">{{ stat.avgDurationMs }} ms</div>
      </el-card>
    </el-col>
  </el-row>

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
      <el-form-item label="用户编号" prop="userId">
        <el-input v-model="queryParams.userId" placeholder="请输入用户编号" clearable @keyup.enter="handleQuery" class="!w-180px" />
      </el-form-item>
      <el-form-item label="业务类型" prop="bizType">
        <el-select v-model="queryParams.bizType" placeholder="请选择" clearable class="!w-180px">
          <el-option label="聊天" value="CHAT_MESSAGE" />
          <el-option label="写作" value="WRITE" />
          <el-option label="思维导图" value="MIND_MAP" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择" clearable class="!w-180px">
          <el-option label="成功" value="SUCCESS" />
          <el-option label="失败" value="FAIL" />
          <el-option label="取消" value="CANCEL" />
        </el-select>
      </el-form-item>
      <el-form-item label="请求时间" prop="requestTime">
        <el-date-picker v-model="queryParams.requestTime" value-format="YYYY-MM-DD HH:mm:ss" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" class="!w-240px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="success" plain @click="handleExport" :loading="exportLoading" v-hasPermi="['ai:model-call-log:export']">
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="用户" align="center" prop="userId" width="80" />
      <el-table-column label="平台" align="center" prop="platform" width="100" />
      <el-table-column label="模型" align="center" prop="model" min-width="140" />
      <el-table-column label="业务类型" align="center" prop="bizType" width="100" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'SUCCESS'" type="success">成功</el-tag>
          <el-tag v-else-if="scope.row.status === 'FAIL'" type="danger">失败</el-tag>
          <el-tag v-else type="warning">取消</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="输入Token" align="center" prop="promptTokens" width="90" />
      <el-table-column label="输出Token" align="center" prop="completionTokens" width="90" />
      <el-table-column label="费用(微元)" align="center" prop="costAmount" width="100" />
      <el-table-column label="耗时(ms)" align="center" prop="durationMs" width="90" />
      <el-table-column label="请求时间" align="center" prop="requestTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="拦截" align="center" prop="blocked" width="60">
        <template #default="scope">
          <el-tag v-if="scope.row.blocked" type="danger" size="small">是</el-tag>
        </template>
      </el-table-column>
    </el-table>
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { ModelCallLogApi, ModelCallLogStatVO } from '@/api/ai/billing/modelCallLog'
import download from '@/utils/download'

defineOptions({ name: 'AiModelCallLog' })

const message = useMessage()

const loading = ref(true)
const list = ref<any[]>([])
const total = ref(0)
const exportLoading = ref(false)
const stat = ref<ModelCallLogStatVO>({
  totalCount: 0, successCount: 0, failCount: 0,
  totalPromptTokens: 0, totalCompletionTokens: 0, totalTokens: 0,
  totalCostAmount: 0, totalCostAmountYuan: 0, avgDurationMs: 0
})
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  bizType: undefined,
  status: undefined,
  requestTime: undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await ModelCallLogApi.getModelCallLogPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const getStat = async () => {
  stat.value = await ModelCallLogApi.getModelCallLogStat(queryParams)
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
  getStat()
}

const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ModelCallLogApi.exportModelCallLog(queryParams)
    download.excel(data, '调用日志.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  getList()
  getStat()
})
</script>
