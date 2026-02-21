<!-- MES 生产任务选择器：纯下拉，前端过滤（支持 code、name），可按工单过滤 -->
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
        <el-tag v-if="item.name" size="small" type="info" class="ml-4px">
          {{ item.name }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ProTaskApi, ProTaskVO } from '@/api/mes/pro/task'

defineOptions({ name: 'ProTaskSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    workOrderId?: number
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择任务'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: ProTaskVO | undefined]
}>()

const allList = ref<ProTaskVO[]>([])
const filteredList = ref<ProTaskVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（code + name） */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = allList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) =>
      item.code?.toLowerCase().includes(keyword) ||
      item.name?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载任务列表 */
const loadData = async () => {
  try {
    allList.value = await ProTaskApi.getTaskSimpleList(props.workOrderId)
    filteredList.value = allList.value
  } catch {
    allList.value = []
    filteredList.value = []
  }
}

/** 监听 workOrderId 变化，重新加载 */
watch(
  () => props.workOrderId,
  () => {
    allList.value = []
    filteredList.value = []
    if (props.workOrderId) {
      loadData()
    }
  }
)

onMounted(() => {
  if (props.workOrderId) {
    loadData()
  }
})
</script>
