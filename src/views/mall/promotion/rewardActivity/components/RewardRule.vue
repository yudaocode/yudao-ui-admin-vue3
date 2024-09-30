<template>
  <!-- 满减送活动规则组件 -->
  <el-row>
    <template v-if="formData.rules">
      <el-col v-for="(rule, index) in formData.rules" :key="index" :span="24">
        <span class="font-bold">活动层级{{ index + 1 }}</span>
        <el-button v-if="index !== 0" link type="danger" @click="deleteRule(index)">
          删除
        </el-button>
        <el-form ref="formRef" :model="rule">
          <el-form-item label="优惠门槛:" label-width="100px" prop="limit">
            满
            <el-input-number
              v-if="PromotionConditionTypeEnum.PRICE.type === formData.conditionType"
              v-model="rule.limit"
              :min="0"
              :precision="2"
              :step="0.1"
              class="w-150px! p-x-20px!"
              placeholder=""
              type="number"
              controls-position="right"
            />
            <el-input
              v-else
              v-model="rule.limit"
              :min="0"
              class="w-150px! p-x-20px!"
              placeholder=""
              type="number"
            />
            {{ PromotionConditionTypeEnum.PRICE.type === formData.conditionType ? '元' : '件' }}
          </el-form-item>
          <el-form-item label="优惠内容:" label-width="100px">
            <el-col :span="24">
              订单金额优惠
              <el-form-item>
                减
                <el-input-number
                  v-model="rule.discountPrice"
                  :min="0"
                  :precision="2"
                  :step="0.1"
                  class="w-150px! p-x-20px!"
                  controls-position="right"
                />
                元
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <span>包邮：</span>
              <el-switch
                v-model="rule.freeDelivery"
                active-text="是"
                inactive-text="否"
                inline-prompt
              />
            </el-col>
            <el-col :span="24">
              <span>送积分：</span>
              <el-form-item>
                送
                <el-input
                  v-model="rule.point"
                  class="w-150px! p-x-20px!"
                  placeholder=""
                  type="number"
                />
                积分
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <span>送优惠券：</span>
              <RewardRuleCouponSelect ref="rewardRuleCouponSelectRef" v-model="rule!" />
            </el-col>
          </el-form-item>
        </el-form>
      </el-col>
    </template>
    <el-col :span="24" class="mt-10px">
      <el-button type="primary" @click="addRule">添加优惠规则</el-button>
    </el-col>
    <el-col :span="24">
      <el-tag type="warning"> 赠送积分为 0 时不赠送。未选优惠券时不赠送。</el-tag>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import RewardRuleCouponSelect from './RewardRuleCouponSelect.vue'
import { RewardActivityVO } from '@/api/mall/promotion/reward/rewardActivity'
import { PromotionConditionTypeEnum } from '@/utils/constants'
import { useVModel } from '@vueuse/core'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'RewardRule' })

const props = defineProps<{
  modelValue: RewardActivityVO
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', v: any): void
  (e: 'deleteRule', v: number): void
}>()

const formData = useVModel(props, 'modelValue', emits) // 活动数据
const rewardRuleCouponSelectRef = ref<InstanceType<typeof RewardRuleCouponSelect>[]>() // 活动规则优惠券 Ref

/** 删除优惠规则 */
const deleteRule = (ruleIndex: number) => {
  formData.value.rules.splice(ruleIndex, 1)
}

/** 添加优惠规则 */
const addRule = () => {
  if (isEmpty(formData.value.rules)) {
    formData.value.rules = []
  }
  formData.value.rules.push({
    limit: 0,
    discountPrice: 0,
    freeDelivery: false,
    point: 0
  })
}

/** 设置规则优惠券-提交时 */
const setRuleCoupon = () => {
  if (isEmpty(rewardRuleCouponSelectRef.value)) {
    return
  }

  rewardRuleCouponSelectRef.value?.forEach((item) => item.setGiveCouponList())
}

defineExpose({ setRuleCoupon })
</script>
