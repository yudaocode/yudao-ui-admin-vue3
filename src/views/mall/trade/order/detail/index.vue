<template>
  <ContentWrap>
    <!-- 订单信息 -->
    <el-descriptions title="订单信息">
      <el-descriptions-item label="订单号: ">{{ orderInfo.no }}</el-descriptions-item>
      <el-descriptions-item label="配送方式: ">物流配送</el-descriptions-item>
      <!-- TODO 芋艿：待实现 -->
      <el-descriptions-item label="营销活动: ">物流配送</el-descriptions-item>
      <!-- TODO 芋艿：待实现 -->
      <el-descriptions-item label="订单类型: ">
        <dict-tag :type="DICT_TYPE.TRADE_ORDER_TYPE" :value="orderInfo.type" />
      </el-descriptions-item>
      <el-descriptions-item label="收货人: ">{{ orderInfo.receiverName }}</el-descriptions-item>
      <el-descriptions-item label="买家留言: ">{{ orderInfo.userRemark }}</el-descriptions-item>
      <el-descriptions-item label="订单来源: ">
        <dict-tag :type="DICT_TYPE.TERMINAL" :value="orderInfo.terminal" />
      </el-descriptions-item>
      <el-descriptions-item label="联系电话: ">{{ orderInfo.receiverMobile }}</el-descriptions-item>
      <el-descriptions-item label="商家备注: ">{{ orderInfo.remark }}</el-descriptions-item>
      <el-descriptions-item label="支付单号: ">{{ orderInfo.payOrderId }}</el-descriptions-item>
      <el-descriptions-item label="付款方式: ">
        <dict-tag :type="DICT_TYPE.PAY_CHANNEL_CODE_TYPE" :value="orderInfo.payChannelCode" />
      </el-descriptions-item>
      <!-- <el-descriptions-item label="买家: ">{{ orderInfo.user.nickname }}</el-descriptions-item> -->
      <!-- TODO 芋艿：待实现：跳转会员 -->
      <el-descriptions-item label="收货地址: ">
        {{ orderInfo.receiverAreaName }} {{ orderInfo.receiverDetailAddress }}
        <el-link
          v-clipboard:copy="orderInfo.receiverAreaName + ' ' + orderInfo.receiverDetailAddress"
          v-clipboard:success="clipboardSuccess"
          icon="ep:document-copy"
          type="primary"
        />
      </el-descriptions-item>
    </el-descriptions>

    <!-- 订单状态 -->
    <el-descriptions :column="1" title="订单状态">
      <el-descriptions-item label="订单状态: ">
        <!-- TODO xiaobai：status 一定有值哈，不用判断 -->
        <dict-tag
          v-if="orderInfo.status !== ''"
          :type="DICT_TYPE.TRADE_ORDER_STATUS"
          :value="orderInfo.status"
        />
      </el-descriptions-item>
      <el-descriptions-item label-class-name="no-colon">
        <el-button size="small" type="primary">调整价格</el-button>
        <!-- TODO 芋艿：待实现 -->
        <el-button size="small" type="primary" @click="openForm('remark')">备注</el-button>
        <!-- TODO 芋艿：待实现 -->
        <el-button size="small" type="primary" @click="openForm('delivery')">发货</el-button>
        <!-- TODO 芋艿：待实现 -->
        <el-button size="small" type="primary">修改地址</el-button>
        <!-- TODO 芋艿：待实现 -->
        <el-button size="small" type="primary">确认收货</el-button>
        <!-- TODO 芋艿：待实现 -->
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label><span style="color: red">提醒: </span></template>
        买家付款成功后，货款将直接进入您的商户号（微信、支付宝）<br />
        请及时关注你发出的包裹状态，确保可以配送至买家手中 <br />
        如果买家表示没收到货或货物有问题，请及时联系买家处理，友好协商
      </el-descriptions-item>
    </el-descriptions>

    <!-- 物流信息 TODO -->

    <!-- 商品信息 -->
    <el-descriptions title="商品信息">
      <el-descriptions-item labelClassName="no-colon">
        <el-row :gutter="20">
          <el-col :span="15">
            <el-table :data="orderInfo.items" border>
              <el-table-column label="商品" prop="spuName" width="auto">
                <template #default="{ row }">
                  {{ row.spuName }}
                  <el-tag v-for="property in row.properties" :key="property.propertyId">
                    {{ property.propertyName }}: {{ property.valueName }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="商品原价(元)" prop="price" width="150">
                <template #default="{ row }">{{ formatToFraction(row.price) }}</template>
              </el-table-column>
              <el-table-column label="数量" prop="count" width="100" />
              <el-table-column label="合计(元)" prop="payPrice" width="150">
                <template #default="{ row }">{{ formatToFraction(row.payPrice) }}</template>
              </el-table-column>
              <el-table-column label="售后状态" prop="afterSaleStatus" width="120">
                <template #default="{ row }">
                  <dict-tag
                    :type="DICT_TYPE.TRADE_ORDER_ITEM_AFTER_SALE_STATUS"
                    :value="row.afterSaleStatus"
                  />
                </template>
              </el-table-column>
            </el-table>
          </el-col>
          <el-col :span="10" />
        </el-row>
      </el-descriptions-item>
      <!-- 占位 -->
      <!-- <el-descriptions-item v-for="item in 5" label-class-name="no-colon" :key="item" /> -->
    </el-descriptions>
    <el-descriptions :column="6">
      <el-descriptions-item label="商品总额: ">
        {{ formatToFraction(orderInfo.totalPrice) }}元
      </el-descriptions-item>
      <el-descriptions-item label="运费金额: ">
        {{ formatToFraction(orderInfo.deliveryPrice) }}元
      </el-descriptions-item>
      <el-descriptions-item label="订单调价: ">
        {{ formatToFraction(orderInfo.adjustPrice) }}元
      </el-descriptions-item>

      <el-descriptions-item>
        <template #label><span style="color: red">商品优惠: </span></template>
        <!-- 没理解TODO  orderInfo.totalPrice - orderInfo.totalPrice -->
        {{ formatToFraction(orderInfo.totalPrice - orderInfo.totalPrice) }}元
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label><span style="color: red">订单优惠: </span></template>
        {{ formatToFraction(orderInfo.discountPrice) }}元
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label><span style="color: red">积分抵扣: </span></template>
        {{ formatToFraction(orderInfo.pointPrice) }}元
      </el-descriptions-item>

      <el-descriptions-item v-for="item in 5" :key="item" label-class-name="no-colon" />
      <!-- 占位 -->
      <el-descriptions-item label="应付金额: ">
        {{ formatToFraction(orderInfo.payPrice) }}元
      </el-descriptions-item>
    </el-descriptions>

    <!-- TODO 芋艿：需要改改 -->
    <div v-for="group in detailGroups" :key="group.title">
      <el-descriptions :title="group.title" v-bind="group.groupProps">
        <!-- 订单操作日志 -->
        <el-descriptions-item v-if="group.key === 'orderLog'" labelClassName="no-colon">
          <el-timeline>
            <el-timeline-item
              v-for="activity in detailInfo[group.key]"
              :key="activity.timestamp"
              :timestamp="activity.timestamp"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-descriptions-item>

        <!-- 物流信息 -->
        <!-- TODO @xiaobai：改成一个包裹哈；目前只允许发货一次 -->
        <el-descriptions-item v-if="group.key === 'expressInfo'" labelClassName="no-colon">
          <!-- 循环包裹物流信息 -->
          <div v-show="(pkgInfo = detailInfo[group.key]) !== null" style="border: 1px dashed">
            <!-- 包裹详情 -->
            <el-descriptions class="m-5">
              <el-descriptions-item
                v-for="(pkgChild, pkgCIdx) in group.children"
                :key="`pkgChild_${pkgCIdx}`"
                :label="pkgChild.label"
                v-bind="pkgChild.childProps"
              >
                <!-- 包裹商品列表 -->
                <template v-if="pkgChild.valueKey === 'goodsList' && pkgInfo[pkgChild.valueKey]">
                  <div
                    v-for="(goodInfo, goodInfoIdx) in pkgInfo[pkgChild.valueKey]"
                    :key="`goodInfo_${goodInfoIdx}`"
                    style="display: flex"
                  >
                    <el-image
                      :src="goodInfo.imgUrl"
                      style="width: 100px; height: 100px; flex: none"
                    />
                    <el-descriptions :column="1">
                      <el-descriptions-item labelClassName="no-colon"
                        >{{ goodInfo.name }}
                      </el-descriptions-item>
                      <el-descriptions-item label="数量"
                        >{{ goodInfo.count }}
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>
                </template>

                <!-- 包裹物流详情 -->
                <template v-else-if="pkgChild.valueKey === 'wlxq'">
                  <el-row :gutter="10">
                    <el-col :offset="1" :span="6">
                      <el-timeline>
                        <el-timeline-item
                          v-for="(activity, index) in pkgInfo[pkgChild.valueKey]"
                          :key="index"
                          :timestamp="activity.timestamp"
                        >
                          {{ activity.content }}
                        </el-timeline-item>
                      </el-timeline>
                    </el-col>
                  </el-row>
                </template>
                <template v-else>
                  {{ pkgInfo[pkgChild.valueKey] }}
                </template>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </ContentWrap>
  <DeliveryOrderForm ref="deliveryOrderFormRef" @success="getDetail" />
  <OrderRemarksForm ref="orderRemarksFormRef" @success="getDetail" />
</template>
<script lang="ts" setup>
import * as TradeOrderApi from '@/api/mall/trade/order'
import { formatToFraction } from '@/utils'
import { DICT_TYPE } from '@/utils/dict'
import OrderRemarksForm from '@/views/mall/trade/order/OrderRemarksForm.vue'
import DeliveryOrderForm from '@/views/mall/trade/order/DeliveryOrderForm.vue'

defineOptions({ name: 'TradeOrderDetailForm' })

const message = useMessage() // 消息弹窗
const { params } = useRoute() // 查询参数
const orderInfo = ref<TradeOrderApi.OrderVO>({
  no: '',
  createTime: null,
  type: null,
  terminal: null,
  userId: null,
  userIp: '',
  userRemark: '',
  status: null,
  productCount: null,
  finishTime: null,
  cancelTime: null,
  cancelType: null,
  remark: '',
  payOrderId: null,
  payed: false,
  payTime: null,
  payChannelCode: '',
  originalPrice: null,
  orderPrice: null,
  discountPrice: null,
  deliveryPrice: null,
  adjustPrice: null,
  payPrice: null,
  deliveryTemplateId: null,
  logisticsId: null,
  logisticsNo: '',
  deliveryStatus: null,
  deliveryTime: null,
  receiveTime: null,
  receiverName: '',
  receiverMobile: '',
  receiverAreaId: null,
  receiverPostCode: null,
  receiverDetailAddress: '',
  afterSaleStatus: null,
  refundPrice: null,
  couponPrice: null,
  pointPrice: null,
  receiverAreaName: '',
  items: [],
  user: {}
})

const detailGroups = ref([
  {
    title: '物流信息',
    key: 'expressInfo',
    children: [
      { label: '发货时间: ', valueKey: 'fhsj' },
      { label: '物流公司: ', valueKey: 'wlgs' },
      { label: '运单号: ', valueKey: 'ydh' },
      { label: '物流状态: ', valueKey: 'wlzt', childProps: { span: 3 } },
      { label: '物流详情: ', valueKey: 'wlxq' }
    ]
  },
  {
    title: '订单操作日志',
    key: 'orderLog'
  }
])

const detailInfo = ref({
  expressInfo:
    // 物流信息
    {
      label: '包裹1',
      name: 'bg1',
      fhsj: '2022-11-03 16:50:45',
      wlgs: '极兔',
      ydh: '2132123',
      wlzt: '不支持此快递公司',
      wlxq: [
        {
          content: '正在派送途中,请您准备签收(派件人:王涛,电话:13854563814)',
          timestamp: '2018-04-15 15:00:16'
        },
        {
          content: '快件到达 【烟台龙口东江村委营业点】',
          timestamp: '2018-04-13 14:54:19'
        },
        {
          content: '快件已发车',
          timestamp: '2018-04-11 12:55:52'
        },
        {
          content: '快件已发车',
          timestamp: '2018-04-11 12:55:52'
        },
        {
          content: '快件已发车',
          timestamp: '2018-04-11 12:55:52'
        }
      ]
    },
  orderLog: [
    // 订单操作日志
    {
      content: '买家【乌鸦】关闭了订单',
      timestamp: '2018-04-15 15:00:16'
    },
    {
      content: '买家【乌鸦】下单了',
      timestamp: '2018-04-15 15:00:16'
    }
  ],
  goodsInfo: [] // 商品详情tableData
})

const deliveryOrderFormRef = ref() // 发货表单 Ref
const orderRemarksFormRef = ref() // 订单备注表单 Ref

const openForm = (type: string) => {
  switch (type) {
    case 'remark':
      orderRemarksFormRef.value?.open(orderInfo)
      break
    case 'delivery':
      deliveryOrderFormRef.value?.open(orderInfo.id)
      break
  }
}

/** 获得详情 */
const getDetail = async () => {
  const id = params.orderId as unknown as number
  if (id) {
    const res = (await TradeOrderApi.getOrder(id)) as TradeOrderApi.OrderVO
    // TODO 测试使用
    res.user = {
      id: 247,
      nickname: '小妮子'
    }
    orderInfo.value = res
  }
}

onMounted(async () => {
  await getDetail()
})

const clipboardSuccess = () => {
  message.success('复制成功')
}
</script>
<style lang="scss" scoped>
:deep(.el-descriptions) {
  &:not(:nth-child(1)) {
    margin-top: 20px;
  }

  .el-descriptions__title {
    display: flex;
    align-items: center;

    &::before {
      display: inline-block;
      width: 3px;
      height: 20px;
      margin-right: 10px;
      background-color: #409eff;
      content: '';
    }
  }

  .el-descriptions-item__container {
    margin: 0 10px;

    .no-colon {
      margin: 0;

      &::after {
        content: '';
      }
    }
  }
}
</style>
