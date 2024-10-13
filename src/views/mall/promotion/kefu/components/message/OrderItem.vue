<template>
  <div v-if="isObject(getMessageContent)">
    <div :key="getMessageContent.id" class="order-list-card-box mt-14px">
      <div class="order-card-header flex items-center justify-between p-x-5px">
        <div class="order-no">
          订单号：
          <span style="cursor: pointer" @click="openDetail(getMessageContent.id)">
            {{ getMessageContent.no }}
          </span>
        </div>
        <div :class="formatOrderColor(getMessageContent)" class="order-state font-16">
          {{ formatOrderStatus(getMessageContent) }}
        </div>
      </div>
      <div v-for="item in getMessageContent.items" :key="item.id" class="border-bottom">
        <ProductItem
          :spu-id="item.spuId"
          :num="item.count"
          :picUrl="item.picUrl"
          :price="item.price"
          :skuText="item.properties.map((property: any) => property.valueName).join(' ')"
          :title="item.spuName"
        />
      </div>
      <div class="pay-box flex justify-end pr-5px">
        <div class="flex items-center">
          <div class="discounts-title pay-color"
            >共 {{ getMessageContent?.productCount }} 件商品,总金额:
          </div>
          <div class="discounts-money pay-color">
            ￥{{ fenToYuan(getMessageContent?.payPrice) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { fenToYuan, jsonParse } from '@/utils'
import { KeFuMessageRespVO } from '@/api/mall/promotion/kefu/message'
import { isObject } from '@/utils/is'
import ProductItem from '@/views/mall/promotion/kefu/components/message/ProductItem.vue'

const { push } = useRouter()

defineOptions({ name: 'OrderItem' })
const props = defineProps<{
  message?: KeFuMessageRespVO
  order?: any
}>()

const getMessageContent = computed(() =>
  typeof props.message !== 'undefined' ? jsonParse(props!.message!.content) : props.order
)

/** 查看订单详情 */
const openDetail = (id: number) => {
  console.log(getMessageContent)
  push({ name: 'TradeOrderDetail', params: { id } })
}

/**
 * 格式化订单状态的颜色
 *
 * @param order 订单
 * @return {string} 颜色的 class 名称
 */
function formatOrderColor(order: any) {
  if (order.status === 0) {
    return 'info-color'
  }
  if (order.status === 10 || order.status === 20 || (order.status === 30 && !order.commentStatus)) {
    return 'warning-color'
  }
  if (order.status === 30 && order.commentStatus) {
    return 'success-color'
  }
  return 'danger-color'
}

/**
 * 格式化订单状态
 *
 * @param order 订单
 */
function formatOrderStatus(order: any) {
  if (order.status === 0) {
    return '待付款'
  }
  if (order.status === 10 && order.deliveryType === 1) {
    return '待发货'
  }
  if (order.status === 10 && order.deliveryType === 2) {
    return '待核销'
  }
  if (order.status === 20) {
    return '待收货'
  }
  if (order.status === 30 && !order.commentStatus) {
    return '待评价'
  }
  if (order.status === 30 && order.commentStatus) {
    return '已完成'
  }
  return '已关闭'
}
</script>

<style lang="scss" scoped>
.order-list-card-box {
  border-radius: 10px;
  padding: 10px;
  border: 1px var(--el-border-color) solid;
  background-color: var(--app-content-bg-color);

  .order-card-header {
    height: 28px;

    .order-no {
      font-size: 12px;
      font-weight: 500;

      span {
        &:hover {
          text-decoration: underline;
          color: var(--left-menu-bg-active-color);
        }
      }
    }
  }

  .pay-box {
    padding-top: 10px;

    .discounts-title {
      font-size: 16px;
      line-height: normal;
      color: #999999;
    }

    .discounts-money {
      font-size: 16px;
      line-height: normal;
      color: #999;
      font-family: OPPOSANS;
    }

    .pay-color {
      font-size: 13px;
      color: var(--left-menu-text-color);
    }
  }
}

.warning-color {
  color: #faad14;
  font-size: 11px;
  font-weight: bold;
}

.danger-color {
  color: #ff3000;
  font-size: 11px;
  font-weight: bold;
}

.success-color {
  color: #52c41a;
  font-size: 11px;
  font-weight: bold;
}

.info-color {
  color: #999999;
  font-size: 11px;
  font-weight: bold;
}
</style>
