<template>
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="钱包编号" align="center" prop="walletId" />
      <el-table-column label="关联业务标题" align="center" prop="title" />
      <el-table-column label="交易金额" align="center" prop="price">
        <template #default="{ row }"> {{ fenToYuan(row.price) }} 元</template>
      </el-table-column>
      <el-table-column label="钱包余额" align="center" prop="balance">
        <template #default="{ row }"> {{ fenToYuan(row.balance) }} 元</template>
      </el-table-column>
      <el-table-column
        label="交易时间"
        align="center"
        prop="createTime"
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
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as WalletTransactionApi from '@/api/pay/wallet/transaction'
import { fenToYuan } from '@/utils'
defineOptions({ name: 'WalletTransactionList' })
const { walletId }: { walletId: number } = defineProps({
  walletId: {
    type: Number,
    required: false
  }
})

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  walletId: null
})
const list = ref([]) // 列表的数据
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.walletId = walletId
    const data = await WalletTransactionApi.getWalletTransactionPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
<style scoped lang="scss"></style>
