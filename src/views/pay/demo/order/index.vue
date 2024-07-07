<template>
  <doc-alert title="支付宝支付接入" url="https://doc.iocoder.cn/pay/alipay-pay-demo/" />
  <doc-alert title="支付宝、微信退款接入" url="https://doc.iocoder.cn/pay/refund-demo/" />
  <doc-alert title="微信公众号支付接入" url="https://doc.iocoder.cn/pay/wx-pub-pay-demo/" />
  <doc-alert title="微信小程序支付接入" url="https://doc.iocoder.cn/pay/wx-lite-pay-demo/" />

  <!-- 操作工具栏 -->
  <el-row :gutter="10" class="mb8">
    <el-col :span="1.5">
      <el-button type="primary" plain @click="openForm"><Icon icon="ep:plus" />发起订单</el-button>
    </el-col>
  </el-row>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="订单编号" align="center" prop="id" />
      <el-table-column label="用户编号" align="center" prop="userId" />
      <el-table-column label="商品名字" align="center" prop="spuName" />
      <el-table-column label="支付价格" align="center" prop="price">
        <template #default="scope">
          <span>￥{{ (scope.row.price / 100.0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="退款金额" align="center" prop="refundPrice">
        <template #default="scope">
          <span>￥{{ (scope.row.refundPrice / 100.0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="支付单号" align="center" prop="payOrderId" />
      <el-table-column label="是否支付" align="center" prop="payStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.payStatus" />
        </template>
      </el-table-column>
      <el-table-column
        label="支付时间"
        align="center"
        prop="payTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="退款时间" align="center" prop="refundTime" width="180">
        <template #default="scope">
          <span v-if="scope.row.refundTime">{{ formatDate(scope.row.refundTime) }}</span>
          <span v-else-if="scope.row.payRefundId">退款中，等待退款结果</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" @click="handlePay(scope.row)" v-if="!scope.row.payStatus">
            前往支付
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleRefund(scope.row)"
            v-if="scope.row.payStatus && !scope.row.payRefundId"
          >
            发起退款
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页组件 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 对话框(添加 / 修改) -->
  <Dialog title="发起订单" v-model="dialogVisible" width="500px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="商品" prop="spuId">
        <el-select
          v-model="formData.spuId"
          placeholder="请输入下单商品"
          clearable
          style="width: 380px"
        >
          <el-option v-for="item in spus" :key="item.id" :label="item.name" :value="item.id">
            <span style="float: left">{{ item.name }}</span>
            <span style="float: right; font-size: 13px; color: #8492a6">
              ￥{{ (item.price / 100.0).toFixed(2) }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup name="PayDemoOrder">
import * as PayDemoApi from '@/api/pay/demo'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'

const { t } = useI18n() // 国际化
const router = useRouter() // 路由对象
const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
// 查询条件
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10
})

const formRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await PayDemoApi.getDemoOrderPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 支付按钮操作 */
const handlePay = (row: any) => {
  router.push({
    name: 'PayCashier',
    query: {
      id: row.payOrderId,
      returnUrl: encodeURIComponent('/pay/demo/order?id=' + row.id)
    }
  })
}

/** 退款按钮操作 */
const handleRefund = async (row: any) => {
  const id = row.id
  try {
    await message.confirm('是否确认退款编号为"' + id + '"的示例订单?')
    await PayDemoApi.refundDemoOrder(id)
    await getList()
    message.success('发起退款成功！')
  } catch {}
}

// ========== 弹窗 ==========

// 商品数组
const spus = ref([
  {
    id: 1,
    name: '华为手机',
    price: 1
  },
  {
    id: 2,
    name: '小米电视',
    price: 10
  },
  {
    id: 3,
    name: '苹果手表',
    price: 100
  },
  {
    id: 4,
    name: '华硕笔记本',
    price: 1000
  },
  {
    id: 5,
    name: '蔚来汽车',
    price: 200000
  }
])

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formData = ref<any>({}) // 表单数据
const formRules = {
  spuId: [{ required: true, message: '商品编号不能为空', trigger: 'blur' }]
}

/** 表单重置 */
const reset = () => {
  formData.value = {
    spuId: undefined
  }
  formRef.value?.resetFields()
}

/** 新增按钮操作 */
const openForm = () => {
  reset()
  dialogVisible.value = true
}

/** 提交按钮 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    await PayDemoApi.createDemoOrder(formData.value)
    message.success(t('common.createSuccess'))
    dialogVisible.value = false
  } finally {
    formLoading.value = false
    getList()
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
