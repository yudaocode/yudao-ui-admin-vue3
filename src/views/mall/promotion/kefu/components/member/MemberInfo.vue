<!-- 右侧信息：会员信息 + 最近浏览 + 交易订单 -->
<template>
  <el-container class="kefu">
    <el-header class="kefu-header">
      <div
        :class="{ 'kefu-header-item-activation': tabActivation('会员信息') }"
        class="kefu-header-item cursor-pointer flex items-center justify-center"
        @click="handleClick('会员信息')"
      >
        会员信息
      </div>
      <div
        :class="{ 'kefu-header-item-activation': tabActivation('最近浏览') }"
        class="kefu-header-item cursor-pointer flex items-center justify-center"
        @click="handleClick('最近浏览')"
      >
        最近浏览
      </div>
      <div
        :class="{ 'kefu-header-item-activation': tabActivation('交易订单') }"
        class="kefu-header-item cursor-pointer flex items-center justify-center"
        @click="handleClick('交易订单')"
      >
        交易订单
      </div>
    </el-header>
    <el-main class="kefu-content p-10px!">
      <div v-if="!isEmpty(conversation)" v-loading="loading">
        <!-- 基本信息 -->
        <UserBasicInfo v-if="activeTab === '会员信息'" :user="user" mode="kefu">
          <template #header>
            <CardTitle title="基本信息" />
          </template>
        </UserBasicInfo>
        <!-- 账户信息 -->
        <el-card v-if="activeTab === '会员信息'" class="h-full mt-10px" shadow="never">
          <template #header>
            <CardTitle title="账户信息" />
          </template>
          <UserAccountInfo :column="1" :user="user" :wallet="wallet" />
        </el-card>
      </div>
      <div v-show="!isEmpty(conversation)">
        <el-scrollbar ref="scrollbarRef" always @scroll="handleScroll">
          <!-- 最近浏览 -->
          <ProductBrowsingHistory v-if="activeTab === '最近浏览'" ref="productBrowsingHistoryRef" />
          <!-- 交易订单 -->
          <OrderBrowsingHistory v-if="activeTab === '交易订单'" ref="orderBrowsingHistoryRef" />
        </el-scrollbar>
      </div>
      <el-empty v-show="isEmpty(conversation)" description="请选择左侧的一个会话后开始" />
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
import ProductBrowsingHistory from './ProductBrowsingHistory.vue'
import OrderBrowsingHistory from './OrderBrowsingHistory.vue'
import { KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import { isEmpty } from '@/utils/is'
import { debounce } from 'lodash-es'
import { ElScrollbar as ElScrollbarType } from 'element-plus/es/components/scrollbar/index'
import { CardTitle } from '@/components/Card'
import UserBasicInfo from '@/views/member/user/detail/UserBasicInfo.vue'
import UserAccountInfo from '@/views/member/user/detail/UserAccountInfo.vue'
import * as UserApi from '@/api/member/user'
import * as WalletApi from '@/api/pay/wallet/balance'

defineOptions({ name: 'MemberBrowsingHistory' })

const activeTab = ref('会员信息')
const tabActivation = computed(() => (tab: string) => activeTab.value === tab)

/** tab 切换 */
const productBrowsingHistoryRef = ref<InstanceType<typeof ProductBrowsingHistory>>()
const orderBrowsingHistoryRef = ref<InstanceType<typeof OrderBrowsingHistory>>()
const handleClick = async (tab: string) => {
  activeTab.value = tab
  await nextTick()
  await getHistoryList()
}

/** 获得历史数据 */
const getHistoryList = async () => {
  switch (activeTab.value) {
    case '会员信息':
      await getUserData()
      await getUserWallet()
      break
    case '最近浏览':
      await productBrowsingHistoryRef.value?.getHistoryList(conversation.value)
      break
    case '交易订单':
      await orderBrowsingHistoryRef.value?.getHistoryList(conversation.value)
      break
    default:
      break
  }
}

/** 加载下一页数据 */
const loadMore = async () => {
  switch (activeTab.value) {
    case '会员信息':
      break
    case '最近浏览':
      await productBrowsingHistoryRef.value?.loadMore()
      break
    case '交易订单':
      await orderBrowsingHistoryRef.value?.loadMore()
      break
    default:
      break
  }
}

/** 浏览历史初始化 */
const conversation = ref<KeFuConversationRespVO>({} as KeFuConversationRespVO) // 用户会话
const initHistory = async (val: KeFuConversationRespVO) => {
  activeTab.value = '会员信息'
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

/** 查询用户钱包信息 */
const WALLET_INIT_DATA = {
  balance: 0,
  totalExpense: 0,
  totalRecharge: 0
} as WalletApi.WalletVO // 钱包初始化数据
const wallet = ref<WalletApi.WalletVO>(WALLET_INIT_DATA) // 钱包信息
const getUserWallet = async () => {
  if (!conversation.value.userId) {
    wallet.value = WALLET_INIT_DATA
    return
  }
  wallet.value =
    (await WalletApi.getWallet({ userId: conversation.value.userId })) || WALLET_INIT_DATA
}

/** 获得用户 */
const loading = ref(true) // 加载中
const user = ref<UserApi.UserVO>({} as UserApi.UserVO)
const getUserData = async () => {
  loading.value = true
  try {
    user.value = await UserApi.getUser(conversation.value.userId)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.kefu {
  position: relative;
  width: 300px !important;
  background-color: var(--app-content-bg-color);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 1px; /* 实际宽度 */
    height: 100%;
    background-color: var(--el-border-color);
    transform: scaleX(0.3); /* 缩小宽度 */
  }

  &-header {
    background-color: var(--app-content-bg-color);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-around;

    &::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 1px; /* 初始宽度 */
      background-color: var(--el-border-color);
      transform: scaleY(0.3); /* 缩小视觉高度 */
    }

    &-title {
      font-size: 18px;
      font-weight: bold;
    }

    &-item {
      height: 100%;
      width: 100%;
      position: relative;

      &-activation::before {
        content: '';
        position: absolute; /* 绝对定位 */
        top: 0;
        left: 0;
        right: 0;
        bottom: 0; /* 覆盖整个元素 */
        border-bottom: 2px solid rgba(128, 128, 128, 0.5); /* 边框样式 */
        pointer-events: none; /* 确保点击事件不会被伪元素拦截 */
      }

      &:hover::before {
        content: '';
        position: absolute; /* 绝对定位 */
        top: 0;
        left: 0;
        right: 0;
        bottom: 0; /* 覆盖整个元素 */
        border-bottom: 2px solid rgba(128, 128, 128, 0.5); /* 边框样式 */
        pointer-events: none; /* 确保点击事件不会被伪元素拦截 */
      }
    }
  }

  &-content {
    margin: 0;
    padding: 0;
    position: relative;
    height: 100%;
    width: 100%;
  }

  &-tabs {
    height: 100%;
    width: 100%;
  }
}

.header-title {
  border-bottom: #e4e0e0 solid 1px;
}
</style>
