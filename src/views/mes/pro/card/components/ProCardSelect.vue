<!-- MES 流转卡选择器：一次加载全量，前端过滤（支持 code） -->
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
        <el-tag v-if="item.workOrderCode" size="small" type="info" class="ml-4px">
          {{ item.workOrderCode }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ProCardApi, ProCardVO } from '@/api/mes/pro/card'

defineOptions({ name: 'ProCardSelect' })

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
    placeholder: '请选择流转卡'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: ProCardVO | undefined]
}>()

const allList = ref<ProCardVO[]>([])
const filteredList = ref<ProCardVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（code + workOrderCode） */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = allList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) =>
      item.code?.toLowerCase().includes(keyword) ||
      item.workOrderCode?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载流转卡列表 */
onMounted(async () => {
  allList.value = await ProCardApi.getCardSimpleList()
  filteredList.value = allList.value
})
</script>
