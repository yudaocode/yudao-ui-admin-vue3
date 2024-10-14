<template>
  <el-card shadow="never">
    <template #header>
      <CardTitle title="运营数据" />
    </template>
    <div class="flex flex-row flex-wrap items-center gap-8 p-4">
      <div
        v-for="item in data"
        :key="item.name"
        class="h-20 w-20% flex flex-col cursor-pointer items-center justify-center gap-2"
        @click="handleClick(item.routerName)"
      >
        <CountTo
          :decimals="item.decimals"
          :end-val="item.value"
          :prefix="item.prefix"
          class="text-3xl"
        />
        <span class="text-center">{{ item.name }}</span>
      </div>
    </div>
  </el-card>
</template>
<script lang="ts" setup>
import * as ProductSpuApi from '@/api/mall/product/spu'
import * as TradeStatisticsApi from '@/api/mall/statistics/trade'
import * as PayStatisticsApi from '@/api/mall/statistics/pay'
import { CardTitle } from '@/components/Card'

/** 运营数据卡片 */
defineOptions({ name: 'OperationDataCard' })

const router = useRouter() // 路由

/** 数据 */
const data = reactive({
  orderUndelivered: { name: '待发货订单', value: 9, routerName: 'TradeOrder' },
  orderAfterSaleApply: { name: '退款中订单', value: 4, routerName: 'TradeAfterSale' },
  orderWaitePickUp: { name: '待核销订单', value: 0, routerName: 'TradeOrder' },
  productAlertStock: { name: '库存预警', value: 0, routerName: 'ProductSpu' },
  productForSale: { name: '上架商品', value: 0, routerName: 'ProductSpu' },
  productInWarehouse: { name: '仓库商品', value: 0, routerName: 'ProductSpu' },
  withdrawAuditing: { name: '提现待审核', value: 0, routerName: 'TradeBrokerageWithdraw' },
  rechargePrice: {
    name: '账户充值',
    value: 0.0,
    prefix: '￥',
    decimals: 2,
    routerName: 'PayWalletRecharge'
  }
})

/** 查询订单数据 */
const getOrderData = async () => {
  const orderCount = await TradeStatisticsApi.getOrderCount()
  if (orderCount.undelivered != null) {
    data.orderUndelivered.value = orderCount.undelivered
  }
  if (orderCount.afterSaleApply != null) {
    data.orderAfterSaleApply.value = orderCount.afterSaleApply
  }
  if (orderCount.pickUp != null) {
    data.orderWaitePickUp.value = orderCount.pickUp
  }
  if (orderCount.auditingWithdraw != null) {
    data.withdrawAuditing.value = orderCount.auditingWithdraw
  }
}

/** 查询商品数据 */
const getProductData = async () => {
  // TODO: @芋艿：这个接口的返回值，是不是用命名字段更好些？
  const productCount = await ProductSpuApi.getTabsCount()
  data.productForSale.value = productCount['0']
  data.productInWarehouse.value = productCount['1']
  data.productAlertStock.value = productCount['3']
}

/** 查询钱包充值数据 */
const getWalletRechargeData = async () => {
  const paySummary = await PayStatisticsApi.getWalletRechargePrice()
  data.rechargePrice.value = paySummary.rechargePrice
}

/**
 * 跳转到对应页面
 *
 * @param routerName 路由页面组件的名称
 */
const handleClick = (routerName: string) => {
  router.push({ name: routerName })
}

/** 激活时 */
onActivated(() => {
  getOrderData()
  getProductData()
  getWalletRechargeData()
})

/** 初始化 **/
onMounted(() => {
  getOrderData()
  getProductData()
  getWalletRechargeData()
})
</script>
