<template>
  <el-table-column class-name="order-table-col">
    <template #header>
      <!-- TODO @puhui999：小屏幕下，会有偏移，后续看看 -->
      <div class="flex items-center" style="width: 100%">
        <div class="ml-100px mr-200px">商品信息</div>
        <div class="mr-60px">单价(元)/数量</div>
        <div class="mr-60px">售后状态</div>
        <div class="mr-60px">实付金额(元)</div>
        <div class="mr-60px">买家/收货人</div>
        <div class="mr-60px">配送方式</div>
        <div class="mr-60px">订单状态</div>
        <div class="mr-60px">操作</div>
      </div>
    </template>
    <template #default="scope">
      <el-table
        :border="true"
        :data="scope.row.items"
        :header-cell-style="headerStyle"
        :span-method="spanMethod"
        style="width: 100%"
      >
        <el-table-column class-name="table-col-1" min-width="300" prop="spuName">
          <template #header>
            <div
              class="flex items-center"
              style="width: 100%; height: 35px; background-color: #f7f7f7"
            >
              <span class="mr-20px">订单号：{{ scope.row.no }} </span>
              <span class="mr-20px">下单时间：{{ formatDate(scope.row.createTime) }}</span>
              <span>订单来源：</span>
              <dict-tag :type="DICT_TYPE.TERMINAL" :value="scope.row.terminal" class="mr-20px" />
              <span>支付方式：</span>
              <dict-tag
                v-if="scope.row.payChannelCode"
                :type="DICT_TYPE.PAY_CHANNEL_CODE"
                :value="scope.row.payChannelCode"
                class="mr-20px"
              />
              <span v-else class="mr-20px">未支付</span>
              <span v-if="scope.row.payTime" class="mr-20px">
                支付时间：{{ formatDate(scope.row.payTime) }}
              </span>
              <span>订单类型：</span>
              <dict-tag :type="DICT_TYPE.TRADE_ORDER_TYPE" :value="scope.row.type" />
            </div>
          </template>
          <template #default="{ row }">
            <div class="flex items-center">
              <el-image
                :src="row.picUrl"
                class="mr-10px h-30px w-30px"
                @click="imagePreview(row.picUrl)"
              />
              <span class="mr-10px">{{ row.spuName }}</span>
              <el-tag v-for="property in row.properties" :key="property.propertyId" class="mr-10px">
                {{ property.propertyName }}: {{ property.valueName }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column class-name="table-col-2" label="商品原价*数量" prop="price" width="150">
          <template #default="{ row }">
            {{ floatToFixed2(row.price) }} 元 / {{ row.count }}
          </template>
        </el-table-column>
        <el-table-column
          class-name="table-col-3"
          label="售后状态"
          prop="afterSaleStatus"
          width="120"
        >
          <template #default="{ row }">
            <dict-tag
              :type="DICT_TYPE.TRADE_ORDER_ITEM_AFTER_SALE_STATUS"
              :value="row.afterSaleStatus"
            />
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          class-name="table-col-4"
          label="实际支付"
          min-width="120"
          prop="payPrice"
        >
          <template #default>
            {{ floatToFixed2(scope.row.payPrice) + '元' }}
          </template>
        </el-table-column>
        <el-table-column class-name="table-col-5" label="买家/收货人" min-width="160">
          <template #default>
            <!-- 快递发货  -->
            <div
              v-if="scope.row.deliveryType === DeliveryTypeEnum.EXPRESS.type"
              class="flex flex-col"
            >
              <span>买家：{{ scope.row.user.nickname }}</span>
              <span>
                收货人：{{ scope.row.receiverName }} {{ scope.row.receiverMobile }}
                {{ scope.row.receiverAreaName }} {{ scope.row.receiverDetailAddress }}
              </span>
            </div>
            <!-- 自提  -->
            <div
              v-if="scope.row.deliveryType === DeliveryTypeEnum.PICK_UP.type"
              class="flex flex-col"
            >
              <span>
                门店名称：
                {{ pickUpStoreList.find((p) => p.id === scope.row.pickUpStoreId)?.name }}
              </span>
              <span>
                门店手机：
                {{ pickUpStoreList.find((p) => p.id === scope.row.pickUpStoreId)?.phone }}
              </span>
              <span>
                自提门店:
                {{ pickUpStoreList.find((p) => p.id === scope.row.pickUpStoreId)?.detailAddress }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column align="center" class-name="table-col-6" label="配送方式" width="120">
          <template #default>
            <dict-tag :type="DICT_TYPE.TRADE_DELIVERY_TYPE" :value="scope.row.deliveryType" />
          </template>
        </el-table-column>
        <el-table-column align="center" class-name="table-col-7" label="订单状态" width="120">
          <template #default>
            <dict-tag :type="DICT_TYPE.TRADE_ORDER_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          class-name="table-col-8"
          fixed="right"
          label="操作"
          width="160"
        >
          <template #default>
            <slot :row="scope.row"></slot>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </el-table-column>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { DeliveryTypeEnum } from '@/utils/constants'
import { formatDate } from '@/utils/formatTime'
import { floatToFixed2 } from '@/utils'
import * as TradeOrderApi from '@/api/mall/trade/order'
import { OrderVO } from '@/api/mall/trade/order'
import { TableColumnCtx } from 'element-plus'
import { createImageViewer } from '@/components/ImageViewer'
import type { DeliveryPickUpStoreVO } from '@/api/mall/trade/delivery/pickUpStore'

defineOptions({ name: 'OrderTableColumn' })

const props = defineProps<{
  list: OrderVO[]
  pickUpStoreList: DeliveryPickUpStoreVO[]
}>()

const headerStyle = ({ row, columnIndex }: any) => {
  // 表头第一行第一列占 8
  if (columnIndex === 0) {
    row[columnIndex].colSpan = 8
  } else {
    // 其余的不要
    row[columnIndex].colSpan = 0
    return {
      display: 'none'
    }
  }
}

interface SpanMethodProps {
  row: TradeOrderApi.OrderItemRespVO
  column: TableColumnCtx<TradeOrderApi.OrderItemRespVO>
  rowIndex: number
  columnIndex: number
}

type spanMethodResp = number[] | { rowspan: number; colspan: number } | undefined
const spanMethod = ({ row, rowIndex, columnIndex }: SpanMethodProps): spanMethodResp => {
  const len = props.list.find(
    (order) => order.items?.findIndex((item) => item.id === row.id) !== -1
  )?.items?.length
  // 要合并的列，从零开始
  const colIndex = [3, 4, 5, 6, 7]
  if (colIndex.includes(columnIndex)) {
    // 除了第一行其余的不要
    if (rowIndex !== 0) {
      return {
        rowspan: 0,
        colspan: 0
      }
    }
    // 动态合并行
    return {
      rowspan: len!,
      colspan: 1
    }
  }
}

/** 商品图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}
</script>
<style lang="scss" scoped>
:deep(.order-table-col > .cell) {
  padding: 0;
}
</style>
