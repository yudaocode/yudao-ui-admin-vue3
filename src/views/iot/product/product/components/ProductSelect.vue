<!-- 产品下拉选择器组件 -->
<template>
  <el-select
    :model-value="modelValue"
    @update:model-value="handleChange"
    placeholder="请选择产品"
    filterable
    clearable
    class="w-full"
    :loading="loading"
  >
    <el-option
      v-for="product in productList"
      :key="product.id"
      :label="product.name"
      :value="product.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import { ProductApi } from '@/api/iot/product/product'

/** 产品下拉选择器组件 */
defineOptions({ name: 'ProductSelect' })

const props = defineProps<{
  modelValue?: number
  deviceType?: number // 设备类型过滤
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value?: number): void
  (e: 'change', value?: number): void
}>()

const loading = ref(false) // 产品加载状态
const productList = ref<any[]>([]) // 产品列表

/**
 * 处理选择变化事件
 *
 * @param value 选中的产品 ID
 */
const handleChange = (value?: number) => {
  emit('update:modelValue', value)
  emit('change', value)
}

/** 获取产品列表 */
const getProductList = async () => {
  try {
    loading.value = true
    const res = await ProductApi.getSimpleProductList(props.deviceType)
    productList.value = res || []
  } finally {
    loading.value = false
  }
}

/** 组件挂载时获取产品列表 */
onMounted(() => {
  getProductList()
})
</script>
