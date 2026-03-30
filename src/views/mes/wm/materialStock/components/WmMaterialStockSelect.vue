<!-- MES 库存选择器：一次加载，前端过滤（支持按 itemId 检索） -->
<template>
  <el-select
    v-model="selectValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    filterable
    :filter-method="handleFilter"
    class="!w-1/1"
    @change="handleChange"
  >
    <el-option
      v-for="item in filteredList"
      :key="item.id"
      :label="`${item.warehouseName} / ${item.batchCode || '-'} / 数量:${item.quantity}`"
      :value="item.id"
    >
      <div class="flex items-center gap-8px">
        <span
          >{{ item.warehouseName }} / {{ item.locationName || '-' }} /
          {{ item.areaName || '-' }}</span
        >
        <el-tag size="small" type="info" class="ml-4px">
          {{ item.batchCode || '无批次' }} | {{ item.quantity }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { WmMaterialStockApi, WmMaterialStockVO } from '@/api/mes/wm/materialstock'

defineOptions({ name: 'WmMaterialStockSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    itemId?: number
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择库存'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: WmMaterialStockVO | undefined]
}>()

const allList = ref<WmMaterialStockVO[]>([])
const filteredList = ref<WmMaterialStockVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（仓库名 + 批次号） */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = allList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) =>
      item.warehouseName?.toLowerCase().includes(keyword) ||
      item.batchCode?.toLowerCase().includes(keyword) ||
      item.areaName?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载库存列表 */
const loadData = async () => {
  const list: WmMaterialStockVO[] = await WmMaterialStockApi.getMaterialStockSimpleList(
    props.itemId
  )
  // 过滤掉冻结和零库存
  allList.value = list.filter((item) => !item.frozen && item.quantity > 0)
  filteredList.value = allList.value
}

/** 监听 itemId 变化重新加载 */
watch(
  () => props.itemId,
  () => {
    loadData()
  }
)

onMounted(() => {
  loadData()
})
</script>
