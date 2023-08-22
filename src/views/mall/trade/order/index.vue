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
            v-for="dict in getStrDictOptions(DICT_TYPE.TRADE_ORDER_STATUS)"
            :key="dict.value as string"
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
            v-for="dict in getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE_TYPE)"
            :key="dict.value as string"
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
            v-for="dict in getStrDictOptions(DICT_TYPE.TERMINAL)"
            :key="dict.value as string"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单类型" prop="type">
        <el-select v-model="queryParams.type" class="!w-280px" clearable placeholder="全部">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TRADE_ORDER_TYPE)"
            :key="dict.value as string"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="订单搜索">
        <el-input
          v-show="true"
          v-model="queryType.v"
          class="!w-280px"
          clearable
          placeholder="请输入"
        >
          <template #prepend>
            <el-select v-model="queryType.k" clearable placeholder="全部" style="width: 110px">
              <el-option
                v-for="dict in searchList"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <!-- TODO 订单按钮相关权限等订单完善后补齐 -->
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
    <el-table
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      :stripe="true"
      default-expand-all
    >
      <el-table-column fixed="left" type="expand">
        <template #default="scope">
          <el-table :data="scope.row.items" :span-method="spanMethod" border style="width: 100%">
            <el-table-column label="商品信息" min-width="300" prop="spuName">
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
                {{ formatToFraction(row.price) }}元 * {{ row.count }}
              </template>
            </el-table-column>
            <el-table-column label="合计" prop="payPrice" width="150">
              <template #default="{ row }">{{ formatToFraction(row.payPrice) }}元</template>
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
                {{ formatToFraction(scope.row.payPrice) + '元' }}
              </template>
            </el-table-column>
            <el-table-column label="买家/收货人" min-width="160">
              <template #default>
                <div class="flex flex-col">
                  <span>买家：{{ scope.row.user.nickname }}</span>
                  <span>
                    收货人：{{ scope.row.receiverName }} {{ scope.row.receiverMobile }}
                    {{ scope.row.receiverAreaName }} {{ scope.row.receiverDetailAddress }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column align="center" label="配送方式" width="120">
              <template #default>
                <span>{{ scope.row.deliveryType || '快递' }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" fixed="right" label="操作" width="160">
              <template #default>
                <div class="flex justify-center items-center">
                  <el-button link type="primary" @click="openForm(scope.row.id)">
                    <Icon icon="ep:notification" />
                    详情
                  </el-button>
                  <el-dropdown @command="(command) => handleCommand(command, scope.row)">
                    <el-button link type="primary">
                      <Icon icon="ep:d-arrow-right" />
                      更多
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="delivery">
                          <Icon icon="ep:takeaway-box" />
                          发货
                        </el-dropdown-item>
                        <el-dropdown-item command="orderRemarks">
                          <Icon icon="ep:chat-line-square" />
                          订单备注
                        </el-dropdown-item>
                        <el-dropdown-item command="refund">
                          <Icon icon="ep:credit-card" />
                          立即退款
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column align="center" label="订单号" min-width="110" prop="no" />
      <el-table-column align="center" label="订单类型" min-width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.TRADE_ORDER_TYPE" :value="row.type" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="订单来源" min-width="145">
        <template #default="{ row }">
          <dict-tag v-if="row.terminal" :type="DICT_TYPE.TERMINAL" :value="row.terminal" />
          <span v-else>{{ row.terminal }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="支付时间"
        min-width="180"
        prop="payTime"
      />
      <el-table-column align="center" label="支付类型" min-width="100" prop="payChannelCode">
        <template #default="{ row }">
          <dict-tag
            v-if="row.payChannelCode"
            :type="DICT_TYPE.PAY_CHANNEL_CODE_TYPE"
            :value="row.payChannelCode"
          />
        </template>
      </el-table-column>
      <el-table-column align="center" label="订单状态" min-width="100" prop="status">
        <template #default="{ row }">
          <dict-tag
            v-if="row.status !== ''"
            :type="DICT_TYPE.TRADE_ORDER_STATUS"
            :value="row.status"
          />
          <span v-else>{{ row.status }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        min-width="180"
        prop="createTime"
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
  <DeliveryOrderForm ref="deliveryOrderFormRef" @success="getList" />
  <OrderRemarksForm ref="orderRemarksFormRef" @success="getList" />
</template>

<script lang="ts" name="Order" setup>
import type { FormInstance, TableColumnCtx } from 'element-plus'
import DeliveryOrderForm from './components/DeliveryOrderForm.vue'
import OrderRemarksForm from './components/OrderRemarksForm.vue'
import { dateFormatter } from '@/utils/formatTime'
import * as TradeOrderApi from '@/api/mall/trade/order'
import { OrderItemRespVO, OrderVO } from '@/api/mall/trade/order'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { formatToFraction } from '@/utils'
import { createImageViewer } from '@/components/ImageViewer'

const { currentRoute, push } = useRouter() // 路由跳转

const loading = ref(true) // 列表的加载中
const total = ref(2) // 列表的总页数
const list = ref<OrderVO[]>([]) // 列表的数据
const deliveryOrderFormRef = ref()
const orderRemarksFormRef = ref()
const openForm = (id: number) => {
  push('/trade/order/detail/' + id)
}
/** 商品图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}

interface SpanMethodProps {
  row: OrderItemRespVO
  column: TableColumnCtx<OrderItemRespVO>
  rowIndex: number
  columnIndex: number
}

const spanMethod = ({ rowIndex, columnIndex }: SpanMethodProps) => {
  const colIndex = [4, 5, 6, 7]
  // 处理列
  if (colIndex.includes(columnIndex)) {
    // 处理被合并的行
    if (rowIndex !== 0) {
      return {
        rowspan: 0,
        colspan: 0
      }
    }
    return {
      rowspan: 2,
      colspan: 1
    }
  }
}
/** 操作分发 */
const handleCommand = (command: string, row: OrderVO) => {
  console.log(row)
  switch (command) {
    case 'orderRemarks':
      orderRemarksFormRef.value?.open(row)
      break
    case 'refund':
      break
    case 'delivery':
      deliveryOrderFormRef.value?.open(row.id)
      break
  }
}
const queryFormRef = ref<FormInstance>() // 搜索的表单
//表单搜索 TODO 订单相关操作完成后立马实现
const queryParams = reactive({
  pageNo: 1, //首页
  pageSize: 10, //页面大小
  no: '',
  userId: '',
  userNickname: '',
  userMobile: '',
  receiverName: '',
  receiverMobile: '',
  terminal: '',
  type: null,
  status: null,
  payChannelCode: '',
  createTime: [],
  spuName: '',
  itemCount: '',
  all: ''
})

const queryType = reactive({ k: '', v: '' }) // 订单搜索类型kv
/*
 * 订单聚合搜索
 * 商品名称  商品件数 全部  需要后端支持TODO
 */
const searchList = ref([
  { value: 'no', label: '订单号' },
  { value: 'userId', label: '用户UID' },
  { value: 'userNickname', label: '用户昵称' },
  { value: 'userMobile', label: '用户电话' }
])
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await TradeOrderApi.getOrderPage(queryParams)
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
  queryFormRef.value?.resetFields()
  handleQuery()
}

// 监听路由变化更新列表，解决商品保存后，列表不刷新的问题。
watch(
  () => currentRoute.value,
  () => {
    getList()
  }
)

/** 初始化 **/
onMounted(async () => {
  await getList()
})
</script>
