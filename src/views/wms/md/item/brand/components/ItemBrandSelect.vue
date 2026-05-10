<!-- WMS 商品品牌选择器 -->
<template>
  <el-select
    v-bind="$attrs"
    v-model="selectValue"
    :clearable="clearable"
    :disabled="disabled"
    :filter-method="handleFilter"
    :placeholder="placeholder"
    class="w-1/1"
    filterable
    @change="handleChange"
  >
    <el-option
      v-for="brand in filteredList"
      :key="brand.id!"
      :label="brand.name"
      :value="brand.id!"
    />
  </el-select>
</template>

<script lang="ts" setup>
import { ItemBrandApi, ItemBrandVO } from '@/api/wms/md/item/brand'

/** WMS 商品品牌选择器 */
defineOptions({ name: 'WmsItemBrandSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择商品品牌'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [brand: ItemBrandVO | undefined]
}>()

const brandList = ref<ItemBrandVO[]>([]) // 品牌列表
const filteredList = ref<ItemBrandVO[]>([]) // 过滤后的品牌列表

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 前端过滤 */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = brandList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = brandList.value.filter((brand) =>
    brand.name?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (value: number | undefined) => {
  emit(
    'change',
    brandList.value.find((brand) => brand.id === value)
  )
}

/** 初始化 */
onMounted(async () => {
  brandList.value = await ItemBrandApi.getItemBrandSimpleList()
  filteredList.value = brandList.value
})
</script>
