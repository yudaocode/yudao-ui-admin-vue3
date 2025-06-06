<template>
  <ContentWrap>
    <!-- 订单信息 -->
    <el-descriptions title="订单信息">
      <el-descriptions-item label="订单号: ">{{ formData.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="配送方式: ">
        <dict-tag :type="DICT_TYPE.TRADE_DELIVERY_TYPE" :value="formData.order.deliveryType" />
      </el-descriptions-item>
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
      <el-descriptions-item label="买家: ">{{ formData?.user?.nickname }}</el-descriptions-item>
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
        {{ fenToYuan(formData.refundPrice) }}
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
          class="mr-10px h-60px w-60px"
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
            <el-table v-if="formData.orderItem" :data="[formData.orderItem]" border>
              <el-table-column label="商品" prop="spuName" width="auto">
                <template #default="{ row }">
                  {{ row.spuName }}
                  <el-tag
                    v-for="property in row.properties"
                    :key="property.propertyId"
                    class="mr-10px"
                  >
                    {{ property.propertyName }}: {{ property.valueName }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="商品原价" prop="price" width="150">
                <template #default="{ row }">{{ fenToYuan(row.price) }} 元</template>
              </el-table-column>
              <el-table-column label="数量" prop="count" width="100" />
              <el-table-column label="合计" prop="payPrice" width="150">
                <template #default="{ row }">{{ fenToYuan(row.payPrice) }} 元</template>
              </el-table-column>
            </el-table>
          </el-col>
          <el-col :span="10" />
        </el-row>
      </el-descriptions-item>
    </el-descriptions>

    <!-- 操作日志 -->
    <el-descriptions title="售后日志">
      <el-descriptions-item labelClassName="no-colon">
        <el-timeline>
          <el-timeline-item
            v-for="saleLog in formData.logs"
            :key="saleLog.id"
            :timestamp="formatDate(saleLog.createTime)"
            placement="top"
          >
            <div class="el-timeline-right-content">
              <span>{{ saleLog.content }}</span>
            </div>
            <template #dot>
              <span
                :style="{ backgroundColor: getUserTypeColor(saleLog.userType) }"
                class="dot-node-style"
              >
                {{ getDictLabel(DICT_TYPE.USER_TYPE, saleLog.userType)[0] || '系' }}
              </span>
            </template>
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
import { fenToYuan } from '@/utils'
import { DICT_TYPE, getDictLabel, getDictObj } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import UpdateAuditReasonForm from '@/views/mall/trade/afterSale/form/AfterSaleDisagreeForm.vue'
import { createImageViewer } from '@/components/ImageViewer'
import { isArray } from '@/utils/is'
import { useTagsViewStore } from '@/store/modules/tagsView'

defineOptions({ name: 'TradeAfterSaleDetail' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const { params } = useRoute() // 查询参数
const { push, currentRoute } = useRouter() // 路由
const formData = ref({
  order: {},
  logs: []
})
const updateAuditReasonFormRef = ref() // 拒绝售后表单 Ref

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

/** 获得详情 */
const getDetail = async () => {
  const id = params.id as unknown as number
  if (id) {
    const res = await AfterSaleApi.getAfterSale(id)
    // 没有表单信息则关闭页面返回
    if (res == null) {
      message.notifyError('售后订单不存在')
      close()
    }
    formData.value = res
  }
}

/** 同意售后 */
const agree = async () => {
  try {
    // 二次确认
    await message.confirm('是否同意售后？')
    await AfterSaleApi.agree(formData.value.id)
    // 提示成功
    message.success(t('common.success'))
    await getDetail()
  } catch {}
}

/** 拒绝售后 */
const disagree = async () => {
  updateAuditReasonFormRef.value?.open(formData.value)
}

/** 确认收货 */
const receive = async () => {
  try {
    // 二次确认
    await message.confirm('是否确认收货？')
    await AfterSaleApi.receive(formData.value.id)
    // 提示成功
    message.success(t('common.success'))
    await getDetail()
  } catch {}
}

/** 拒绝收货 */
const refuse = async () => {
  try {
    // 二次确认
    await message.confirm('是否拒绝收货？')
    await AfterSaleApi.refuse(formData.value.id)
    // 提示成功
    message.success(t('common.success'))
    await getDetail()
  } catch {}
}

/** 确认退款 */
const refund = async () => {
  try {
    // 二次确认
    await message.confirm('是否确认退款？')
    await AfterSaleApi.refund(formData.value.id)
    // 提示成功
    message.success(t('common.success'))
    await getDetail()
  } catch {}
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
const { delView } = useTagsViewStore() // 视图操作
/** 关闭 tag */
const close = () => {
  delView(unref(currentRoute))
  push({ name: 'TradeAfterSale' })
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

// 时间线样式调整
:deep(.el-timeline) {
  margin: 10px 0 0 160px;

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
    background-color: var(--app-content-bg-color);

    &::before {
      position: absolute;
      top: 10px;
      left: 13px;
      border-color: transparent var(--app-content-bg-color) transparent transparent; /* 尖角颜色，左侧朝向 */
      border-style: solid;
      border-width: 8px; /* 调整尖角大小 */
      content: '';
    }
  }

  .dot-node-style {
    position: absolute;
    left: -5px;
    display: flex;
    width: 20px;
    height: 20px;
    font-size: 10px;
    color: #fff;
    border-radius: 50%;
    justify-content: center;
    align-items: center;
  }
}
</style>
