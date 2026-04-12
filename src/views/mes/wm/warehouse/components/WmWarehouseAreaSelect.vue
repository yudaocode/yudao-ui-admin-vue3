<!-- MES 库位选择器：纯下拉，前端过滤（支持 name、code），支持按库区筛选，悬停 tooltip 展示详情 -->
<template>
  <el-tooltip :disabled="!selectedItem" placement="top" :show-after="500">
    <template #content>
      <div v-if="selectedItem" class="leading-6">
        <div>编码：{{ selectedItem.code || '-' }}</div>
        <div>名称：{{ selectedItem.name || '-' }}</div>
        <div>所属仓库：{{ selectedItem.warehouseName || '-' }}</div>
        <div>所属库区：{{ selectedItem.locationName || '-' }}</div>
      </div>
    </template>
    <el-select
      v-bind="$attrs"
      v-model="selectValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      filterable
      :filter-method="handleFilter"
      class="!w-1/1"
      @change="handleChange"
    >
      <el-option v-for="item in filteredList" :key="item.id" :label="item.name" :value="item.id">
        <div class="flex items-center gap-8px">
          <span>{{ item.name }}</span>
          <el-tag v-if="item.code" size="small" type="info" class="ml-4px">
            编号: {{ item.code }}
          </el-tag>
        </div>
      </el-option>
    </el-select>
  </el-tooltip>
</template>

<script setup lang="ts">
import { WmWarehouseAreaApi, WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'

defineOptions({ name: 'WmWarehouseAreaSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    locationId?: number
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择库位'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: WmWarehouseAreaVO | undefined]
}>()

const allList = ref<WmWarehouseAreaVO[]>([])
const filteredList = ref<WmWarehouseAreaVO[]>([])
const filterQuery = ref('')
const selectedItem = ref<WmWarehouseAreaVO | undefined>() // 当前选中的库位对象（用于 tooltip 展示）

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（name + code） */
const handleFilter = (query: string) => {
  filterQuery.value = query
  applyFilter()
}

/** 应用过滤 */
const applyFilter = () => {
  if (!filterQuery.value) {
    filteredList.value = allList.value
    return
  }
  const keyword = filterQuery.value.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) =>
      item.name?.toLowerCase().includes(keyword) || item.code?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  selectedItem.value = item
  emit('change', item)
}

/** 加载库位列表 */
const loadList = async () => {
  allList.value = await WmWarehouseAreaApi.getWarehouseAreaSimpleList(props.locationId)
  applyFilter()
  // 列表加载完成后，回显 selectedItem
  if (props.modelValue != null) {
    selectedItem.value = allList.value.find((o) => o.id === props.modelValue)
  }
}

/** 根据 modelValue 同步 selectedItem（用于编辑回显） */
watch(
  () => props.modelValue,
  (val) => {
    if (val == null) {
      selectedItem.value = undefined
      return
    }
    if (selectedItem.value?.id !== val && allList.value.length > 0) {
      selectedItem.value = allList.value.find((o) => o.id === val)
    }
  }
)

/** 监听库区变化，重新加载库位列表 */
watch(
  () => props.locationId,
  async () => {
    await loadList()
  }
)

/** 初始化 */
onMounted(async () => {
  await loadList()
})
</script>
