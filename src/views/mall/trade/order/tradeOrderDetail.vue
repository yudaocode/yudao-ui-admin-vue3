<template>
  <ContentWrap>
    <!-- 订单信息 -->
    <el-descriptions title="订单信息">
      <el-descriptions-item label="订单号: ">{{ order.no }}</el-descriptions-item>
      <el-descriptions-item label="配送方式: ">物流配送</el-descriptions-item>
      <!-- TODO 芋艿：待实现 -->
      <el-descriptions-item label="营销活动: ">物流配送</el-descriptions-item>
      <!-- TODO 芋艿：待实现 -->
      <el-descriptions-item label="订单类型: ">
        <dict-tag :type="DICT_TYPE.TRADE_ORDER_TYPE" :value="order.type" />
      </el-descriptions-item>
      <el-descriptions-item label="收货人: ">{{ order.receiverName }}</el-descriptions-item>
      <el-descriptions-item label="买家留言: ">{{ order.userRemark }}</el-descriptions-item>
      <el-descriptions-item label="订单来源: ">
        <dict-tag :type="DICT_TYPE.TERMINAL" :value="order.terminal" />
      </el-descriptions-item>
      <el-descriptions-item label="联系电话: ">{{ order.receiverMobile }}</el-descriptions-item>
      <el-descriptions-item label="商家备注: ">{{ order.remark }}</el-descriptions-item>
      <el-descriptions-item label="支付单号: ">{{ order.payOrderId }}</el-descriptions-item>
      <el-descriptions-item label="付款方式: ">
        <dict-tag :type="DICT_TYPE.PAY_CHANNEL_CODE_TYPE" :value="order.payChannelCode" />
      </el-descriptions-item>
      <!-- <el-descriptions-item label="买家: ">{{ order.user.nickname }}</el-descriptions-item> -->
      <!-- TODO 芋艿：待实现：跳转会员 -->
      <el-descriptions-item label="收货地址: ">
        {{ order.receiverAreaName }} {{ order.receiverDetailAddress }}
        <el-link
          v-clipboard:copy="order.receiverAreaName + ' ' + order.receiverDetailAddress"
          v-clipboard:success="clipboardSuccess"
          icon="ep:document-copy"
          type="primary"
        />
      </el-descriptions-item>
    </el-descriptions>

    <!-- 订单状态 -->
    <el-descriptions title="订单状态" :column="1">
      <el-descriptions-item label="订单状态: ">
        <!-- TODO xiaobai：status 一定有值哈，不用判断 -->
        <dict-tag
          v-if="order.status !== ''"
          :type="DICT_TYPE.TRADE_ORDER_STATUS"
          :value="order.status"
        />
      </el-descriptions-item>
      <el-descriptions-item label-class-name="no-colon">
        <el-button type="primary" size="small">调整价格</el-button>
        <!-- TODO 芋艿：待实现 -->
        <el-button type="primary" size="small">备注</el-button>
        <!-- TODO 芋艿：待实现 -->
        <el-button type="primary" size="small">发货</el-button>
        <!-- TODO 芋艿：待实现 -->
        <el-button type="primary" size="small">关闭订单</el-button>
        <!-- TODO 芋艿：待实现 -->
        <el-button type="primary" size="small">修改地址</el-button>
        <!-- TODO 芋艿：待实现 -->
        <el-button type="primary" size="small">打印电子面单</el-button>
        <!-- TODO 芋艿：待实现 -->
        <el-button type="primary" size="small">打印发货单</el-button>
        <!-- TODO 芋艿：待实现 -->
        <el-button type="primary" size="small">确认收货</el-button>
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
            <el-table :data="order.items" border>
              <el-table-column prop="spuName" label="商品" width="auto">
                <template #default="{ row }">
                  {{ row.spuName }}
                  <el-tag
                    size="medium"
                    v-for="property in row.properties"
                    :key="property.propertyId"
                  >
                    {{ property.propertyName }}: {{ property.valueName }}</el-tag
                  >
                </template>
              </el-table-column>
              <el-table-column prop="price" label="商品原价(元)" width="150">
                <template #default="{ row }"> ￥{{ (row.price / 100.0).toFixed(2) }} </template>
              </el-table-column>
              <el-table-column prop="count" label="数量" width="100" />
              <el-table-column prop="payPrice" label="合计(元)" width="150">
                <template #default="{ row }"> ￥{{ (row.payPrice / 100.0).toFixed(2) }} </template>
              </el-table-column>
              <el-table-column prop="afterSaleStatus" label="售后状态" width="auto">
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
    <el-descriptions column="6">
      <el-descriptions-item label="商品总额: ">
        <!-- TODO xiaobai: 是不是 (item.payPrice / 100.0).toFixed(2) -->
        ￥{{ parseFloat((order.totalPrice / 100.0) as unknown as string).toFixed(2) }}
      </el-descriptions-item>
      <el-descriptions-item label="运费金额: ">
        ￥{{ parseFloat((order.deliveryPrice / 100.0) as unknown as string).toFixed(2) }}
      </el-descriptions-item>
      <el-descriptions-item label="订单调价: ">
        ￥{{
          parseFloat((order.adjustPrice / 100.0) as unknown as string).toFixed(2)
        }}</el-descriptions-item
      >

      <el-descriptions-item>
        <template #label><span style="color: red">商品优惠: </span></template>
        <!-- 没理解TODO  order.totalPrice - order.totalPrice -->
        ￥{{
          parseFloat(((order.totalPrice - order.totalPrice) / 100.0) as unknown as string).toFixed(
            2
          )
        }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label><span style="color: red">订单优惠: </span></template>
        ￥{{ parseFloat((order.discountPrice / 100.0) as unknown as string).toFixed(2) }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label><span style="color: red">积分抵扣: </span></template>
        ￥{{ parseFloat((order.pointPrice / 100.0) as unknown as string).toFixed(2) }}
      </el-descriptions-item>

      <el-descriptions-item v-for="item in 5" label-class-name="no-colon" :key="item" />
      <!-- 占位 -->
      <el-descriptions-item label="应付金额: ">
        ￥{{ (order.payPrice / 100.0).toFixed(2) }}
      </el-descriptions-item>
    </el-descriptions>

    <!-- TODO 芋艿：需要改改 -->
    <div v-for="group in detailGroups" :key="group.title">
      <el-descriptions v-bind="group.groupProps" :title="group.title">
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
                v-bind="pkgChild.childProps"
                :key="`pkgChild_${pkgCIdx}`"
                :label="pkgChild.label"
              >
                <!-- 包裹商品列表 -->
                <template v-if="pkgChild.valueKey === 'goodsList' && pkgInfo[pkgChild.valueKey]">
                  <div
                    v-for="(goodInfo, goodInfoIdx) in pkgInfo[pkgChild.valueKey]"
                    :key="`goodInfo_${goodInfoIdx}`"
                    style="display: flex"
                  >
                    <el-image
                      style="width: 100px; height: 100px; flex: none"
                      :src="goodInfo.imgUrl"
                    />
                    <el-descriptions :column="1">
                      <el-descriptions-item labelClassName="no-colon">{{
                        goodInfo.name
                      }}</el-descriptions-item>
                      <el-descriptions-item label="数量">{{ goodInfo.count }}</el-descriptions-item>
                    </el-descriptions>
                  </div>
                </template>

                <!-- 包裹物流详情 -->
                <template v-else-if="pkgChild.valueKey === 'wlxq'">
                  <el-row :gutter="10">
                    <el-col :span="6" :offset="1">
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
</template>
<script lang="ts" name="TradeOrderDetail" setup>
// TODO @xiaobai：在 order 下创建一个 order/detail，然后改名为 index.vue
import { DICT_TYPE } from '@/utils/dict'
import * as TradeOrderApi from '@/api/mall/trade/order'
const message = useMessage() // 消息弹窗

const { query } = useRoute()
const queryParams = reactive({
  id: query.id
})
const dialogVisible = ref(false)
const loading = ref(false)
const order = ref<any>({
  items: [],
  user: {}
}) // 详情数据

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
// 暂考虑一次性加载详情页面所有数据 TODO
const getlist = async () => {
  dialogVisible.value = true
  loading.value = true
  try {
    const res = await TradeOrderApi.getOrderDetail(queryParams.id as unknown as number)
    order.value = res
    console.log(order)
  } catch {
    message.error('获取详情数据失败')
  } finally {
    loading.value = false
  }
}
onMounted(async () => {
  await getlist()
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
