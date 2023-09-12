<template>
  <ContentWrap>
    <!-- 订单信息 -->
    <el-descriptions title="订单信息">
      <el-descriptions-item label="订单号: ">{{ formData.no }}</el-descriptions-item>
      <el-descriptions-item label="配送方式: ">
        <dict-tag :type="DICT_TYPE.TRADE_DELIVERY_TYPE" :value="formData.deliveryType!" />
      </el-descriptions-item>
      <!-- TODO 营销活动待实现     -->
      <el-descriptions-item label="营销活动: ">秒杀活动</el-descriptions-item>
      <el-descriptions-item label="订单类型: ">
        <dict-tag :type="DICT_TYPE.TRADE_ORDER_TYPE" :value="formData.type!" />
      </el-descriptions-item>
      <el-descriptions-item label="收货人: ">{{ formData.receiverName }}</el-descriptions-item>
      <el-descriptions-item label="买家留言: ">{{ formData.userRemark }}</el-descriptions-item>
      <el-descriptions-item label="订单来源: ">
        <dict-tag :type="DICT_TYPE.TERMINAL" :value="formData.terminal!" />
      </el-descriptions-item>
      <el-descriptions-item label="联系电话: ">{{ formData.receiverMobile }}</el-descriptions-item>
      <el-descriptions-item label="商家备注: ">{{ formData.remark }}</el-descriptions-item>
      <el-descriptions-item label="支付单号: ">{{ formData.payOrderId }}</el-descriptions-item>
      <el-descriptions-item label="付款方式: ">
        <dict-tag :type="DICT_TYPE.PAY_CHANNEL_CODE" :value="formData.payChannelCode!" />
      </el-descriptions-item>
      <!-- <el-descriptions-item label="买家: ">{{ formData.user.nickname }}</el-descriptions-item> -->
      <!-- TODO @puhui999：待实现：跳转会员 -->
      <el-descriptions-item label="收货地址: ">
        {{ formData.receiverAreaName }} {{ formData.receiverDetailAddress }}
        <el-link
          v-clipboard:copy="formData.receiverAreaName + ' ' + formData.receiverDetailAddress"
          v-clipboard:success="clipboardSuccess"
          icon="ep:document-copy"
          type="primary"
        />
      </el-descriptions-item>
    </el-descriptions>

    <!-- 订单状态 -->
    <el-descriptions :column="1" title="订单状态">
      <el-descriptions-item label="订单状态: ">
        <dict-tag :type="DICT_TYPE.TRADE_ORDER_STATUS" :value="formData.status!" />
      </el-descriptions-item>
      <el-descriptions-item label-class-name="no-colon">
        <el-button v-if="formData.status! === 0" type="primary" @click="updatePrice">
          调整价格
        </el-button>
        <el-button type="primary" @click="remark">备注</el-button>
        <el-button v-if="formData.status! === 10" type="primary" @click="delivery">
          发货
        </el-button>
        <el-button v-if="formData.status! === 10" type="primary" @click="updateAddress">
          修改地址
        </el-button>
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label><span style="color: red">提醒: </span></template>
        买家付款成功后，货款将直接进入您的商户号（微信、支付宝）<br />
        请及时关注你发出的包裹状态，确保可以配送至买家手中 <br />
        如果买家表示没收到货或货物有问题，请及时联系买家处理，友好协商
      </el-descriptions-item>
    </el-descriptions>

    <!-- 商品信息 -->
    <el-descriptions title="商品信息">
      <el-descriptions-item labelClassName="no-colon">
        <el-row :gutter="20">
          <el-col :span="15">
            <el-table :data="formData.items" border>
              <el-table-column label="商品" prop="spuName" width="auto">
                <template #default="{ row }">
                  {{ row.spuName }}
                  <el-tag v-for="property in row.properties" :key="property.propertyId">
                    {{ property.propertyName }}: {{ property.valueName }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="商品原价" prop="price" width="150">
                <template #default="{ row }">{{ floatToFixed2(row.price) }}元</template>
              </el-table-column>
              <el-table-column label="数量" prop="count" width="100" />
              <el-table-column label="合计" prop="payPrice" width="150">
                <template #default="{ row }">{{ floatToFixed2(row.payPrice) }}元</template>
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
    </el-descriptions>
    <el-descriptions :column="6">
      <el-descriptions-item label="商品总额: ">
        {{ floatToFixed2(formData.totalPrice!) }}元
      </el-descriptions-item>
      <el-descriptions-item label="运费金额: ">
        {{ floatToFixed2(formData.deliveryPrice!) }}元
      </el-descriptions-item>
      <el-descriptions-item label="订单调价: ">
        {{ floatToFixed2(formData.adjustPrice!) }}元
      </el-descriptions-item>

      <el-descriptions-item>
        <template #label><span style="color: red">商品优惠: </span></template>
        {{ floatToFixed2(formData.couponPrice!) }}元
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label><span style="color: red">订单优惠: </span></template>
        {{ floatToFixed2(formData.discountPrice!) }}元
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label><span style="color: red">积分抵扣: </span></template>
        {{ floatToFixed2(formData.pointPrice!) }}元
      </el-descriptions-item>

      <el-descriptions-item v-for="item in 5" :key="item" label-class-name="no-colon" />
      <!-- 占位 -->
      <el-descriptions-item label="应付金额: ">
        {{ floatToFixed2(formData.payPrice!) }}元
      </el-descriptions-item>
    </el-descriptions>

    <!-- TODO 芋艿：需要改改 -->
    <el-descriptions :column="4" title="物流信息">
      <el-descriptions-item label="物流公司: ">
        {{ deliveryExpressList.find((item) => item.id === formData.logisticsId)?.name }}
      </el-descriptions-item>
      <el-descriptions-item label="运单号: ">{{ formData.logisticsNo }}</el-descriptions-item>
      <el-descriptions-item label="发货时间: ">
        {{ formatDate(formData.deliveryTime!) }}
      </el-descriptions-item>
      <el-descriptions-item label="物流状态: ">
        <!-- TODO 物流状态怎么获取？ -->
        <dict-tag :type="DICT_TYPE.TRADE_ORDER_STATUS" :value="formData.deliveryStatus!" />
      </el-descriptions-item>
      <!-- 占位 4 -->
      <el-descriptions-item v-for="item in 4" :key="item" label-class-name="no-colon" />
      <el-descriptions-item label="物流详情: ">
        <el-timeline>
          <el-timeline-item
            v-for="(express, index) in expressTrackList"
            :key="index"
            :timestamp="formatDate(express.time)"
          >
            {{ express.content }}
          </el-timeline-item>
        </el-timeline>
      </el-descriptions-item>
    </el-descriptions>
    <el-descriptions title="订单操作日志">
      <el-descriptions-item labelClassName="no-colon">
        <el-timeline>
          <el-timeline-item
            v-for="(log, index) in formData.logs"
            :key="index"
            :timestamp="formatDate(log.createTime!)"
            placement="top"
          >
            <div class="el-timeline-right-content">
              {{ log.content }}
            </div>
            <template #dot>
              <span
                :style="{ backgroundColor: getUserTypeColor(log.userType!) }"
                class="dot-node-style"
              >
                {{ getDictLabel(DICT_TYPE.USER_TYPE, log.userType)[0] }}
              </span>
            </template>
          </el-timeline-item>
        </el-timeline>
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>

  <!-- 各种操作的弹窗 -->
  <OrderDeliveryForm ref="deliveryFormRef" @success="getDetail" />
  <OrderUpdateRemarkForm ref="updateRemarkForm" @success="getDetail" />
  <OrderUpdateAddressForm ref="updateAddressFormRef" @success="getDetail" />
  <OrderUpdatePriceForm ref="updatePriceFormRef" @success="getDetail" />
</template>
<script lang="ts" setup>
import * as TradeOrderApi from '@/api/mall/trade/order'
import { floatToFixed2 } from '@/utils'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel, getDictObj } from '@/utils/dict'
import OrderUpdateRemarkForm from '@/views/mall/trade/order/form/OrderUpdateRemarkForm.vue'
import OrderDeliveryForm from '@/views/mall/trade/order/form/OrderDeliveryForm.vue'
import OrderUpdateAddressForm from '@/views/mall/trade/order/form/OrderUpdateAddressForm.vue'
import OrderUpdatePriceForm from '@/views/mall/trade/order/form/OrderUpdatePriceForm.vue'
import * as DeliveryExpressApi from '@/api/mall/trade/delivery/express'
import { useTagsViewStore } from '@/store/modules/tagsView'

