<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
      <el-form-item label="用户编号" prop="userId">
        <el-input v-model="queryParams.userId" placeholder="0=租户级" clearable @keyup.enter="handleQuery" class="!w-180px" />
      </el-form-item>
      <el-form-item label="事件类型" prop="eventType">
        <el-select v-model="queryParams.eventType" placeholder="请选择" clearable class="!w-180px">
          <el-option label="阈值告警" value="THRESHOLD_ALERT" />
          <el-option label="超限拦截" value="OVER_LIMIT_BLOCK" />
          <el-option label="手动调整" value="MANUAL_ADJUST" />
        </el-select>
      </el-form-item>
      <el-form-item label="周期时间" prop="periodStartTime">
        <el-date-picker v-model="queryParams.periodStartTime" value-format="YYYY-MM-DD HH:mm:ss" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" class="!w-240px" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="用户编号" align="center" prop="userId" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.userId === 0" type="warning">租户级</el-tag>
          <span v-else>{{ scope.row.userId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="事件类型" align="center" prop="eventType" width="120">
        <template #default="scope">
          <el-tag v-if="scope.row.eventType === 'THRESHOLD_ALERT'" type="warning">阈值告警</el-tag>
          <el-tag v-else-if="scope.row.eventType === 'OVER_LIMIT_BLOCK'" type="danger">超限拦截</el-tag>
          <el-tag v-else type="info">手动调整</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="预算金额(微元)" align="center" prop="budgetAmount" min-width="120" />
      <el-table-column label="已用金额(微元)" align="center" prop="usedAmount" min-width="120" />
      <el-table-column label="变化金额(微元)" align="center" prop="deltaAmount" min-width="120" />
      <el-table-column label="描述" align="center" prop="message" min-width="250" />
      <el-table-column label="创建时间" align="center" prop="createTime" :formatter="dateFormatter" width="180" />
    </el-table>
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { BudgetLogApi } from '@/api/ai/billing/budgetLog'

defineOptions({ name: 'AiBudgetLog' })

const loading = ref(true)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  eventType: undefined,
  periodStartTime: undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await BudgetLogApi.getBudgetLogPage(queryParams)
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

onMounted(() => {
  getList()
})
</script>
