<template>
  <!-- 情况一：添加/修改 -->
  <el-form
    v-if="!isDetail"
    ref="descriptionFormRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
  >
    <!--富文本编辑器组件-->
    <el-form-item label="商品详情" prop="description">
      <Editor v-model:modelValue="formData.description" />
    </el-form-item>
  </el-form>

  <!-- 情况二：详情 -->
  <Descriptions
    v-if="isDetail"
    :data="formData"
    :schema="allSchemas.detailSchema"
    class="descriptionFormDescriptions"
  >
    <!-- 展示 HTML 内容 -->
    <template #description="{ row }">
      <div v-dompurify-html="row.description" style="width: 600px"></div>
    </template>
  </Descriptions>
</template>
<script lang="ts" setup>
import type { Spu } from '@/api/mall/product/spu'
import { Editor } from '@/components/Editor'
import { PropType } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { copyValueToTarget } from '@/utils'
import { descriptionSchema } from './spu.data'

defineOptions({ name: 'DescriptionForm' })

const message = useMessage() // 消息弹窗

const { allSchemas } = useCrudSchemas(descriptionSchema)
const props = defineProps({
  propFormData: {
    type: Object as PropType<Spu>,
    default: () => {}
  },
  activeName: propTypes.string.def(''),
  isDetail: propTypes.bool.def(false) // 是否作为详情组件
})
const descriptionFormRef = ref() // 表单Ref
const formData = ref<Spu>({
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
    // fix：三个表单组件监听赋值必须使用 copyValueToTarget 使用 formData.value = data 会监听非常多次
    copyValueToTarget(formData.value, data)
  },
  {
    // fix: 去掉深度监听只有对象引用发生改变的时候才执行,解决改一动多的问题
    immediate: true
  }
)

/**
 * 表单校验
 */
const emit = defineEmits(['update:activeName'])
const validate = async () => {
  // 校验表单
  if (!descriptionFormRef) return
  return await unref(descriptionFormRef).validate((valid) => {
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
