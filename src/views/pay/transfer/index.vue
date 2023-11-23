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
      <el-form-item label="转账单号" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="请输入转账单号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="转账渠道" prop="channelCode">
        <el-select
          v-model="queryParams.channelCode"
          placeholder="请选择支付渠道"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="商户单号" prop="merchantTransferId">
        <el-input
          v-model="queryParams.merchantTransferId"
          placeholder="请输入商户单号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择类型" clearable class="!w-240px">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.PAY_TRANSFER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="转账状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择转账状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.PAY_TRANSFER_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="收款人姓名" prop="userName">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入收款人姓名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="渠道单号" prop="channelTransferNo">
        <el-input
          v-model="queryParams.channelTransferNo"
          placeholder="渠道单号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
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
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="应用编号" align="center" prop="appId" />
      <el-table-column label="类型" align="center" prop="type" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_TRANSFER_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="转账金额" align="center" prop="price">
        <template #default="scope">
          <span>￥{{ (scope.row.price / 100.0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="转账状态" align="center" prop="status" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_TRANSFER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="订单号" align="left" width="300">
        <template #default="scope">
          <p class="transfer-font">
            <el-tag size="small"> 商户</el-tag>
            {{ scope.row.merchantTransferId }}
          </p>
          <p class="transfer-font" v-if="scope.row.no">
            <el-tag size="small" type="warning">转账</el-tag>
            {{ scope.row.no }}
          </p>
          <p class="transfer-font" v-if="scope.row.channelTransferNo">
            <el-tag size="small" type="success">渠道</el-tag>
            {{ scope.row.channelTransferNo }}
          </p>
        </template>
      </el-table-column>
      <el-table-column label="收款人姓名" align="center" prop="userName" width="120" />
      <el-table-column label="收款账号" align="left" width="200">
        <template #default="scope">
          <p class="transfer-font" v-if="scope.row.alipayLogonId">
            <el-tag size="small">支付宝登录号</el-tag>
            {{ scope.row.alipayLogonId }}
          </p>
          <p class="transfer-font" v-if="scope.row.openid">
            <el-tag size="small">微信 openId</el-tag>
            {{ scope.row.openid }}
          </p>
        </template>
      </el-table-column>
      <el-table-column label="转账标题" align="center" prop="subject" width="120" />
      <el-table-column label="转账渠道" align="center" prop="channelCode">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_CHANNEL_CODE" :value="scope.row.channelCode" />
        </template>
      </el-table-column>
      <el-table-column
        label="转账成功时间"
        align="center"
        prop="successTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openDetail(scope.row.id)"> 详情 </el-button>
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
    <TransferDetail ref="detailRef" />
  </ContentWrap>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import * as TransferApi from '@/api/pay/transfer'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import TransferDetail from './TransferDetail.vue'
defineOptions({ name: 'PayTransfer' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  no: null,
  appId: null,
  channelId: null,
  channelCode: null,
  merchantTransferId: null,
  type: null,
  status: null,
  successTime: [],
  price: null,
  subject: null,
  userName: null,
  alipayLogonId: null,
  openid: null,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await TransferApi.getTransferPage(queryParams)
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

/** 添加/修改操作 */
const detailRef = ref()
const openDetail = (id: number) => {
  detailRef.value.open(id)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style scoped>
.transfer-font {
  padding: 2px 0;
  font-size: 12px;
}
</style>
