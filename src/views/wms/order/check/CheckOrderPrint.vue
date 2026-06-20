<!-- WMS 盘库单打印 -->
<template>
  <div class="hidden">
    <button ref="printButtonRef" v-print="printObj" type="button"></button>
    <div id="wmsCheckOrderPrint" class="color-#303133">
      <div class="relative mb-8px">
        <h2 class="text-center">盘库单</h2>
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
        <div>盘库单号：{{ printData.no || '-' }}</div>
        <div>仓库：{{ printData.warehouseName || '-' }}</div>
        <div>盘库状态：{{ getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, printData.status) || '-' }}</div>
        <div>单据日期：{{ formatNullableDate(printData.orderTime, 'YYYY-MM-DD') }}</div>
        <div>
          盈亏数量：<span :class="getLossClass(printData.totalQuantity)">
            {{ formatQuantity(printData.totalQuantity) || '-' }}
          </span>
        </div>
        <div>总金额：{{ formatPrice(printData.totalPrice) || '-' }}</div>
        <div>实际金额：{{ formatPrice(printData.actualPrice) || '-' }}</div>
        <div>
          实际盈亏金额：<span :class="getLossClass(getOrderDifferencePrice(printData))">
            {{ formatPrice(getOrderDifferencePrice(printData)) || '-' }}
          </span>
        </div>
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
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">账面库存</th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">单价(元)</th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">实际库存</th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">
              实际金额(元)
            </th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">盈亏数</th>
            <th class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-left">
              实际盈亏金额(元)
            </th>
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
              {{ formatQuantity(detail.checkQuantity) || '-' }}
            </td>
            <td class="border border-solid border-#dcdfe6 p-8px text-right">
              {{ formatPrice(detail.actualPrice) || '-' }}
            </td>
            <td class="border border-solid border-#dcdfe6 p-8px text-right">
              <span :class="getLossClass(detail.differenceQuantity)">
                {{ formatQuantity(detail.differenceQuantity) || '-' }}
              </span>
            </td>
            <td class="border border-solid border-#dcdfe6 p-8px text-right">
              <span :class="getLossClass(detail.differencePrice)">
                {{ formatPrice(detail.differencePrice) || '-' }}
              </span>
            </td>
          </tr>
          <tr v-if="printRows.length">
            <td class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px" colspan="2">合计</td>
            <td class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-right">
              {{ formatSumQuantity(printRows, (detail) => detail.quantity) }}
            </td>
            <td class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-right"> </td>
            <td class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-right">
              {{ formatSumQuantity(printRows, (detail) => detail.checkQuantity) }}
            </td>
            <td class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-right">
              {{ formatSumPrice(printRows, (detail) => detail.actualPrice) }}
            </td>
            <td class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-right">
              <span :class="getLossClass(totalDifferenceQuantity)">
                {{ formatQuantity(totalDifferenceQuantity) }}
              </span>
            </td>
            <td class="border border-solid border-#dcdfe6 bg-#f5f7fa p-8px text-right">
              <span :class="getLossClass(totalDifferencePrice)">
                {{ formatPrice(totalDifferencePrice) }}
              </span>
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
import { CheckOrderApi, CheckOrderVO } from '@/api/wms/order/check'
import { CheckOrderDetailVO } from '@/api/wms/order/check/detail'
import Barcode from '@/views/mes/wm/barcode/components/Barcode.vue'
import { BarcodeFormatEnum } from '@/views/mes/utils/constants'
import {
  formatPrice,
  formatQuantity,
  formatSumPrice,
  formatSumQuantity,
  getLossClass,
  roundPrice,
  sumPrice,
  sumQuantity
} from '@/views/wms/utils/format'

/** WMS 盘库单打印 */
defineOptions({ name: 'WmsCheckOrderPrint' })

const printData = ref<CheckOrderVO>({}) // 打印数据
const printButtonRef = ref<HTMLButtonElement>() // 打印按钮
const tableColumnCount = 8
const printObj = ref({
  id: 'wmsCheckOrderPrint',
  popTitle: '&nbsp',
  extraCss: '/print.css',
  extraHead: '',
  zIndex: 20003
})

interface PrintRow extends CheckOrderDetailVO {
  actualPrice?: number
  differenceQuantity?: number
  differencePrice?: number
}

function getDifferenceQuantity(detail: CheckOrderDetailVO) {
  return Number(detail.checkQuantity || 0) - Number(detail.quantity || 0)
}

function getActualPrice(detail: CheckOrderDetailVO) {
  if (
    detail.checkQuantity === undefined ||
    detail.checkQuantity === null ||
    detail.price === undefined ||
    detail.price === null
  ) {
    return undefined
  }
  return roundPrice(Number(detail.checkQuantity) * Number(detail.price))
}
function getDifferencePrice(detail: CheckOrderDetailVO, differenceQuantity: number) {
  if (detail.price === undefined || detail.price === null) {
    return undefined
  }
  return roundPrice(differenceQuantity * Number(detail.price))
}
function getOrderDifferencePrice(order: CheckOrderVO) {
  return roundPrice(Number(order.actualPrice || 0) - Number(order.totalPrice || 0))
}
const printRows = computed<PrintRow[]>(() =>
  (printData.value.details || []).map((detail) => {
    const differenceQuantity = getDifferenceQuantity(detail)
    return {
      ...detail,
      actualPrice: getActualPrice(detail),
      differenceQuantity,
      differencePrice: getDifferencePrice(detail, differenceQuantity)
    }
  })
)
const totalDifferenceQuantity = computed(() =>
  sumQuantity(printRows.value, (detail) => detail.differenceQuantity)
)
const totalDifferencePrice = computed(() =>
  sumPrice(printRows.value, (detail) => detail.differencePrice)
)

/** 打印盘库单 */
const print = async (id: number) => {
  printData.value = await CheckOrderApi.getCheckOrder(id)
  await nextTick()
  printButtonRef.value?.click()
}
defineExpose({ print })
</script>
