<template>
  <el-table-column class-name="order-table-col">
    <template #header>
      <div class="flex items-center" style="width: 100%">
        <div :style="{ width: orderTableHeadWidthList[0] + 'px' }" class="flex justify-center">
          商品信息
        </div>
        <div :style="{ width: orderTableHeadWidthList[1] + 'px' }" class="flex justify-center">
          单价(元)/数量
        </div>
        <div :style="{ width: orderTableHeadWidthList[2] + 'px' }" class="flex justify-center">
          售后状态
        </div>
        <div :style="{ width: orderTableHeadWidthList[3] + 'px' }" class="flex justify-center">
          实付金额(元)
        </div>
        <div :style="{ width: orderTableHeadWidthList[4] + 'px' }" class="flex justify-center">
          买家/收货人
        </div>
        <div :style="{ width: orderTableHeadWidthList[5] + 'px' }" class="flex justify-center">
          配送方式
        </div>
        <div :style="{ width: orderTableHeadWidthList[6] + 'px' }" class="flex justify-center">
          订单状态
        </div>
        <div :style="{ width: orderTableHeadWidthList[7] + 'px' }" class="flex justify-center">
          操作
        </div>
      </div>
    </template>
    <template #default="scope">
      <el-table
        :ref="setOrderTableRef"
        :border="true"
        :data="scope.row.items"
        :header-cell-style="headerStyle"
        :span-method="spanMethod"
        style="width: 100%"
      >
        <el-table-column min-width="300" prop="spuName">
          <template #header>
            <div
              class="mr-[20px] h-[35px] flex items-center pl-[10px] pr-[10px]"
              style="background-color: var(--app-content-bg-color)"
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
            <div class="flex flex-wrap">
              <div class="mb-[10px] mr-[10px] flex items-start">
                <div class="mr-[10px]">
                  <el-image
                    :src="row.picUrl"
                    class="!h-[45px] !w-[45px]"
                    fit="contain"
                    @click="imagePreview(row.picUrl)"
                  >
                    <template #error>
                      <div class="image-slot">
                        <icon icon="ep:picture" />
                      </div>
                    </template>
                  </el-image>
                </div>
                <ElTooltip :content="row.spuName" placement="top">
                  <span class="overflow-ellipsis max-h-[45px] overflow-hidden">
                    {{ row.spuName }}
                  </span>
                </ElTooltip>
              </div>
              <el-tag
                v-for="property in row.properties"
                :key="property.propertyId"
                class="mb-[10px] mr-[10px]"
              >
                {{ property.propertyName }}: {{ property.valueName }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品原价*数量" prop="price" width="150">
          <template #default="{ row }">
            {{ floatToFixed2(row.price) }} 元 / {{ row.count }}
          </template>
        </el-table-column>
        <el-table-column label="售后状态" prop="afterSaleStatus" width="120">
          <template #default="{ row }">
            <dict-tag
              :type="DICT_TYPE.TRADE_ORDER_ITEM_AFTER_SALE_STATUS"
              :value="row.afterSaleStatus"
            />
          </template>
        </el-table-column>
        <el-table-column align="center" label="实际支付" min-width="120" prop="payPrice">
          <template #default>
            {{ floatToFixed2(scope.row.payPrice) + '元' }}
          </template>
        </el-table-column>
        <el-table-column label="买家/收货人" min-width="160">
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
        <el-table-column align="center" label="配送方式" width="120">
          <template #default>
            <dict-tag :type="DICT_TYPE.TRADE_DELIVERY_TYPE" :value="scope.row.deliveryType" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="订单状态" width="120">
          <template #default>
            <dict-tag :type="DICT_TYPE.TRADE_ORDER_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column align="center" fixed="right" label="操作" width="160">
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
import type { TableColumnCtx, TableInstance } from 'element-plus'
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

/** 解决 ref 在 v-for 中的获取问题*/
const setOrderTableRef = (el: TableInstance) => {
  if (!el) return
  // 只要第一个表也就是开始的第一行
  if (el.tableId !== 'el-table_2') {
    return
  }
  tableHeadWidthAuto(el)
}
// 头部 col 宽度初始化
const orderTableHeadWidthList = ref([300, 150, 120, 120, 160, 120, 120, 160])
// 头部宽度自适应
const tableHeadWidthAuto = (el: TableInstance) => {
  const columns = el.store.states.columns.value
  if (columns.length === 0) {
    return
  }
  columns.forEach((col: TableColumnCtx<TableInstance>, index: number) => {
    if (col.realWidth) {
      orderTableHeadWidthList.value[index] = col.realWidth
    }
  })
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
