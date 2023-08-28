<template>
  <ContentWrap>
    <!-- 订单信息 -->
    <el-descriptions title="退款订单信息">
      <el-descriptions-item label="订单号: ">{{ orderInfo.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="配送方式: ">
        <dict-tag :type="DICT_TYPE.TRADE_DELIVERY_TYPE" :value="orderInfo.order.deliveryType" />
      </el-descriptions-item>
      <el-descriptions-item label="订单类型: ">
        <dict-tag :type="DICT_TYPE.TRADE_ORDER_TYPE" :value="orderInfo.order.type" />
      </el-descriptions-item>
      <el-descriptions-item label="收货人: ">
        {{ orderInfo.order.receiverName }}
      </el-descriptions-item>
      <el-descriptions-item label="买家留言: ">
        {{ orderInfo.order.userRemark }}
      </el-descriptions-item>
      <el-descriptions-item label="订单来源: ">
        <dict-tag :type="DICT_TYPE.TERMINAL" :value="orderInfo.order.terminal" />
      </el-descriptions-item>
      <el-descriptions-item label="联系电话: ">
        {{ orderInfo.order.receiverMobile }}
      </el-descriptions-item>
      <el-descriptions-item label="商家备注: ">{{ orderInfo.order.remark }}</el-descriptions-item>
      <el-descriptions-item label="支付单号: ">
        {{ orderInfo.order.payOrderId }}
      </el-descriptions-item>
      <el-descriptions-item label="付款方式: ">
        <dict-tag :type="DICT_TYPE.PAY_CHANNEL_CODE" :value="orderInfo.order.payChannelCode" />
      </el-descriptions-item>
      <!-- TODO 芋艿：待实现：跳转会员 -->
      <!-- <el-descriptions-item label="买家: ">{{ orderInfo.user.nickname }}</el-descriptions-item> -->
    </el-descriptions>

    <!-- 售后信息 -->
    <el-descriptions title="售后信息">
      <el-descriptions-item label="退款编号: ">{{ orderInfo.no }}</el-descriptions-item>
      <el-descriptions-item label="申请时间: ">
        {{ formatDate(orderInfo.auditTime) }}
      </el-descriptions-item>
      <!-- TODO 营销活动待实现     -->
      <el-descriptions-item label="售后类型: ">
        <dict-tag :type="DICT_TYPE.TRADE_AFTER_SALE_TYPE" :value="orderInfo.type" />
      </el-descriptions-item>
      <el-descriptions-item label="售后方式: ">
        <dict-tag :type="DICT_TYPE.TRADE_AFTER_SALE_WAY" :value="orderInfo.way" />
      </el-descriptions-item>
      <el-descriptions-item label="退款金额: ">{{ orderInfo.refundPrice }}</el-descriptions-item>
      <el-descriptions-item label="退款原因: ">{{ orderInfo.applyReason }}</el-descriptions-item>
      <el-descriptions-item label="补充描述: ">
        {{ orderInfo.applyDescription }}
      </el-descriptions-item>
      <el-descriptions-item label="凭证图片: "> {{ orderInfo.applyPicUrls }}</el-descriptions-item>
    </el-descriptions>

    <!-- 退款状态 -->
    <el-descriptions :column="1" title="退款状态">
      <el-descriptions-item label="退款状态: ">
        <dict-tag :type="DICT_TYPE.TRADE_AFTER_SALE_STATUS" :value="orderInfo.status" />
      </el-descriptions-item>
      <el-descriptions-item label-class-name="no-colon">
        <el-button type="primary" @click="openForm('agree')">同意售后</el-button>
        <el-button type="primary" @click="openForm('disagree')">拒绝售后</el-button>
        <el-button type="primary" @click="openForm('receive')">确认收货</el-button>
        <el-button type="primary" @click="openForm('refuse')">拒绝收货</el-button>
        <el-button type="primary" @click="openForm('refund')">确认退款</el-button>
        <el-button type="primary" @click="openForm('update-refunded')">
          更新售后订单为已退款
        </el-button>
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label><span style="color: red">提醒: </span></template>
        如果未发货，请点击同意退款给买家。<br />
        如果实际已发货，请主动与买家联系。<br />
        如果订单整体退款后，优惠券和余额会退还给买家.
      </el-descriptions-item>
    </el-descriptions>

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
    <!-- 售后信息 -->
    <el-descriptions title="售后日志" />
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as AfterSaleApi from '@/api/mall/trade/afterSale/index'
import { floatToFixed2 } from '@/utils'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'TradeOrderDetailForm' })

const { params } = useRoute() // 查询参数
const orderInfo = ref({
  order: {}
})
/** 获得详情 */
const getDetail = async () => {
  const id = params.orderId as unknown as number
  if (id) {
    const res = (await AfterSaleApi.getAfterSale(id)) as AfterSaleApi.TradeAfterSaleVO
    orderInfo.value = res
  }
}
const openForm = (type: string) => {
  switch (type) {
    case 'agree':
      break
    case 'disagree':
      break
    case 'receive':
      break
    case 'refuse':
      break
    case 'refund':
      break
    case 'update-refunded':
      break
  }
}
onMounted(async () => {
  await getDetail()
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
</style>
