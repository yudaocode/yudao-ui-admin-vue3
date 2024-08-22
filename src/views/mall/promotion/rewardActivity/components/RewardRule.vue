<template>
  <!-- 满减送活动规则组件 -->
  <el-row>
    <template v-if="formData.rules">
      <div v-for="(rule, index) in formData.rules" :key="index">
        <el-col :span="24">
          <span class="font-bold">活动层级{{ index + 1 }}</span>
          <el-button v-if="index !== 0" link type="danger" @click="deleteRule(index)">
            删除
          </el-button>
        </el-col>
        <el-form ref="formRef" :model="rule">
          <el-form-item label="优惠门槛:" label-width="100px" prop="limit">
            满
            <el-input
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
                <el-input
                  v-model="rule.discountPrice"
                  class="w-150px! p-x-20px!"
                  placeholder=""
                  type="number"
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
              <el-switch
                v-model="rule.givePoint"
                active-text="是"
                inactive-text="否"
                inline-prompt
              />
              <el-form-item v-if="rule.givePoint">
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
            <!-- 优惠券待处理  也可以参考优惠劵的SpuShowcase-->
            <!-- TODO 待实现！-->
            <el-col :span="24">
              <span>送优惠券：</span>
              <el-switch
                v-model="rule.giveCoupon"
                active-text="是"
                inactive-text="否"
                inline-prompt
              />
            </el-col>
          </el-form-item>
        </el-form>
      </div>
    </template>
    <el-col :span="24">
      <el-button type="primary" @click="addRule">添加优惠规则</el-button>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import { RewardActivityVO } from '@/api/mall/promotion/reward/rewardActivity'
import { PromotionConditionTypeEnum } from '@/utils/constants'
import { useVModel } from '@vueuse/core'

defineOptions({ name: 'RewardRule' })

const props = defineProps<{
  modelValue: RewardActivityVO
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', v: any): void
  (e: 'deleteRule', v: number): void
}>()

const formData = useVModel(props, 'modelValue', emits) // 活动数据

/** 删除优惠规则 */
const deleteRule = (ruleIndex: number) => {
  formData.value.rules.splice(ruleIndex, 1)
}

/** 添加优惠规则 */
const addRule = () => {
  formData.value.rules.push({
    limit: 0,
    discountPrice: 0,
    freeDelivery: false,
    givePoint: false,
    point: 0,
    giveCoupon: false,
    couponIds: [],
    couponCounts: []
  })
}
</script>

<style lang="scss" scoped></style>
