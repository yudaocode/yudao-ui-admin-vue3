<template>
  <ContentWrap>
    <!-- 订单信息 -->
    <el-descriptions title="订单信息">
      <el-descriptions-item label="订单号: ">{{ formData.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="配送方式: ">
        <dict-tag :type="DICT_TYPE.TRADE_DELIVERY_TYPE" :value="formData.order.deliveryType" />
      </el-descriptions-item>
      <!-- TODO 营销活动待实现 -->
      <el-descriptions-item label="订单类型: ">
        <dict-tag :type="DICT_TYPE.TRADE_ORDER_TYPE" :value="formData.order.type" />
      </el-descriptions-item>
      <el-descriptions-item label="收货人: ">
        {{ formData.order.receiverName }}
      </el-descriptions-item>
      <el-descriptions-item label="买家留言: ">
        {{ formData.order.userRemark }}
      </el-descriptions-item>
      <el-descriptions-item label="订单来源: ">
        <dict-tag :type="DICT_TYPE.TERMINAL" :value="formData.order.terminal" />
      </el-descriptions-item>
      <el-descriptions-item label="联系电话: ">
        {{ formData.order.receiverMobile }}
      </el-descriptions-item>
      <el-descriptions-item label="商家备注: ">{{ formData.order.remark }}</el-descriptions-item>
      <el-descriptions-item label="支付单号: ">
        {{ formData.order.payOrderId }}
      </el-descriptions-item>
      <el-descriptions-item label="付款方式: ">
        <dict-tag :type="DICT_TYPE.PAY_CHANNEL_CODE" :value="formData.order.payChannelCode" />
      </el-descriptions-item>
      <!-- TODO 芋艿：待实现：跳转会员 -->
      <!-- <el-descriptions-item label="买家: ">{{ formData.user.nickname }}</el-descriptions-item> -->
    </el-descriptions>

    <!-- 售后信息 -->
    <el-descriptions title="售后信息">
      <el-descriptions-item label="退款编号: ">{{ formData.no }}</el-descriptions-item>
      <el-descriptions-item label="申请时间: ">
        {{ formatDate(formData.auditTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="售后类型: ">
        <dict-tag :type="DICT_TYPE.TRADE_AFTER_SALE_TYPE" :value="formData.type" />
      </el-descriptions-item>
      <el-descriptions-item label="售后方式: ">
        <dict-tag :type="DICT_TYPE.TRADE_AFTER_SALE_WAY" :value="formData.way" />
      </el-descriptions-item>
      <el-descriptions-item label="退款金额: ">
        {{ floatToFixed2(formData.refundPrice) }}
      </el-descriptions-item>
      <el-descriptions-item label="退款原因: ">{{ formData.applyReason }}</el-descriptions-item>
      <el-descriptions-item label="补充描述: ">
        {{ formData.applyDescription }}
      </el-descriptions-item>
      <el-descriptions-item label="凭证图片: ">
        <el-image
          v-for="(item, index) in formData.applyPicUrls"
          :key="index"
          :src="item.url"
          class="w-60px h-60px mr-10px"
          @click="imagePreview(formData.applyPicUrls)"
        />
      </el-descriptions-item>
    </el-descriptions>

    <!-- 退款状态 -->
    <el-descriptions :column="1" title="退款状态">
      <el-descriptions-item label="退款状态: ">
        <dict-tag :type="DICT_TYPE.TRADE_AFTER_SALE_STATUS" :value="formData.status" />
      </el-descriptions-item>
      <el-descriptions-item label-class-name="no-colon">
        <el-button v-if="formData.status === 10" type="primary" @click="agree">同意售后</el-button>
        <el-button v-if="formData.status === 10" type="primary" @click="disagree">
          拒绝售后
        </el-button>
        <el-button v-if="formData.status === 30" type="primary" @click="receive">
          确认收货
        </el-button>
        <el-button v-if="formData.status === 30" type="primary" @click="refuse">拒绝收货</el-button>
        <el-button v-if="formData.status === 40" type="primary" @click="refund">确认退款</el-button>
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
    <el-descriptions title="售后日志">
      <el-descriptions-item labelClassName="no-colon">
        <el-timeline>
          <el-timeline-item
            v-for="saleLog in formData.afterSaleLog"
            :key="saleLog.id"
            :timestamp="formatDate(saleLog.createTime)"
            placement="top"
          >
            <el-card>
              <span>用户类型：</span>
              <dict-tag :type="DICT_TYPE.USER_TYPE" :value="saleLog.userType" class="mr-10px" />
              <span>售后状态(之前)：</span>
              <dict-tag
                :type="DICT_TYPE.TRADE_AFTER_SALE_STATUS"
                :value="saleLog.beforeStatus"
                class="mr-10px"
              />
              <span>售后状态(之后)：</span>
              <dict-tag
                :type="DICT_TYPE.TRADE_AFTER_SALE_STATUS"
                :value="saleLog.afterStatus"
                class="mr-10px"
              />
              <span>操作明细：{{ saleLog.content }}</span>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>

  <!-- 各种操作的弹窗 -->
  <UpdateAuditReasonForm ref="updateAuditReasonFormRef" @success="getDetail" />
</template>
<script lang="ts" setup>
import * as AfterSaleApi from '@/api/mall/trade/afterSale/index'
import { floatToFixed2 } from '@/utils'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import UpdateAuditReasonForm from '@/views/mall/trade/afterSale/form/AfterSaleDisagreeForm.vue'
import { createImageViewer } from '@/components/ImageViewer'
import { isArray } from '@/utils/is'

defineOptions({ name: 'TradeAfterSaleDetail' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const { params } = useRoute() // 查询参数
const formData = ref({
  order: {},
  afterSaleLog: []
})
const updateAuditReasonFormRef = ref() // 拒绝售后表单 Ref

/** 获得详情 */
const getDetail = async () => {
  const id = params.orderId as unknown as number
  if (id) {
    formData.value = await AfterSaleApi.getAfterSale(id)
  }
}

/** 同意售后 */
const agree = () => {
  message.confirm('是否同意售后？').then(() => {
    AfterSaleApi.agree(formData.value.id)
    message.success(t('common.success'))
    getDetail()
  })
}

/** 拒绝售后 */
const disagree = () => {
  updateAuditReasonFormRef.value?.open(formData.value)
}

/** 确认收货 */
const receive = () => {
  message.confirm('是否确认收货？').then(() => {
    AfterSaleApi.receive(formData.value.id)
    message.success(t('common.success'))
    getDetail()
  })
}

/** 拒绝收货 */
const refuse = () => {
  message.confirm('是否拒绝收货？').then(() => {
    AfterSaleApi.refuse(formData.value.id)
    message.success(t('common.success'))
    getDetail()
  })
}

/** 确认退款 */
const refund = () => {
  message.confirm('是否确认退款？').then(() => {
    AfterSaleApi.refund(formData.value.id)
    message.success(t('common.success'))
    getDetail()
  })
}

/** 图片预览 */
const imagePreview = (args) => {
  const urlList = []
  if (isArray(args)) {
    args.forEach((item) => {
      urlList.push(item.url)
    })
  } else {
    urlList.push(args)
  }
  createImageViewer({
    urlList
  })
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