defineOptions({ name: 'TradeOrderDetail' })

const message = useMessage() // 消息弹窗

/** 获得 userType 颜色 */
const getUserTypeColor = (type: number) => {
  const dict = getDictObj(DICT_TYPE.USER_TYPE, type)
  switch (dict?.colorType) {
    case 'success':
      return '#67C23A'
    case 'info':
      return '#909399'
    case 'warning':
      return '#E6A23C'
    case 'danger':
      return '#F56C6C'
  }
  return '#409EFF'
}

// 订单详情
const formData = ref<TradeOrderApi.OrderVO>({
  logs: []
})

/** 各种操作 */
const updateRemarkForm = ref() // 订单备注表单 Ref
const remark = () => {
  updateRemarkForm.value?.open(formData.value)
}
const deliveryFormRef = ref() // 发货表单 Ref
const delivery = () => {
  deliveryFormRef.value?.open(formData.value)
}
const updateAddressFormRef = ref() // 收货地址表单 Ref
const updateAddress = () => {
  updateAddressFormRef.value?.open(formData.value)
}
const updatePriceFormRef = ref() // 订单调价表单 Ref
const updatePrice = () => {
  updatePriceFormRef.value?.open(formData.value)
}

/** 获得详情 */
const { params } = useRoute() // 查询参数
const getDetail = async () => {
  const id = params.orderId as unknown as number
  if (id) {
    const res = (await TradeOrderApi.getOrder(66666)) as TradeOrderApi.OrderVO
    // 没有表单信息则关闭页面返回
    if (res == null) {
      message.error('交易订单不存在')
      close()
    }
    formData.value = res
  }
}

