<template>
  <el-form ref="OtherSettingsFormRef" :model="formData" :rules="rules" label-width="120px">
    <el-row>
      <!-- TODO @puhui999：横着三个哈 -->
      <el-col :span="24">
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
      </el-col>
      <el-col :span="24">
        <el-form-item label="商品推荐">
          <el-checkbox-group v-model="checkboxGroup" @change="onChangeGroup">
            <el-checkbox v-for="(item, index) in recommend" :key="index" :label="item.value">
              {{ item.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <!--   TODO tag展示暂时不考虑排序     -->
        <el-form-item label="活动优先级">
          <el-tag>默认</el-tag>
          <el-tag class="ml-2" type="success">秒杀</el-tag>
          <el-tag class="ml-2" type="info">砍价</el-tag>
          <el-tag class="ml-2" type="warning">拼团</el-tag>
        </el-form-item>
      </el-col>
      <!-- TODO @puhui999：等优惠劵 ok 在搞 -->
      <el-col :span="24">
        <el-form-item label="赠送优惠劵">
          <el-button>选择优惠券</el-button>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script lang="ts" name="OtherSettingsForm" setup>
import type { SpuType } from '@/api/mall/product/management/type/spuType'
import { PropType } from 'vue'
import { copyValueToTarget } from '@/utils/object'
import { propTypes } from '@/utils/propTypes'
const message = useMessage() // 消息弹窗

const props = defineProps({
  propFormData: {
    type: Object as PropType<SpuType>,
    default: () => {}
  },
  activeName: propTypes.string.def('')
})
// 商品推荐选项 TODO @puhui999：这种叫 recommendOptions 会更合适哈
const recommend = [
  { name: '是否热卖', value: 'recommendHot' },
  { name: '是否优惠', value: 'recommendBenefit' },
  { name: '是否精品', value: 'recommendBest' },
  { name: '是否新品', value: 'recommendNew' },
  { name: '是否优品', value: 'recommendGood' }
]
const checkboxGroup = ref<string[]>(['recommendHot']) // 选中推荐选项
/** 选择商品后赋值 */
const onChangeGroup = () => {
  // TODO @puhui999：是不是可以遍历 recommend，然后进行是否选中；
  checkboxGroup.value.includes('recommendHot')
    ? (formData.value.recommendHot = true)
    : (formData.value.recommendHot = false)
  checkboxGroup.value.includes('recommendBenefit')
    ? (formData.value.recommendBenefit = true)
    : (formData.value.recommendBenefit = false)
  checkboxGroup.value.includes('recommendBest')
    ? (formData.value.recommendBest = true)
    : (formData.value.recommendBest = false)
  checkboxGroup.value.includes('recommendNew')
    ? (formData.value.recommendNew = true)
    : (formData.value.recommendNew = false)
  checkboxGroup.value.includes('recommendGood')
    ? (formData.value.recommendGood = true)
    : (formData.value.recommendGood = false)
}
const OtherSettingsFormRef = ref() // 表单Ref
// 表单数据
const formData = ref<SpuType>({
  sort: 1, // 商品排序
  giveIntegral: 1, // 赠送积分
  virtualSalesCount: 1, // 虚拟销量
  recommendHot: false, // 是否热卖
  recommendBenefit: false, // 是否优惠
  recommendBest: false, // 是否精品
  recommendNew: false, // 是否新品
  recommendGood: false // 是否优品
})
// 表单规则
const rules = reactive({
  sort: [required],
  giveIntegral: [required],
  virtualSalesCount: [required]
})

/**
 * 将传进来的值赋值给formData
 */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) return
    copyValueToTarget(formData.value, data)
    // TODO 如果先修改其他设置的值，再改变商品详情或是商品信息会重置其他设置页面中的相关值 下一个版本修复
    checkboxGroup.value = []
    formData.value.recommendHot ? checkboxGroup.value.push('recommendHot') : ''
    formData.value.recommendBenefit ? checkboxGroup.value.push('recommendBenefit') : ''
    formData.value.recommendBest ? checkboxGroup.value.push('recommendBest') : ''
    formData.value.recommendNew ? checkboxGroup.value.push('recommendNew') : ''
    formData.value.recommendGood ? checkboxGroup.value.push('recommendGood') : ''
  },
  {
    deep: true,
    immediate: true
  }
)

/**
 * 表单校验
 */
const emit = defineEmits(['update:activeName'])
const validate = async () => {
  // 校验表单
  if (!OtherSettingsFormRef) return
  return await unref(OtherSettingsFormRef).validate((valid) => {
    if (!valid) {
      message.warning('商品其他设置未完善！！')
      emit('update:activeName', 'otherSettings')
      // 目的截断之后的校验
      throw new Error('商品其他设置未完善！！')
    } else {
      // 校验通过更新数据
      Object.assign(props.propFormData, formData.value)
    }
  })
}
defineExpose({ validate })
</script>
