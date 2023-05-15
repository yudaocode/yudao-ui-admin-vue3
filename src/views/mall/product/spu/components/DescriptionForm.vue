<template>
  <el-form ref="DescriptionFormRef" :model="formData" :rules="rules" label-width="120px">
    <!--富文本编辑器组件-->
    <el-form-item label="商品详情" prop="description">
      <Editor v-model:modelValue="formData.description" />
    </el-form-item>
  </el-form>
</template>
<script lang="ts" name="DescriptionForm" setup>
import type { SpuType } from '@/api/mall/product/management/type/spuType'
import { Editor } from '@/components/Editor'
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
const DescriptionFormRef = ref() // 表单Ref
const formData = ref<SpuType>({
  description: '' // 商品详情
})
// 表单规则
const rules = reactive({
  description: [required]
})

/**
 * 富文本编辑器如果输入过再清空会有残留，需再重置一次
 */
watch(
  () => formData.value.description,
  (newValue) => {
    if ('<p><br></p>' === newValue) {
      formData.value.description = ''
    }
  },
  {
    deep: true,
    immediate: true
  }
)

/**
 * 将传进来的值赋值给formData
 */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) return
    copyValueToTarget(formData.value, data)
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
  if (!DescriptionFormRef) return
  return unref(DescriptionFormRef).validate((valid) => {
    if (!valid) {
      message.warning('商品详情为完善!!')
      emit('update:activeName', 'description')
      // 目的截断之后的校验
      throw new Error('商品详情为完善!!')
    } else {
      // 校验通过更新数据
      Object.assign(props.propFormData, formData.value)
    }
  })
}
defineExpose({ validate })
</script>
