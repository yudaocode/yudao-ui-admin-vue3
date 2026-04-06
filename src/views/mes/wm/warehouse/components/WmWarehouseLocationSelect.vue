<!-- MES 库区选择器：纯下拉，前端过滤（支持 name、code），支持按仓库筛选，悬停 tooltip 展示详情 -->
<template>
  <el-tooltip :disabled="!selectedItem" placement="top" :show-after="500">
    <template #content>
      <div v-if="selectedItem" class="leading-6">
        <div>编码：{{ selectedItem.code || '-' }}</div>
        <div>名称：{{ selectedItem.name || '-' }}</div>
        <div>所属仓库：{{ selectedItem.warehouseName || '-' }}</div>
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
import { WmWarehouseLocationApi, WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'

defineOptions({ name: 'WmWarehouseLocationSelect', inheritAttrs: false })

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
  change: [item: WmWarehouseLocationVO | undefined]
}>()

const allList = ref<WmWarehouseLocationVO[]>([])
const filteredList = ref<WmWarehouseLocationVO[]>([])
const filterQuery = ref('') // 当前过滤关键字
const selectedItem = ref<WmWarehouseLocationVO | undefined>() // 当前选中的库区对象（用于 tooltip 展示）

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

/** 加载库区列表 */
const loadList = async () => {
  allList.value = await WmWarehouseLocationApi.getWarehouseLocationSimpleList(props.warehouseId)
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

/** 监听仓库变化，重新加载库区列表 */
watch(
  () => props.warehouseId,
  async () => {
    await loadList()
  }
)

/** 初始化 */
onMounted(async () => {
  await loadList()
})
</script>
