<!-- MES 批次选择器：一次加载全量，前端过滤（支持 code） -->
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
    <el-option v-for="item in filteredList" :key="item.id" :label="item.code" :value="item.id">
      <div class="flex items-center gap-8px">
        <span>{{ item.code }}</span>
        <el-tag v-if="item.itemCode" size="small" type="info" class="ml-4px">
          {{ item.itemCode }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { BatchApi, BatchVO } from '@/api/mes/wm/batch'

defineOptions({ name: 'WmBatchSelect' })

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
    placeholder: '请选择批次'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: BatchVO | undefined]
}>()

const allList = ref<BatchVO[]>([])
const filteredList = ref<BatchVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（code） */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = allList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) =>
      item.code?.toLowerCase().includes(keyword) || item.itemCode?.toLowerCase().includes(keyword)
  )
}

/** 监听 itemId 变化，前端过滤（如果是基于 itemId 的过滤） */
watch(
  () => props.itemId,
  (val) => {
    if (val) {
      filteredList.value = allList.value.filter((item) => item.itemId === val)
    } else {
      filteredList.value = allList.value
    }
  }
)

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载批次列表 */
onMounted(async () => {
  allList.value = await BatchApi.getBatchSimpleList()
  if (props.itemId) {
    filteredList.value = allList.value.filter((item) => item.itemId === props.itemId)
  } else {
    filteredList.value = allList.value
  }
})
</script>
