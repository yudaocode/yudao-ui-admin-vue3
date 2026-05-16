<!-- WMS 仓库选择器 -->
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
      v-for="warehouse in filteredList"
      :key="warehouse.id!"
      :label="warehouse.name"
      :value="warehouse.id!"
    />
  </el-select>
</template>

<script lang="ts" setup>
import { WarehouseApi, WarehouseVO } from '@/api/wms/md/warehouse'

/** WMS 仓库选择器 */
defineOptions({ name: 'WmsWarehouseSelect', inheritAttrs: false })

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
    placeholder: '请选择仓库'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [warehouse: WarehouseVO | undefined]
}>()

const warehouseList = ref<WarehouseVO[]>([]) // 仓库列表
const filteredList = ref<WarehouseVO[]>([]) // 过滤后的仓库列表

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 前端过滤 */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = warehouseList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = warehouseList.value.filter((warehouse) =>
    warehouse.name?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (value: number | undefined) => {
  emit(
    'change',
    warehouseList.value.find((warehouse) => warehouse.id === value)
  )
}

/** 初始化 */
onMounted(async () => {
  warehouseList.value = await WarehouseApi.getWarehouseSimpleList()
  filteredList.value = warehouseList.value
})
</script>
