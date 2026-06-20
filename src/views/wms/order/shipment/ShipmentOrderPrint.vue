<!-- WMS 出库单打印 -->
<template>
  <div class="hidden">
    <button ref="printButtonRef" v-print="printObj" type="button"></button>
    <div id="wmsShipmentOrderPrint" class="color-#303133">
      <div class="relative mb-8px">
        <h2 class="text-center">出库单</h2>
        <div v-if="printData.no" class="absolute right-0 top-0">
          <Barcode
            :content="printData.no"
            :display-value="false"
            :format="BarcodeFormatEnum.CODE39"
            :height="40"
            :width="180"
          />
        </div>
      </div>
      <div class="mb-12px grid grid-cols-3 gap-x-24px gap-y-8px text-14px">
        <div>出库单号：{{ printData.no || '-' }}</div>
        <div>
          出库类型：{{ getDictLabel(DICT_TYPE.WMS_SHIPMENT_ORDER_TYPE, printData.type) || '-' }}
        </div>
        <div>仓库：{{ printData.warehouseName || '-' }}</div>
        <div>出库状态：{{ getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, printData.status) || '-' }}</div>
        <div>单据日期：{{ formatNullableDate(printData.orderTime, 'YYYY-MM-DD') }}</div>
        <div>客户：{{ printData.merchantName || '-' }}</div>
        <div>业务单号：{{ printData.bizOrderNo || '-' }}</div>
        <div>总数量：{{ formatQuantity(printData.totalQuantity) || '-' }}</div>
        <div>总金额：{{ formatPrice(printData.totalPrice) || '-' }}</div>
        <div class="col-span-3 grid grid-cols-2 gap-x-24px">
          <div>
            创建：{{ formatNullableDate(printData.createTime) }} /
            {{ printData.creatorName || printData.creator || '-' }}
          </div>
          <div>
            更新：{{ formatNullableDate(printData.updateTime) }} /
            {{ printData.updaterName || printData.updater || '-' }}
          </div>
        </div>
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
            <td class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-right"> </td>
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
import { ShipmentOrderApi, ShipmentOrderVO } from '@/api/wms/order/shipment'
import { ShipmentOrderDetailVO } from '@/api/wms/order/shipment/detail'
import {
  formatPrice,
  formatQuantity,
  formatSumPrice,
  formatSumQuantity,
  multiplyPrice
} from '@/views/wms/utils/format'
import Barcode from '@/views/mes/wm/barcode/components/Barcode.vue'
import { BarcodeFormatEnum } from '@/views/mes/utils/constants'

/** WMS 出库单打印 */
defineOptions({ name: 'WmsShipmentOrderPrint' })

const printData = ref<ShipmentOrderVO>({}) // 打印数据
const printButtonRef = ref<HTMLButtonElement>() // 打印按钮
const tableColumnCount = 5
const printObj = ref({
  id: 'wmsShipmentOrderPrint',
  popTitle: '&nbsp',
  extraCss: '/print.css',
  extraHead: '',
  zIndex: 20003
})

interface PrintRow extends ShipmentOrderDetailVO {
  totalPrice?: number
}

const printRows = computed<PrintRow[]>(() =>
  (printData.value.details || []).map((detail) => ({
    ...detail,
    totalPrice: detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price)
  }))
)

/** 打印出库单 */
const print = async (id: number) => {
  printData.value = await ShipmentOrderApi.getShipmentOrder(id)
  await nextTick()
  printButtonRef.value?.click()
}
defineExpose({ print })
</script>
