<!-- MES 生产工单选择器：纯下拉，前端过滤（支持 code、name） -->
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
import { ProWorkOrderApi, ProWorkOrderVO } from '@/api/mes/pro/workorder'

defineOptions({ name: 'ProWorkOrderSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    type?: number
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择工单'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: ProWorkOrderVO | undefined]
}>()

const allList = ref<ProWorkOrderVO[]>([])
const filteredList = ref<ProWorkOrderVO[]>([])

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
      item.code?.toLowerCase().includes(keyword) || item.name?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载工单列表 */
const loadData = async () => {
  allList.value = await ProWorkOrderApi.getWorkOrderSimpleList(props.type)
  filteredList.value = allList.value
}

/** 监听 type 变化重新加载 */
watch(
  () => props.type,
  () => {
    loadData()
  }
)

onMounted(() => {
  loadData()
})
</script>
