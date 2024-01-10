<template>
  <!-- 情况一：添加/修改 -->
  <el-form
    v-if="!isDetail"
    ref="otherSettingsFormRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
  >
    <el-form-item label="商品排序" prop="sort">
      <el-input-number v-model="formData.sort" :min="0" />
    </el-form-item>
    <el-form-item label="赠送积分" prop="giveIntegral">
      <el-input-number v-model="formData.giveIntegral" :min="0" />
    </el-form-item>
    <el-form-item label="虚拟销量" prop="virtualSalesCount">
      <el-input-number v-model="formData.virtualSalesCount" :min="0" placeholder="请输入虚拟销量" />
    </el-form-item>
  </el-form>

  <!-- 情况二：详情 -->
  <Descriptions v-if="isDetail" :data="formData" :schema="allSchemas.detailSchema" />
</template>
<script lang="ts" setup>
import type { Spu } from '@/api/mall/product/spu'
import { PropType } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { copyValueToTarget } from '@/utils'
import { otherSettingsSchema } from './spu.data'

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

const otherSettingsFormRef = ref() // 表单Ref
// 表单数据
const formData = ref<Spu>({
  sort: 1, // 商品排序
  giveIntegral: 1, // 赠送积分
  virtualSalesCount: 1 // 虚拟销量
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
    if (!data) {
      return
    }
    copyValueToTarget(formData.value, data)
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
      Object.assign(props.propFormData, formData.value)
    }
  })
}
defineExpose({ validate })
</script>
