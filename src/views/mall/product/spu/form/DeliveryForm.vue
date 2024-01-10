<template>
  <el-form
    ref="productSpuBasicInfoRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    :disabled="isDetail"
  >
    <!-- TODO 芋艿：宽度！！ -->
    <!-- TODO 芋艿：这里要挪出去 -->
    <el-form-item label="运费模板" prop="deliveryTemplateId">
      <el-select v-model="formData.deliveryTemplateId" placeholder="请选择">
        <el-option
          v-for="item in deliveryTemplateList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>
  </el-form>
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import { copyValueToTarget } from '@/utils'
import { propTypes } from '@/utils/propTypes'
import type { Spu } from '@/api/mall/product/spu'
import * as ExpressTemplateApi from '@/api/mall/trade/delivery/expressTemplate'

defineOptions({ name: 'ProductSpuBasicInfoForm' })

const message = useMessage() // 消息弹窗

const props = defineProps({
  propFormData: {
    type: Object as PropType<Spu>,
    default: () => {}
  },
  activeName: propTypes.string.def(''),
  isDetail: propTypes.bool.def(false) // 是否作为详情组件
})
const productSpuBasicInfoRef = ref() // 表单 Ref
const formData = reactive<Spu>({
  deliveryTemplateId: undefined // 运费模版
})
const rules = reactive({
  deliveryTemplateId: [required]
})

/**
 * 将传进来的值赋值给 formData
 */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) {
      return
    }
    copyValueToTarget(formData, data)
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
  if (!productSpuBasicInfoRef) return
  return await unref(productSpuBasicInfoRef).validate((valid) => {
    if (!valid) {
      message.warning('商品信息未完善！！')
      emit('update:activeName', 'delivery')
      // 目的截断之后的校验
      throw new Error('商品信息未完善！！')
    } else {
      // 校验通过更新数据
      Object.assign(props.propFormData, formData)
    }
  })
}
defineExpose({ validate })

const deliveryTemplateList = ref([]) // 运费模版
onMounted(async () => {
  deliveryTemplateList.value = await ExpressTemplateApi.getSimpleTemplateList()
})
</script>
