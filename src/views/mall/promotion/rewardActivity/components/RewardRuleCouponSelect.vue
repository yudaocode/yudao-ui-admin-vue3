<template>
  <el-button class="ml-10px" type="text" @click="selectCoupon">添加优惠劵</el-button>

  <div
    v-for="(item, index) in list"
    :key="item.id"
    class="coupon-list-item p-x-10px mb-10px flex justify-between"
  >
    <div class="coupon-list-item-left flex items-center flex-wrap">
      <div class="mr-10px"> 优惠券名称：{{ item.name }}</div>
      <div class="mr-10px">
        范围：
        <dict-tag :type="DICT_TYPE.PROMOTION_PRODUCT_SCOPE" :value="item.productScope" />
      </div>
      <div class="flex items-center">
        优惠：
        <dict-tag :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE" :value="item.discountType" />
        {{ discountFormat(item) }}
      </div>
    </div>
    <div class="coupon-list-item-right">
      送
      <el-input v-model="item.giveCount" class="w-150px! p-x-20px!" placeholder="" type="number" />
      张
      <el-button class="ml-20px" link type="danger" @click="deleteCoupon(index)">删除</el-button>
    </div>
  </div>

  <!-- 优惠券选择 -->
  <CouponSelect
    ref="couponSelectRef"
    :take-type="CouponTemplateTakeTypeEnum.ADMIN.type"
    @change="handleCouponChange"
  />
</template>

<script lang="ts" setup>
import { CouponSelect } from '@/views/mall/promotion/coupon/components'
import * as CouponTemplateApi from '@/api/mall/promotion/coupon/couponTemplate'
import { RewardRule } from '@/api/mall/promotion/reward/rewardActivity'
import { DICT_TYPE } from '@/utils/dict'
import { CouponTemplateTakeTypeEnum } from '@/utils/constants'
import { discountFormat } from '@/views/mall/promotion/coupon/formatter'
import { isEmpty } from '@/utils/is'
import { useVModel } from '@vueuse/core'

defineOptions({ name: 'RewardRuleCouponSelect' })

const props = defineProps<{
  modelValue: RewardRule
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', v: any): void
}>()

const rewardRule = useVModel(props, 'modelValue', emits) // 赠送规则
const list = ref<GiveCouponVO[]>([]) // 选择的优惠券列表

/** 选择赠送的优惠类型拓展 */
interface GiveCouponVO extends CouponTemplateApi.CouponTemplateVO {
  giveCount?: number
}

/** 选择优惠券 */
const couponSelectRef = ref<InstanceType<typeof CouponSelect>>() // 优惠券选择
const selectCoupon = () => {
  couponSelectRef.value?.open()
}

/** 选择优惠券后的回调 */
const handleCouponChange = (val: CouponTemplateApi.CouponTemplateVO[]) => {
  for (const item of val) {
    if (list.value.some((v) => v.id === item.id)) {
      continue
    }
    list.value.push(item)
  }
}

/** 删除优惠券 */
const deleteCoupon = (index: number) => {
  list.value.splice(index, 1)
}

/** 初始化赠送的优惠券列表 */
const initGiveCouponList = async () => {
  // 校验优惠券存在
  if (isEmpty(rewardRule.value) || isEmpty(rewardRule.value.giveCouponTemplateCounts)) {
    return
  }
  const tempLateIds = Object.keys(rewardRule.value.giveCouponTemplateCounts!).map((item) =>
    parseInt(item)
  )
  const data = await CouponTemplateApi.getCouponTemplateList(tempLateIds)
  if (!data) {
    return
  }
  // 回显
  data.forEach((coupon) => {
    list.value.push({
      ...coupon,
      giveCount: rewardRule.value.giveCouponTemplateCounts![coupon.id]
    })
  })
}

/** 设置赠送的优惠券 */
const setGiveCouponList = () => {
  if (isEmpty(rewardRule.value)) {
    return
  }
  // 核心：清空 rewardRule.value.giveCouponTemplateCounts，解决删除不生效的问题
  rewardRule.value.giveCouponTemplateCounts = {}

  // 设置优惠券和其数量的对应
  list.value.forEach((rule) => {
    rewardRule.value.giveCouponTemplateCounts![rule.id] = rule.giveCount!
  })
}
defineExpose({ setGiveCouponList })

/** 组件初始化 */
onMounted(async () => {
  await nextTick()
  await initGiveCouponList()
})
</script>

<style lang="scss" scoped>
.coupon-list-item {
  border: 1px dashed var(--el-border-color-darker);
  border-radius: 8px;
}
</style>
