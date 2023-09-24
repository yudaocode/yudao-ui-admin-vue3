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
      <el-form-item v-if="queryParams.deliveryType === 1" label="快递公司">
        <el-select v-model="queryParams.logisticsId" class="!w-280px" clearable placeholder="全部">
          <el-option
            v-for="item in deliveryExpressList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="queryParams.deliveryType === 2" label="自提门店">
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
      <!-- TODO 聚合搜索等售后结束后实现-->
      <!--      <el-form-item label="聚合搜索">-->
      <!--        <el-input-->
      <!--          v-show="true"-->
      <!--          v-model="queryType.v"-->
      <!--          class="!w-280px"-->
      <!--          clearable-->
      <!--          placeholder="请输入"-->
      <!--        >-->
      <!--          <template #prepend>-->
      <!--            <el-select v-model="queryType.k" class="!w-110px" clearable placeholder="全部">-->
      <!--              <el-option-->
      <!--                v-for="dict in searchList"-->
      <!--                :key="dict.value"-->
      <!--                :label="dict.label"-->
      <!--                :value="dict.value"-->
      <!--              />-->
      <!--            </el-select>-->
      <!--          </template>-->
      <!--        </el-input>-->
      <!--      </el-form-item>-->
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
    <el-table v-loading="loading" :data="list">
      <el-table-column class-name="order-table-col">
        <template #header>
          <!-- TODO @puhui999：小屏幕下，会有偏移，后续看看 -->
          <div class="flex items-center" style="width: 100%">
            <div class="ml-100px mr-200px">商品信息</div>
            <div class="mr-60px">单价(元)/数量</div>
            <div class="mr-60px">售后状态</div>
            <div class="mr-60px">实付金额(元)</div>
            <div class="mr-60px">买家/收货人</div>
            <div class="mr-60px">配送方式</div>
            <div class="mr-60px">订单状态</div>
            <div class="mr-60px">操作</div>
          </div>
        </template>
        <template #default="scope">
          <el-table
            :border="true"
            :data="scope.row.items"
            :header-cell-style="headerStyle"
            :span-method="spanMethod"
            style="width: 100%"
          >
            <el-table-column min-width="300" prop="spuName">
              <template #header>
                <div
                  class="flex items-center"
                  style="width: 100%; height: 35px; background-color: #f7f7f7"
                >
                  <span class="mr-20px">订单号：{{ scope.row.no }} </span>
                  <span class="mr-20px">下单时间：{{ formatDate(scope.row.createTime) }}</span>
                  <span>订单来源：</span>
                  <dict-tag
                    :type="DICT_TYPE.TERMINAL"
                    :value="scope.row.terminal"
                    class="mr-20px"
                  />
                  <span>支付方式：</span>
                  <dict-tag
                    v-if="scope.row.payChannelCode"
                    :type="DICT_TYPE.PAY_CHANNEL_CODE"
                    :value="scope.row.payChannelCode"
                    class="mr-20px"
                  />
                  <v-else v-else class="mr-20px">未支付</v-else>
                  <span v-if="scope.row.payTime" class="mr-20px">
                    支付时间：{{ formatDate(scope.row.payTime) }}
                  </span>
                  <span>订单类型：</span>
                  <dict-tag :type="DICT_TYPE.TRADE_ORDER_TYPE" :value="scope.row.type" />
                </div>
              </template>
              <template #default="{ row }">
                <div class="flex items-center">
                  <el-image
                    :src="row.picUrl"
                    class="w-30px h-30px mr-10px"
                    @click="imagePreview(row.picUrl)"
                  />
                  <span class="mr-10px">{{ row.spuName }}</span>
                  <el-tag
                    v-for="property in row.properties"
                    :key="property.propertyId"
                    class="mr-10px"
                  >
                    {{ property.propertyName }}: {{ property.valueName }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="商品原价*数量" prop="price" width="150">
              <template #default="{ row }">
                {{ floatToFixed2(row.price) }} 元 / {{ row.count }}
              </template>
            </el-table-column>
            <el-table-column label="售后状态" prop="afterSaleStatus" width="120">
              <template #default="{ row }">
                <dict-tag
                  :type="DICT_TYPE.TRADE_ORDER_ITEM_AFTER_SALE_STATUS"
                  :value="row.afterSaleStatus"
                />
              </template>
            </el-table-column>
            <el-table-column align="center" label="实际支付" min-width="120" prop="payPrice">
              <template #default>
                {{ floatToFixed2(scope.row.payPrice) + '元' }}
              </template>
            </el-table-column>
            <el-table-column label="买家/收货人" min-width="160">
              <template #default>
                <!-- 快递发货  -->
                <div v-if="scope.row.deliveryType === 1" class="flex flex-col">
                  <span>买家：{{ scope.row.user.nickname }}</span>
                  <span>
                    收货人：{{ scope.row.receiverName }} {{ scope.row.receiverMobile }}
                    {{ scope.row.receiverAreaName }} {{ scope.row.receiverDetailAddress }}
                  </span>
                </div>
                <!-- 自提  -->
                <div v-if="scope.row.deliveryType === 2" class="flex flex-col">
                  <span>
                    门店名称：
                    {{ pickUpStoreList.find((p) => p.id === scope.row.pickUpStoreId)?.name }}
                  </span>
                  <span>
                    门店手机：
                    {{ pickUpStoreList.find((p) => p.id === scope.row.pickUpStoreId)?.phone }}
                  </span>
                  <span>
                    自提门店:
                    {{
                      pickUpStoreList.find((p) => p.id === scope.row.pickUpStoreId)?.detailAddress
                    }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column align="center" label="配送方式" width="120">
              <template #default>
                <dict-tag :type="DICT_TYPE.TRADE_DELIVERY_TYPE" :value="scope.row.deliveryType" />
              </template>
            </el-table-column>
            <el-table-column align="center" label="订单状态" width="120">
              <template #default>
                <dict-tag :type="DICT_TYPE.TRADE_ORDER_STATUS" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column align="center" fixed="right" label="操作" width="160">
              <template #default>
                <el-button link type="primary" @click="openDetail(scope.row.id)">
                  <Icon icon="ep:notification" />
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
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
<script setup lang="ts">
import * as OrderApi from '@/api/mall/trade/order/index'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { floatToFixed2 } from '@/utils'
import * as PickUpStoreApi from '@/api/mall/trade/delivery/pickUpStore'
import * as DeliveryExpressApi from '@/api/mall/trade/delivery/express'
import { createImageViewer } from '@/components/ImageViewer'
import * as TradeOrderApi from '@/api/mall/trade/order'
import { FormInstance, TableColumnCtx } from 'element-plus'

const { push } = useRouter() // 路由跳转

const { userId }: { userId: number } = defineProps({
  userId: {
    type: Number,
    required: true
  }
})
const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const pickUpStoreList = ref([]) // 自提门店精简列表
const deliveryExpressList = ref([]) // 物流公司
const queryFormRef = ref<FormInstance>() // 搜索的表单
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  createDate: [],
  userId: NaN
})
const headerStyle = ({ row, columnIndex }: any) => {
  // 表头第一行第一列占 8
  if (columnIndex === 0) {
    row[columnIndex].colSpan = 8
  } else {
    // 其余的不要
    row[columnIndex].colSpan = 0
    return {
      display: 'none'
    }
  }
}
/** 搜索按钮操作 */
const handleQuery = async () => {
  queryParams.pageNo = 1
  await getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await OrderApi.getOrderPage(queryParams)
    console.log(data)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 商品图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}

