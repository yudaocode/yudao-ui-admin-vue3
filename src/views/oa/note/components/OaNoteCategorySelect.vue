<template>
  <el-select
    :model-value="modelValue"
    :disabled="disabled"
    :clearable="clearable"
    :filterable="filterable"
    :placeholder="placeholder"
    :loading="loading"
    @update:model-value="handleChange"
  >
    <el-option
      v-for="category in categories ?? categoryList"
      :key="category.id"
      :label="category.name"
      :value="category.id!"
    />
  </el-select>
</template>

<script setup lang="ts">
import * as NoteCategoryApi from '@/api/oa/note/category'

defineOptions({ name: 'OaNoteCategorySelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    categories?: NoteCategoryApi.OaNoteCategoryVO[]
    disabled?: boolean
    clearable?: boolean
    filterable?: boolean
    placeholder?: string
  }>(),
  { disabled: false, clearable: true, filterable: true, placeholder: '请选择分类' }
)
const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>() // 选中分类变更事件
const categoryList = ref<NoteCategoryApi.OaNoteCategoryVO[]>([]) // 分类列表
const loading = ref(false) // 分类加载中

/** 选中变化 */
function handleChange(value: unknown) {
  emit('update:modelValue', typeof value === 'number' ? value : undefined)
}

/** 查询分类列表 */
async function getCategoryList() {
  // 已有分类列表时直接复用，避免重复请求
  if (props.categories !== undefined) return
  loading.value = true
  try {
    categoryList.value = await NoteCategoryApi.getSimpleNoteCategoryList()
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getCategoryList()
})
</script>
