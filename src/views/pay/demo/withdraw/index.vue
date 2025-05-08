<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm('create')">
          <Icon icon="ep:plus" />创建示例提现单
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
      <el-table-column label="提现单编号" align="center" prop="id" width="100" />
      <el-table-column label="提现标题" align="center" prop="subject" min-width="120" />
      <el-table-column label="提现类型" align="center" prop="type" min-width="90">
        <template #default="scope">
          <el-tag v-if="scope.row.type === 1">支付宝</el-tag>
          <el-tag v-else-if="scope.row.type === 2">微信支付</el-tag>
          <el-tag v-else-if="scope.row.type === 3">钱包</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="提现金额" align="center" prop="price" width="120">
        <template #default="scope">
          <span>￥{{ (scope.row.price / 100.0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="收款人姓名" align="center" prop="userName" min-width="150" />
      <el-table-column label="收款人账号" align="center" prop="userAccount" min-width="250" />
      <el-table-column label="提现状态" align="center" prop="status" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 0" type="warning">等待转账</el-tag>
          <el-tag v-else-if="scope.row.status === 10" type="success">转账成功</el-tag>
          <el-tag v-else-if="scope.row.status === 20" type="danger">转账失败</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="转账单号" align="center" prop="payTransferId" min-width="120" />
      <el-table-column label="支付渠道" align="center" prop="transferChannelCode" min-width="180">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_CHANNEL_CODE" :value="scope.row.transferChannelCode" />
        </template>
      </el-table-column>
      <el-table-column
        label="转账时间"
        align="center"
        prop="transferTime"
        :formatter="dateFormatter"
        width="180px"
      />
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
  <DemoWithdrawForm ref="demoFormRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import * as DemoWithdrawApi from '@/api/pay/demo/withdraw'
import DemoWithdrawForm from './DemoWithdrawForm.vue'
import { DICT_TYPE } from '@/utils/dict'

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DemoWithdrawApi.getDemoWithdrawPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 创建示例提现单操作 */
const demoFormRef = ref()
const openForm = (type: string) => {
  demoFormRef.value.open(type)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
