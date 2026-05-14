<!-- WMS 入库单打印 -->
<template>
  <div class="hidden">
    <button ref="printButtonRef" v-print="printObj" type="button"></button>
    <div id="wmsReceiptOrderPrint" class="color-#303133">
      <h2 class="text-center">入库单</h2>
      <div class="mb-12px grid grid-cols-3 gap-x-24px gap-y-8px text-14px">
        <div>入库单号：{{ printData.no || '-' }}</div>
        <div>
          入库类型：{{ getDictLabel(DICT_TYPE.WMS_RECEIPT_ORDER_TYPE, printData.type) || '-' }}
        </div>
        <div>仓库：{{ printData.warehouseName || '-' }}</div>
        <div>入库状态：{{ getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, printData.status) || '-' }}</div>
        <div>单据日期：{{ formatNullableDate(printData.orderTime, 'YYYY-MM-DD') }}</div>
        <div>供应商：{{ printData.merchantName || '-' }}</div>
        <div>业务单号：{{ printData.bizOrderNo || '-' }}</div>
        <div>总数量：{{ formatQuantity(printData.totalQuantity) || '-' }}</div>
        <div>总金额：{{ formatPrice(printData.totalPrice) || '-' }}</div>
        <div>创建时间：{{ formatNullableDate(printData.createTime) }}</div>
        <div class="col-span-3">备注：{{ printData.remark || '-' }}</div>
      </div>
      <table class="w-full border-collapse text-13px">
        <thead>
          <tr>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">商品信息</th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">规格信息</th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">数量</th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">单价(元)</th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">金额(元)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="detail in printRows" :key="detail.id">
            <td class="border border-solid border-#dcdfe6 p-8px">
              <div>{{ detail.itemName || '-' }}</div>
              <div v-if="detail.itemCode" class="text-12px">编号：{{ detail.itemCode }}</div>
            </td>
            <td class="border border-solid border-#dcdfe6 p-8px">
              <div>{{ detail.skuName || '-' }}</div>
              <div v-if="detail.skuCode" class="text-12px">编号：{{ detail.skuCode }}</div>
            </td>
            <td class="border border-solid border-#dcdfe6 p-8px text-right">
              {{ formatQuantity(detail.quantity) || '-' }}
            </td>
            <td class="border border-solid border-#dcdfe6 p-8px text-right">
              {{ formatPrice(detail.price) || '-' }}
            </td>
            <td class="border border-solid border-#dcdfe6 p-8px text-right">
              {{ formatPrice(detail.totalPrice) || '-' }}
            </td>
          </tr>
          <tr v-if="printRows.length">
            <td class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px" colspan="2">合计</td>
            <td class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-right">
              {{ formatSumQuantity(printRows, (detail) => detail.quantity) }}
            </td>
            <td class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-right">
              {{ formatSumPrice(printRows, (detail) => detail.price) }}
            </td>
            <td class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-right">
              {{ formatSumPrice(printRows, (detail) => detail.totalPrice) }}
            </td>
          </tr>
          <tr v-if="!printRows.length">
            <td
              class="border border-solid border-#dcdfe6 p-8px text-center"
              :colspan="tableColumnCount"
            >
              暂无明细
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatNullableDate } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { ReceiptOrderApi, ReceiptOrderVO } from '@/api/wms/order/receipt'
import { ReceiptOrderDetailVO } from '@/api/wms/order/receipt/detail'
import {
  formatPrice,
  formatQuantity,
  formatSumPrice,
  formatSumQuantity
} from '@/views/wms/utils/format'

/** WMS 入库单打印 */
defineOptions({ name: 'WmsReceiptOrderPrint' })

const printData = ref<ReceiptOrderVO>({}) // 打印数据
const printButtonRef = ref<HTMLButtonElement>() // 打印按钮
const tableColumnCount = 5
const printObj = ref({
  id: 'wmsReceiptOrderPrint',
  popTitle: '&nbsp',
  extraCss: '/print.css',
  extraHead: '',
  zIndex: 20003
})

interface PrintRow extends ReceiptOrderDetailVO {
  totalPrice?: number
}

const printRows = computed<PrintRow[]>(() =>
  (printData.value.details || []).map((detail) => ({
    ...detail,
    totalPrice:
      detail.price != null && detail.quantity
        ? Number((Number(detail.price) * Number(detail.quantity)).toFixed(2))
        : undefined
  }))
)

/** 打印入库单 */
const print = async (id: number) => {
  printData.value = await ReceiptOrderApi.getReceiptOrder(id)
  await nextTick()
  printButtonRef.value?.click()
}
defineExpose({ print })
</script>
