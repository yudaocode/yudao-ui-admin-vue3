<template>
  <ProductItem
    v-for="item in list"
    :key="item.id"
    :picUrl="item.picUrl"
    :price="item.price"
    :skuText="item.introduction"
    :title="item.spuName"
    :titleWidth="400"
    class="mb-10px"
    priceColor="#FF3000"
  />
</template>

<script lang="ts" setup>
import { getBrowseHistoryPage } from '@/api/mall/product/history'
import ProductItem from '@/views/mall/promotion/kefu/components/message/ProductItem.vue'
import { KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'

defineOptions({ name: 'ProductBrowsingHistory' })

const list = ref<any>([]) // 列表
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  userId: 0,
  userDeleted: false
})
/** 获得浏览记录 */
const getHistoryList = async (val: KeFuConversationRespVO) => {
  queryParams.userId = val.userId
  const res = await getBrowseHistoryPage(queryParams)
  list.value = res.list
}
defineExpose({ getHistoryList })
</script>

<style lang="scss" scoped></style>
