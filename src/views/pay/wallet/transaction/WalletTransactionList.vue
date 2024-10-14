<template>
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
      <el-table-column align="center" label="编号" prop="id" />
      <el-table-column align="center" label="钱包编号" prop="walletId" />
      <el-table-column align="center" label="关联业务标题" prop="title" />
      <el-table-column align="center" label="交易金额" prop="price">
        <template #default="{ row }"> {{ fenToYuan(row.price) }} 元</template>
      </el-table-column>
      <el-table-column align="center" label="钱包余额" prop="balance">
        <template #default="{ row }"> {{ fenToYuan(row.balance) }} 元</template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="交易时间"
        prop="createTime"
        width="180px"
      />
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as WalletTransactionApi from '@/api/pay/wallet/transaction'
import * as WalletApi from '@/api/pay/wallet/balance'
import { fenToYuan } from '@/utils'

defineOptions({ name: 'WalletTransactionList' })
const props = defineProps({
  walletId: {
    type: Number,
    required: false
  },
  userId: {
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
    if (props.userId) {
      const wallet = await WalletApi.getWallet({ userId: props.userId })
      queryParams.walletId = wallet.id as any
    } else {
      queryParams.walletId = props.walletId as any
    }
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
<style lang="scss" scoped></style>
