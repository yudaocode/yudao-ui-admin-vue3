<!-- WMS 商品分类选择器 -->
<template>
  <el-tree-select
    v-bind="$attrs"
    v-model="selectValue"
    :data="categoryTree"
    :disabled="disabled"
    :props="defaultProps"
    check-strictly
    class="w-1/1"
    default-expand-all
    :placeholder="placeholder"
    value-key="id"
  />
</template>

<script lang="ts" setup>
import { defaultProps, handleTree } from '@/utils/tree'
import { ItemCategoryApi, ItemCategoryVO } from '@/api/wms/md/item/category'

/** WMS 商品分类选择器 */
defineOptions({ name: 'WmsItemCategorySelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    placeholder: '请选择商品分类'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const categoryTree = ref<ItemCategoryVO[]>([]) // 分类树

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 获得分类树 */
const getCategoryTree = async () => {
  const data = await ItemCategoryApi.getItemCategorySimpleList()
  categoryTree.value = handleTree(data, 'id', 'parentId')
}

/** 初始化 */
onMounted(async () => {
  await getCategoryTree()
})
</script>
