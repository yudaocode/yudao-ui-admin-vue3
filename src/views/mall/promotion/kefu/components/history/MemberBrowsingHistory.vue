<template>
  <div v-show="!isEmpty(conversation)" class="kefu">
    <div class="header-title h-60px flex justify-center items-center">他的足迹</div>
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane label="最近浏览" name="a" />
      <el-tab-pane label="订单列表" name="b" />
    </el-tabs>
    <!--  最近浏览  -->
    <ProductBrowsingHistory v-if="activeName === 'a'" ref="productBrowsingHistoryRef" />
    <!--  订单列表  -->
    <template v-if="activeName === 'b'"></template>
  </div>
  <el-empty v-show="isEmpty(conversation)" description="请选择左侧的一个会话后开始" />
</template>

<script lang="ts" setup>
import type { TabsPaneContext } from 'element-plus'
import ProductBrowsingHistory from './ProductBrowsingHistory.vue'
import { KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'MemberBrowsingHistory' })

const activeName = ref('a')
/** tab 切换 */
const productBrowsingHistoryRef = ref<InstanceType<typeof ProductBrowsingHistory>>()
const handleClick = (tab: TabsPaneContext) => {
  activeName.value = tab.paneName as string
  getHistoryList()
}
/** 获得历史数据 */
const getHistoryList = async () => {
  switch (activeName.value) {
    case 'a':
      await productBrowsingHistoryRef.value?.getHistoryList(conversation.value)
      break
    case 'b':
      break
    default:
      break
  }
}
/** 浏览历史初始化 */
const conversation = ref<KeFuConversationRespVO>({} as KeFuConversationRespVO) // 用户会话
const initHistory = async (val: KeFuConversationRespVO) => {
  activeName.value = 'a'
  conversation.value = val
  await getHistoryList()
}
defineExpose({ initHistory })
</script>

<style lang="scss" scoped>
.header-title {
  border-bottom: #e4e0e0 solid 1px;
}
</style>
