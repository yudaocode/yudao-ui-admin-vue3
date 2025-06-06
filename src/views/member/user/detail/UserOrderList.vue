<template>
  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="订单状态" prop="status">
        <el-select v-model="queryParams.status" class="!w-280px" clearable placeholder="全部">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.TRADE_ORDER_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="支付方式" prop="payChannelCode">
        <el-select
          v-model="queryParams.payChannelCode"
          class="!w-280px"
          clearable
          placeholder="全部"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-280px"
          end-placeholder="自定义时间"
          start-placeholder="自定义时间"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="订单来源" prop="terminal">
        <el-select v-model="queryParams.terminal" class="!w-280px" clearable placeholder="全部">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.TERMINAL)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单类型" prop="type">
        <el-select v-model="queryParams.type" class="!w-280px" clearable placeholder="全部">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.TRADE_ORDER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="配送方式" prop="deliveryType">
        <el-select v-model="queryParams.deliveryType" class="!w-280px" clearable placeholder="全部">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.TRADE_DELIVERY_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="queryParams.deliveryType === DeliveryTypeEnum.EXPRESS.type"
        label="快递公司"
        prop="logisticsId"
      >
        <el-select v-model="queryParams.logisticsId" class="!w-280px" clearable placeholder="全部">
          <el-option
            v-for="item in deliveryExpressList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="queryParams.deliveryType === DeliveryTypeEnum.PICK_UP.type"
        label="自提门店"
        prop="pickUpStoreId"
      >
        <el-select
          v-model="queryParams.pickUpStoreId"
          class="!w-280px"
          clearable
          multiple
          placeholder="全部"
        >
          <el-option
            v-for="item in pickUpStoreList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="queryParams.deliveryType === DeliveryTypeEnum.PICK_UP.type"
        label="核销码"
        prop="pickUpVerifyCode"
      >
        <el-input
          v-model="queryParams.pickUpVerifyCode"
          class="!w-280px"
          clearable
          placeholder="请输入自提核销码"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="聚合搜索">
        <el-input
          v-show="true"
          v-model="queryParams[queryType.queryParam]"
          class="!w-280px"
          clearable
          placeholder="请输入"
        >
          <template #prepend>
            <el-select
              v-model="queryType.queryParam"
              class="!w-110px"
              clearable
              placeholder="全部"
              @change="inputChangeSelect"
            >
              <el-option
                v-for="dict in dynamicSearchList"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <!-- 添加 row-key="id" 解决列数据中的 table#header 数据不刷新的问题  -->
    <el-table v-loading="loading" :data="list" row-key="id">
      <OrderTableColumn :list="list" :pick-up-store-list="pickUpStoreList">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">
            <Icon icon="ep:notification" />
            详情
          </el-button>
        </template>
      </OrderTableColumn>
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
import * as OrderApi from '@/api/mall/trade/order/index'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import * as PickUpStoreApi from '@/api/mall/trade/delivery/pickUpStore'
import * as DeliveryExpressApi from '@/api/mall/trade/delivery/express'
import { FormInstance } from 'element-plus'
import { OrderTableColumn } from '@/views/mall/trade/order/components'
import { DeliveryTypeEnum } from '@/utils/constants'

const { push } = useRouter() // 路由跳转

const { userId } = defineProps<{
  userId: number
}>()

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const pickUpStoreList = ref<PickUpStoreApi.DeliveryPickUpStoreVO[]>([]) // 自提门店精简列表
const deliveryExpressList = ref<DeliveryExpressApi.DeliveryExpressVO[]>([]) // 物流公司
const queryFormRef = ref<FormInstance>() // 搜索的表单
// 表单搜索
const queryParams = ref({
  pageNo: 1, // 页数
  pageSize: 10, // 每页显示数量
  userId: userId,
  status: undefined, // 订单状态
  payChannelCode: undefined, // 支付方式
  createTime: undefined, // 创建时间
  terminal: undefined, // 订单来源
  type: undefined, // 订单类型
  deliveryType: undefined, // 配送方式
  logisticsId: undefined, // 快递公司
  pickUpStoreId: undefined, // 自提门店
  pickUpVerifyCode: undefined // 自提核销码
})
const queryType = reactive({ queryParam: '' }) // 订单搜索类型 queryParam

// 订单聚合搜索 select 类型配置（动态搜索）
const dynamicSearchList = ref([
  { value: 'no', label: '订单号' },
  { value: 'userNickname', label: '用户昵称' },
  { value: 'userMobile', label: '用户电话' }
])
/**
 * 聚合搜索切换查询对象时触发
 * @param val
 */
const inputChangeSelect = (val: string) => {
  dynamicSearchList.value
    .filter((item) => item.value !== val)
    ?.forEach((item1) => {
      // 清除集合搜索无用属性
      if (queryParams.value.hasOwnProperty(item1.value)) {
        delete queryParams.value[item1.value]
      }
    })
}

/** 搜索按钮操作 */
const handleQuery = async () => {
  queryParams.value.pageNo = 1
  await getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.value.userId = userId
  handleQuery()
}
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await OrderApi.getOrderPage(queryParams.value)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查看订单详情 */
const openDetail = (id: number) => {
  push({ name: 'TradeOrderDetail', params: { id } })
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  pickUpStoreList.value = await PickUpStoreApi.getSimpleDeliveryPickUpStoreList()
  deliveryExpressList.value = await DeliveryExpressApi.getSimpleDeliveryExpressList()
})
</script>