/** 关闭 tag */
const { delView } = useTagsViewStore() // 视图操作
const { push, currentRoute } = useRouter() // 路由
const close = () => {
  delView(unref(currentRoute))
  push({ name: 'TradeOrder' })
}

/** 复制 */
const clipboardSuccess = () => {
  message.success('复制成功')
}

/** 初始化 **/
const deliveryExpressList = ref([]) // 物流公司
const expressTrackList = ref([]) // 物流详情
onMounted(async () => {
  await getDetail()
  deliveryExpressList.value = await DeliveryExpressApi.getSimpleDeliveryExpressList()
  expressTrackList.value = await TradeOrderApi.getExpressTrackList(formData.value.id!)
})
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

// 时间线样式调整
:deep(.el-timeline) {
  margin: 10px 0px 0px 160px;

  .el-timeline-item__wrapper {
    position: relative;
    top: -20px;

    .el-timeline-item__timestamp {
      position: absolute !important;
      top: 10px;
      left: -150px;
    }
  }

  .el-timeline-right-content {
    display: flex;
    align-items: center;
    min-height: 30px;
    padding: 10px;
    background-color: #f7f8fa;

    &::before {
      content: ''; /* 必须设置 content 属性 */
      position: absolute;
      top: 10px;
      left: 13px; /* 将伪元素水平居中 */
      border-width: 8px; /* 调整尖角大小 */
      border-style: solid;
      border-color: transparent #f7f8fa transparent transparent; /* 尖角颜色，左侧朝向 */
    }
  }

  .dot-node-style {
    width: 20px;
    height: 20px;
    position: absolute;
    left: -5px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    color: #fff;
    font-size: 10px;
  }
}
</style>
