<!-- 商品发布 - 商品详情 -->
<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" :disabled="isDetail">
    <!--富文本编辑器组件-->
    <el-form-item label="商品详情" prop="description">
      <Editor v-model:modelValue="formData.description" />
    </el-form-item>
  </el-form>
</template>
<script lang="ts" setup>
import type { Spu } from '@/api/mall/product/spu'
import { Editor } from '@/components/Editor'
import { PropType } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { copyValueToTarget } from '@/utils'

defineOptions({ name: 'ProductDescriptionForm' })

const message = useMessage() // 消息弹窗

const props = defineProps({
  propFormData: {
    type: Object as PropType<Spu>,
    default: () => {}
  },
  activeName: propTypes.string.def(''),
  isDetail: propTypes.bool.def(false) // 是否作为详情组件
})
const formRef = ref() // 表单Ref
const formData = ref<Spu>({
  description: '' // 商品详情
})
// 表单规则
const rules = reactive({
  description: [required]
})

/** 富文本编辑器如果输入过再清空会有残留，需再重置一次 */
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

/** 将传进来的值赋值给 formData */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) return
    // fix：三个表单组件监听赋值必须使用 copyValueToTarget 使用 formData.value = data 会监听非常多次
    copyValueToTarget(formData.value, data)
  },
  {
    // fix: 去掉深度监听只有对象引用发生改变的时候才执行,解决改一动多的问题
    immediate: true
  }
)

/** 表单校验 */
const emit = defineEmits(['update:activeName'])
const validate = async () => {
  if (!formRef) return
  try {
    await unref(formRef)?.validate()
    // 校验通过更新数据
    Object.assign(props.propFormData, formData.value)
  } catch (e) {
    message.error('【商品详情】不完善，请填写相关信息')
    emit('update:activeName', 'description')
    throw e // 目的截断之后的校验
  }
}
defineExpose({ validate })
</script>