interface SpanMethodProps {
  row: TradeOrderApi.OrderItemRespVO
  column: TableColumnCtx<TradeOrderApi.OrderItemRespVO>
  rowIndex: number
  columnIndex: number
}

const spanMethod = ({ row, rowIndex, columnIndex }: SpanMethodProps) => {
  const len = list.value.find(
    (order) => order.items?.findIndex((item) => item.id === row.id) !== -1
  )?.items?.length
  // 要合并的列，从零开始
  const colIndex = [3, 4, 5, 6, 7]
  if (colIndex.includes(columnIndex)) {
    // 除了第一行其余的不要
    if (rowIndex !== 0) {
      return {
        rowspan: 0,
        colspan: 0
      }
    }
    // 动态合并行
    return {
      rowspan: len,
      colspan: 1
    }
  }
}

/** 查看订单详情 */
const openDetail = (id: number) => {
  push({ name: 'TradeOrderDetail', params: { orderId: id } })
}

/** 初始化 **/
onMounted(async () => {
  queryParams.userId = userId
  await getList()
  pickUpStoreList.value = await PickUpStoreApi.getListAllSimple()
  deliveryExpressList.value = await DeliveryExpressApi.getSimpleDeliveryExpressList()
})
</script>
<style scoped lang="scss"></style>
