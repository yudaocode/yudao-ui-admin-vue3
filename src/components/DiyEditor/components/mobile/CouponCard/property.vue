<template>
  <ComponentContainerProperty v-model="formData.style">
    <el-form label-width="80px" :model="formData">
      <el-card header="优惠券列表" class="property-group" shadow="never">
        <div
          v-for="(coupon, index) in couponList"
          :key="index"
          class="flex items-center justify-between"
        >
          <el-text size="large" truncated>{{ coupon.name }}</el-text>
          <el-text type="info" truncated>
            <span v-if="coupon.usePrice > 0">满{{ floatToFixed2(coupon.usePrice) }}元，</span>
            <span v-if="coupon.discountType === PromotionDiscountTypeEnum.PRICE.type">
              减{{ floatToFixed2(coupon.discountPrice) }}元
            </span>
            <span v-else> 打{{ coupon.discountPercent }}折 </span>
          </el-text>
        </div>
        <el-form-item label-width="0">
          <el-button @click="handleAddCoupon" type="primary" plain class="m-t-8px w-full">
            <Icon icon="ep:plus" class="mr-5px" /> 添加
          </el-button>
        </el-form-item>
      </el-card>
      <el-card header="优惠券样式" class="property-group" shadow="never">
        <el-form-item label="列数" prop="type">
          <el-radio-group v-model="formData.columns">
            <el-tooltip class="item" content="一列" placement="bottom">
              <el-radio-button :label="1">
                <Icon icon="fluent:text-column-one-24-filled" />
              </el-radio-button>
            </el-tooltip>
            <el-tooltip class="item" content="二列" placement="bottom">
              <el-radio-button :label="2">
                <Icon icon="fluent:text-column-two-24-filled" />
              </el-radio-button>
            </el-tooltip>
            <el-tooltip class="item" content="三列" placement="bottom">
              <el-radio-button :label="3">
                <Icon icon="fluent:text-column-three-24-filled" />
              </el-radio-button>
            </el-tooltip>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="背景图片" prop="bgImg">
          <UploadImg v-model="formData.bgImg" height="80px" width="100%" class="min-w-160px" />
        </el-form-item>
        <el-form-item label="文字颜色" prop="textColor">
          <ColorInput v-model="formData.textColor" />
        </el-form-item>
        <el-form-item label="按钮背景" prop="button.bgColor">
          <ColorInput v-model="formData.button.bgColor" />
        </el-form-item>
        <el-form-item label="按钮文字" prop="button.color">
          <ColorInput v-model="formData.button.color" />
        </el-form-item>
        <el-form-item label="间隔" prop="space">
          <el-slider
            v-model="formData.space"
            :max="100"
            :min="0"
            show-input
            input-size="small"
            :show-input-controls="false"
          />
        </el-form-item>
      </el-card>
    </el-form>
  </ComponentContainerProperty>
  <!-- 优惠券选择 -->
  <CouponSelect ref="couponSelectDialog" v-model:multiple-selection="couponList" />
</template>

<script setup lang="ts">
import { CouponCardProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'
import * as CouponTemplateApi from '@/api/mall/promotion/coupon/couponTemplate'
import { floatToFixed2 } from '@/utils'
import { PromotionDiscountTypeEnum } from '@/utils/constants'
import CouponSelect from '@/views/mall/promotion/coupon/components/CouponSelect.vue'

// 优惠券卡片属性面板
defineOptions({ name: 'CouponCardProperty' })

const props = defineProps<{ modelValue: CouponCardProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)

// 优惠券列表
const couponList = ref<CouponTemplateApi.CouponTemplateVO[]>([])
const couponSelectDialog = ref()
// 添加优惠券
const handleAddCoupon = () => {
  couponSelectDialog.value.open()
}
watch(
  () => couponList.value,
  () => {
    formData.value.couponIds = couponList.value.map((coupon) => coupon.id)
  }
)
</script>

<style scoped lang="scss"></style>
