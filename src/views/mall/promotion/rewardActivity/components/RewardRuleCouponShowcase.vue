<template>
  <ContentWrap>
    <el-button @click="selectCoupon">添加优惠卷</el-button>
    <el-table :data="list">
      <el-table-column label="优惠券名称" prop="name" />
      <el-table-column label="类型" prop="productScope">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PROMOTION_PRODUCT_SCOPE" :value="scope.row.productScope" />
        </template>
      </el-table-column>
      <el-table-column label="优惠" prop="discount">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE" :value="scope.row.discountType" />
          {{ discountFormat(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column
        :formatter="validityTypeFormat"
        align="center"
        label="使用时间"
        prop="validityType"
      />
      <el-table-column
        :formatter="remainedCountFormat"
        align="center"
        label="剩余数量"
        prop="totalCount"
      />
      <el-table-column align="center" fixed="right" label="状态" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 优惠券选择 -->
  <CouponSelect ref="couponSelectRef" @change="handleCouponChange" />
</template>

<script lang="ts" setup>
// TODO puhui999: 先简单选择后列表展示，后续继续 fix
import { CouponSelect } from '@/views/mall/promotion/coupon/components'
import * as CouponTemplateApi from '@/api/mall/promotion/coupon/couponTemplate'
import { DICT_TYPE } from '@/utils/dict'
import {
  discountFormat,
  remainedCountFormat,
  validityTypeFormat
} from '@/views/mall/promotion/coupon/formatter'

defineOptions({ name: 'RewardRuleCouponShowcase' })

const list = ref<CouponTemplateApi.CouponTemplateVO[]>([]) // 选择的优惠券列表

const couponSelectRef = ref<InstanceType<typeof CouponSelect>>() // 优惠券选择
/** 选择优惠券 */
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
</script>

<style lang="scss" scoped></style>
