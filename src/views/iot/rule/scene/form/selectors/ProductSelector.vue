<!-- 产品选择器组件 -->
<template>
  <el-select
    :model-value="modelValue"
    @update:model-value="handleChange"
    placeholder="请选择产品"
    filterable
    clearable
    class="w-full"
    :loading="productLoading"
  >
    <el-option
      v-for="product in productList"
      :key="product.id"
      :label="product.name"
      :value="product.id"
    >
      <div class="flex items-center justify-between w-full py-4px">
        <div class="flex-1">
          <div class="text-14px font-500 text-[var(--el-text-color-primary)] mb-2px">
            {{ product.name }}
          </div>
          <div class="text-12px text-[var(--el-text-color-secondary)]">
            {{ product.productKey }}
          </div>
        </div>
        <dict-tag :type="DICT_TYPE.IOT_PRODUCT_STATUS" :value="product.status" />
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ProductApi } from '@/api/iot/product/product'
import { DICT_TYPE } from '@/utils/dict'

/** 产品选择器组件 */
defineOptions({ name: 'ProductSelector' })

defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value?: number): void
  (e: 'change', value?: number): void
}>()

const productLoading = ref(false) // 产品加载状态
const productList = ref<any[]>([]) // 产品列表

/**
 * 处理选择变化事件
 * @param value 选中的产品 ID
 */
const handleChange = (value?: number) => {
  emit('update:modelValue', value)
  emit('change', value)
}

/** 获取产品列表 */
const getProductList = async () => {
  try {
    productLoading.value = true
    const res = await ProductApi.getSimpleProductList()
    productList.value = res || []
  } catch (error) {
    console.error('获取产品列表失败:', error)
    productList.value = []
  } finally {
    productLoading.value = false
  }
}

// 组件挂载时获取产品列表
onMounted(() => {
  getProductList()
})
</script>
