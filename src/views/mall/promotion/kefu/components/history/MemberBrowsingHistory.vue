<!-- 目录是不是叫 member 好点。然后这个组件是 MemberInfo，里面有浏览足迹 -->
<template>
  <div v-show="!isEmpty(conversation)" class="kefu">
    <div class="header-title h-60px flex justify-center items-center">他的足迹</div>
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane label="最近浏览" name="a" />
      <el-tab-pane label="订单列表" name="b" />
    </el-tabs>
    <div>
      <el-scrollbar ref="scrollbarRef" always height="calc(100vh - 400px)" @scroll="handleScroll">
        <!-- 最近浏览 -->
        <ProductBrowsingHistory v-if="activeName === 'a'" ref="productBrowsingHistoryRef" />
        <!-- 订单列表 -->
        <OrderBrowsingHistory v-if="activeName === 'b'" ref="orderBrowsingHistoryRef" />
      </el-scrollbar>
    </div>
  </div>
  <el-empty v-show="isEmpty(conversation)" description="请选择左侧的一个会话后开始" />
</template>

<script lang="ts" setup>
import type { TabsPaneContext } from 'element-plus'
import ProductBrowsingHistory from './ProductBrowsingHistory.vue'
import OrderBrowsingHistory from './OrderBrowsingHistory.vue'
import { KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import { isEmpty } from '@/utils/is'
import { debounce } from 'lodash-es'
import { ElScrollbar as ElScrollbarType } from 'element-plus/es/components/scrollbar/index'

defineOptions({ name: 'MemberBrowsingHistory' })

const activeName = ref('a')

/** tab 切换 */
const productBrowsingHistoryRef = ref<InstanceType<typeof ProductBrowsingHistory>>()
const orderBrowsingHistoryRef = ref<InstanceType<typeof OrderBrowsingHistory>>()
const handleClick = async (tab: TabsPaneContext) => {
  activeName.value = tab.paneName as string
  await nextTick()
  await getHistoryList()
}

/** 获得历史数据 */
// TODO @puhui：不要用 a、b 哈。就订单列表、浏览列表这种噶
const getHistoryList = async () => {
  switch (activeName.value) {
    case 'a':
      await productBrowsingHistoryRef.value?.getHistoryList(conversation.value)
      break
    case 'b':
      await orderBrowsingHistoryRef.value?.getHistoryList(conversation.value)
      break
    default:
      break
  }
}

/** 加载下一页数据 */
const loadMore = async () => {
  switch (activeName.value) {
    case 'a':
      await productBrowsingHistoryRef.value?.loadMore()
      break
    case 'b':
      await orderBrowsingHistoryRef.value?.loadMore()
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
  await nextTick()
  await getHistoryList()
}
defineExpose({ initHistory })

/** 处理消息列表滚动事件(debounce 限流) */
const scrollbarRef = ref<InstanceType<typeof ElScrollbarType>>()
const handleScroll = debounce(() => {
  const wrap = scrollbarRef.value?.wrapRef
  // 触底重置
  if (Math.abs(wrap!.scrollHeight - wrap!.clientHeight - wrap!.scrollTop) < 1) {
    loadMore()
  }
}, 200)
</script>

<style lang="scss" scoped>
.header-title {
  border-bottom: #e4e0e0 solid 1px;
}
</style>
