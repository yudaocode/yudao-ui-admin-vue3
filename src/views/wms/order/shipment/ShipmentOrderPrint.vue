<!-- WMS 出库单打印 -->
<template>
  <div class="hidden">
    <button ref="printButtonRef" v-print="printObj" type="button"></button>
    <div id="wmsShipmentOrderPrint" class="color-#303133">
      <h2 class="text-center">出库单</h2>
      <div class="mb-12px grid grid-cols-3 gap-x-24px gap-y-8px text-14px">
        <div>出库单号：{{ printData.no || '-' }}</div>
        <div>
          出库类型：{{ getDictLabel(DICT_TYPE.WMS_SHIPMENT_ORDER_TYPE, printData.type) || '-' }}
        </div>
        <div>出库状态：{{ getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, printData.status) || '-' }}</div>
        <div>客户：{{ printData.merchantName || '-' }}</div>
        <div>业务单号：{{ printData.bizOrderNo || '-' }}</div>
        <div>仓库：{{ printData.warehouseName || '-' }}</div>
        <div v-if="AREA_ENABLE">库区：{{ printData.areaName || '-' }}</div>
        <div>总数量：{{ formatQuantity(printData.totalQuantity) || '-' }}</div>
        <div>总金额：{{ formatPrice(printData.totalAmount) || '-' }}</div>
        <div>创建时间：{{ formatNullableDate(printData.createTime) }}</div>
        <div class="col-span-3">备注：{{ printData.remark || '-' }}</div>
      </div>
      <table class="w-full border-collapse text-13px">
        <thead>
          <tr>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">商品信息</th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">规格信息</th>
            <th
              v-if="AREA_ENABLE"
              class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left"
            >
              库区
            </th>
            <th
              v-if="BATCH_ENABLE"
              class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left"
            >
              批号
            </th>
            <th
              v-if="BATCH_ENABLE"
              class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left"
            >
              生产日期
            </th>
            <th
              v-if="BATCH_ENABLE"
              class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left"
            >
              过期日期
            </th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">数量</th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">金额(元)</th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="detail in printData.details || []" :key="detail.id">
            <td class="border border-solid border-#dcdfe6 p-8px">
              <div>{{ detail.itemName || '-' }}</div>
              <div v-if="detail.itemCode" class="text-12px">编号：{{ detail.itemCode }}</div>
            </td>
            <td class="border border-solid border-#dcdfe6 p-8px">
              <div>{{ detail.skuName || '-' }}</div>
              <div v-if="detail.skuCode" class="text-12px">编号：{{ detail.skuCode }}</div>
            </td>
            <td v-if="AREA_ENABLE" class="border border-solid border-#dcdfe6 p-8px">
              {{ detail.areaName || '-' }}
            </td>
            <td v-if="BATCH_ENABLE" class="border border-solid border-#dcdfe6 p-8px">
              {{ detail.batchNo || '-' }}
            </td>
            <td v-if="BATCH_ENABLE" class="border border-solid border-#dcdfe6 p-8px">
              {{ formatNullableDate(detail.productionDate, 'YYYY-MM-DD') }}
            </td>
            <td v-if="BATCH_ENABLE" class="border border-solid border-#dcdfe6 p-8px">
              {{ formatNullableDate(detail.expirationDate, 'YYYY-MM-DD') }}
            </td>
            <td class="border border-solid border-#dcdfe6 p-8px text-right">
              {{ formatQuantity(detail.quantity) || '-' }}
            </td>
            <td class="border border-solid border-#dcdfe6 p-8px text-right">
              {{ formatPrice(detail.amount) || '-' }}
            </td>
            <td class="border border-solid border-#dcdfe6 p-8px">{{ detail.remark || '-' }}</td>
          </tr>
          <tr v-if="!printData.details?.length">
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
import { AREA_ENABLE, BATCH_ENABLE } from '@/views/wms/utils/config'
import { formatPrice, formatQuantity } from '@/views/wms/utils/format'

/** WMS 出库单打印 */
defineOptions({ name: 'WmsShipmentOrderPrint' })

const printData = ref<ShipmentOrderVO>({}) // 打印数据
const printButtonRef = ref<HTMLButtonElement>() // 打印按钮
const tableColumnCount = computed(() => 5 + (AREA_ENABLE ? 1 : 0) + (BATCH_ENABLE ? 3 : 0))
const printObj = ref({
  id: 'wmsShipmentOrderPrint',
  popTitle: '&nbsp',
  extraCss: '/print.css',
  extraHead: '',
  zIndex: 20003
})

/** 打印出库单 */
const print = async (id: number) => {
  printData.value = await ShipmentOrderApi.getShipmentOrder(id)
  await nextTick()
  printButtonRef.value?.click()
}
defineExpose({ print })
</script>
