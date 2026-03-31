<!-- MES 装箱单选择器（条码用）：一次加载全量，前端过滤（支持 code） -->
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
        <el-tag v-if="item.clientName" size="small" type="info" class="ml-4px">
          {{ item.clientName }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { WmPackageApi, WmPackageVO } from '@/api/mes/wm/packages'

defineOptions({ name: 'BarcodePackageSelect' })

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
    placeholder: '请选择装箱单'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: WmPackageVO | undefined]
}>()

const allList = ref<WmPackageVO[]>([])
const filteredList = ref<WmPackageVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（code + clientName） */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = allList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) =>
      item.code?.toLowerCase().includes(keyword) ||
      item.clientName?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载装箱单列表 */
onMounted(async () => {
  const data = await WmPackageApi.getPackageSimpleList()
  allList.value = Array.isArray(data) ? data : []
  filteredList.value = allList.value
})
</script>
