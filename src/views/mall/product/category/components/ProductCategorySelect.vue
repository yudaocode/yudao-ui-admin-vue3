<template>
  <el-tree-select
    v-model="selectCategoryId"
    :data="categoryList"
    :props="defaultProps"
    :multiple="multiple"
    :show-checkbox="multiple"
    class="w-1/1"
    node-key="id"
    placeholder="请选择商品分类"
  />
</template>
<script lang="ts" setup>
import { defaultProps, handleTree } from '@/utils/tree'
import * as ProductCategoryApi from '@/api/mall/product/category'
import { oneOfType } from 'vue-types'
import { propTypes } from '@/utils/propTypes'

/** 商品分类选择组件 */
defineOptions({ name: 'ProductCategorySelect' })

const props = defineProps({
  modelValue: oneOfType([propTypes.number.def(undefined), propTypes.array.def([])]).def(undefined), // 选中的ID
  multiple: propTypes.bool.def(false) // 是否多选
})

/** 选中的分类 ID */
const selectCategoryId = computed({
  get: () => {
    return props.modelValue
  },
  set: (val: number | number[]) => {
    emit('update:modelValue', val)
  }
})

/** 分类选择 */
const emit = defineEmits(['update:modelValue'])

/** 初始化 **/
const categoryList = ref([]) // 分类树
onMounted(async () => {
  // 获得分类树
  const data = await ProductCategoryApi.getCategoryList({})
  categoryList.value = handleTree(data, 'id', 'parentId')
})
</script>
