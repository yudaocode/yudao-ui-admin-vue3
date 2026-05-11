<!-- WMS 库区选择器 -->
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
    <el-option v-for="area in filteredList" :key="area.id!" :label="area.name" :value="area.id!" />
  </el-select>
</template>

<script lang="ts" setup>
import { WarehouseAreaApi, WarehouseAreaVO } from '@/api/wms/md/warehouse/area'

/** WMS 库区选择器 */
defineOptions({ name: 'WmsWarehouseAreaSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    warehouseId?: number
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择库区'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [area: WarehouseAreaVO | undefined]
}>()

const areaList = ref<WarehouseAreaVO[]>([]) // 库区列表
const filteredList = ref<WarehouseAreaVO[]>([]) // 过滤后的库区列表

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 前端过滤 */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = areaList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = areaList.value.filter((area) => area.name?.toLowerCase().includes(keyword))
}

/** 选中变化 */
const handleChange = (value: number | undefined) => {
  emit(
    'change',
    areaList.value.find((area) => area.id === value)
  )
}

/** 获得库区列表 */
const getAreaList = async () => {
  try {
    areaList.value = await WarehouseAreaApi.getWarehouseAreaSimpleList(props.warehouseId)
    filteredList.value = areaList.value
  } catch {
    areaList.value = []
    filteredList.value = []
  }
}

/** 监听仓库变化 */
watch(() => props.warehouseId, getAreaList, { immediate: true })
</script>
