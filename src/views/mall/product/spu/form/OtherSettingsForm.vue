<template>
  <!-- 情况一：添加/修改 -->
  <el-form
    v-if="!isDetail"
    ref="otherSettingsFormRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
  >
    <el-row>
      <el-col :span="24">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="商品排序" prop="sort">
              <el-input-number v-model="formData.sort" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="赠送积分" prop="giveIntegral">
              <el-input-number v-model="formData.giveIntegral" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="虚拟销量" prop="virtualSalesCount">
              <el-input-number
                v-model="formData.virtualSalesCount"
                :min="0"
                placeholder="请输入虚拟销量"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-col>
      <el-col :span="24">
        <el-form-item label="商品推荐">
          <el-checkbox-group v-model="checkboxGroup" @change="onChangeGroup">
            <el-checkbox v-for="(item, index) in recommendOptions" :key="index" :label="item.value">
              {{ item.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <!--   TODO @puhui999：tag展示暂时不考虑排序；支持拖动排序 -->
        <el-form-item label="活动优先级">
          <el-tag
            v-for="type in getIntDictOptions(DICT_TYPE.PROMOTION_TYPE_ENUM)"
            :key="type.value as number"
            :type="type.colorType"
            class="mr-[10px]"
          >
            {{ type.label }}
          </el-tag>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="赠送优惠劵">
          <el-tag v-for="coupon in couponTemplateList" :key="coupon.id as number" class="mr-[10px]">
            {{ coupon.name }}
          </el-tag>
          <el-button @click="openCouponSelect">选择优惠券</el-button>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>

  <!-- 情况二：详情 -->
  <Descriptions v-if="isDetail" :data="formData" :schema="allSchemas.detailSchema">
    <template #recommendHot="{ row }">
      {{ row.recommendHot ? '是' : '否' }}
    </template>
    <template #recommendBenefit="{ row }">
      {{ row.recommendBenefit ? '是' : '否' }}
    </template>
    <template #recommendBest="{ row }">
      {{ row.recommendBest ? '是' : '否' }}
    </template>
    <template #recommendNew="{ row }">
      {{ row.recommendNew ? '是' : '否' }}
    </template>
    <template #recommendGood="{ row }">
      {{ row.recommendGood ? '是' : '否' }}
    </template>
    <template #activityOrders>
      <el-tag v-for="coupon in couponTemplateList" :key="coupon.id as number" class="mr-[10px]">
        {{ coupon.name }}
      </el-tag>
    </template>
  </Descriptions>
  <CouponSelect ref="couponSelectRef" v-model:multiple-selection="couponTemplateList" />
</template>
<script lang="ts" setup>
import type { GiveCouponTemplate, Spu } from '@/api/mall/product/spu'
import { PropType } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { copyValueToTarget } from '@/utils'
import { otherSettingsSchema } from './spu.data'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import CouponSelect from './CouponSelect.vue'

defineOptions({ name: 'OtherSettingsForm' })

const message = useMessage() // 消息弹窗

const { allSchemas } = useCrudSchemas(otherSettingsSchema)

const props = defineProps({
  propFormData: {
    type: Object as PropType<Spu>,
    default: () => {}
  },
  activeName: propTypes.string.def(''),
  isDetail: propTypes.bool.def(false) // 是否作为详情组件
})
const couponSelectRef = ref() // 优惠卷模版选择 Ref
const couponTemplateList = ref<GiveCouponTemplate[]>([]) // 选择的优惠卷
const openCouponSelect = () => {
  couponSelectRef.value?.open()
}

const otherSettingsFormRef = ref() // 表单Ref
// 表单数据
const formData = ref<Spu>({
  sort: 1, // 商品排序
  giveIntegral: 1, // 赠送积分
  virtualSalesCount: 1, // 虚拟销量
  recommendHot: false, // 是否热卖
  recommendBenefit: false, // 是否优惠
  recommendBest: false, // 是否精品
  recommendNew: false, // 是否新品
  recommendGood: false, // 是否优品
  giveCouponTemplate: [] // 赠送的优惠券
})
// 表单规则
const rules = reactive({
  sort: [required],
  giveIntegral: [required],
  virtualSalesCount: [required]
})
const recommendOptions = [
  { name: '是否热卖', value: 'recommendHot' },
  { name: '是否优惠', value: 'recommendBenefit' },
  { name: '是否精品', value: 'recommendBest' },
  { name: '是否新品', value: 'recommendNew' },
  { name: '是否优品', value: 'recommendGood' }
] // 商品推荐选项
const checkboxGroup = ref<string[]>([]) // 选中的推荐选项

/** 选择商品后赋值 */
const onChangeGroup = () => {
  recommendOptions.forEach(({ value }) => {
    formData.value[value] = checkboxGroup.value.includes(value)
  })
}

/**
 * 将传进来的值赋值给formData
 */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) {
      return
    }
    copyValueToTarget(formData.value, data)
    if (data.giveCouponTemplate) {
      couponTemplateList.value = data.giveCouponTemplate
    }
    recommendOptions.forEach(({ value }) => {
      if (formData.value[value] && !checkboxGroup.value.includes(value)) {
        checkboxGroup.value.push(value)
      }
    })
  },
  {
    immediate: true
  }
)

/**
 * 表单校验
 */
const emit = defineEmits(['update:activeName'])
const validate = async () => {
  // 校验表单
  if (!otherSettingsFormRef) return
  return await unref(otherSettingsFormRef).validate((valid) => {
    if (!valid) {
      message.warning('商品其他设置未完善！！')
      emit('update:activeName', 'otherSettings')
      // 目的截断之后的校验
      throw new Error('商品其他设置未完善！！')
    } else {
      // 校验通过更新数据
      formData.value.giveCouponTemplate = couponTemplateList.value
      Object.assign(props.propFormData, formData.value)
    }
  })
}
defineExpose({ validate })
</script>
