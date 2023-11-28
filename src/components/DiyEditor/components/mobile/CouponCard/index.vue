<template>
  <el-scrollbar class="z-1 min-h-30px" wrap-class="w-full" ref="containerRef">
    <div
      class="flex flex-row text-12px"
      :style="{
        gap: `${property.space}px`,
        width: scrollbarWidth
      }"
    >
      <div
        class="box-content"
        :style="{
          background: property.bgImg
            ? `url(${property.bgImg}) 100% center / 100% 100% no-repeat`
            : '#fff',
          width: `${couponWidth}px`,
          color: property.textColor
        }"
        v-for="(coupon, index) in couponList"
        :key="index"
      >
        <!-- 布局1：1列-->
        <div v-if="property.columns === 1" class="m-l-16px flex flex-row justify-between p-8px">
          <div class="flex flex-col justify-evenly gap-4px">
            <!-- 优惠值 -->
            <CouponDiscount :coupon="coupon" />
            <!-- 优惠描述 -->
            <CouponDiscountDesc :coupon="coupon" />
            <!-- 有效期 -->
            <CouponValidTerm :coupon="coupon" />
          </div>
          <div class="flex flex-col justify-evenly">
            <div
              class="rounded-20px p-x-8px p-y-2px"
              :style="{
                color: property.button.color,
                background: property.button.bgColor
              }"
            >
              立即领取
            </div>
          </div>
        </div>
        <!-- 布局2：2列-->
        <div
          v-else-if="property.columns === 2"
          class="m-l-16px flex flex-row justify-between p-8px"
        >
          <div class="flex flex-col justify-evenly gap-4px">
            <!-- 优惠值 -->
            <CouponDiscount :coupon="coupon" />
            <div>{{ coupon.name }}</div>
          </div>
          <div class="flex flex-col">
            <div
              class="h-full w-20px rounded-20px p-x-2px p-y-8px text-center"
              :style="{
                color: property.button.color,
                background: property.button.bgColor
              }"
            >
              立即领取
            </div>
          </div>
        </div>
        <!-- 布局3：3列-->
        <div v-else class="flex flex-col items-center justify-around gap-4px p-4px">
          <!-- 优惠值 -->
          <CouponDiscount :coupon="coupon" />
          <div>{{ coupon.name }}</div>
          <div
            class="rounded-20px p-x-8px p-y-2px"
            :style="{
              color: property.button.color,
              background: property.button.bgColor
            }"
          >
            立即领取
          </div>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { CouponCardProperty } from './config'
import * as CouponTemplateApi from '@/api/mall/promotion/coupon/couponTemplate'
import { CouponDiscount } from './component'
import {
  CouponDiscountDesc,
  CouponValidTerm
} from '@/components/DiyEditor/components/mobile/CouponCard/component'

/** 商品卡片 */
defineOptions({ name: 'CouponCard' })
// 定义属性
const props = defineProps<{ property: CouponCardProperty }>()
// 商品列表
const couponList = ref<CouponTemplateApi.CouponTemplateVO[]>([])
watch(
  () => props.property.couponIds,
  async () => {
    if (props.property.couponIds?.length > 0) {
      couponList.value = await CouponTemplateApi.getCouponTemplateList(props.property.couponIds)
    }
  },
  {
    immediate: true,
    deep: true
  }
)

// 手机宽度
const phoneWidth = ref(375)
// 容器
const containerRef = ref()
// 滚动条宽度
const scrollbarWidth = ref('100%')
// 优惠券的宽度
const couponWidth = ref(375)
// 计算布局参数
watch(
  () => [props.property, phoneWidth, couponList.value.length],
  () => {
    // 每列的宽度为：（总宽度 - 间距 * (列数 - 1)）/ 列数
    couponWidth.value =
      (phoneWidth.value * 0.95 - props.property.space * (props.property.columns - 1)) /
      props.property.columns
    // 显示滚动条
    scrollbarWidth.value = `${
      couponWidth.value * couponList.value.length +
      props.property.space * (couponList.value.length - 1)
    }px`
  },
  { immediate: true, deep: true }
)
onMounted(() => {
  // 提取手机宽度
  phoneWidth.value = containerRef.value?.wrapRef?.offsetWidth || 375
})
</script>
<style scoped lang="scss"></style>
