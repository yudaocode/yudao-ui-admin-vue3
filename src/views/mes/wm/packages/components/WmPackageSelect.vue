<!-- MES 装箱单选择器：纯下拉，前端过滤（支持 code），用于选择父箱 -->
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
      :label="item.code"
      :value="item.id"
    >
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
import { WmPackageApi, WmPackageRespVO } from '@/api/mes/wm/packages'

defineOptions({ name: 'WmPackageSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
    excludeId?: number // 排除的 ID（避免选择自己作为父箱）
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择父箱'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: WmPackageRespVO | undefined]
}>()

const allList = ref<WmPackageRespVO[]>([])
const filteredList = ref<WmPackageRespVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 获取排除后的列表 */
const getAvailableList = () => {
  if (!props.excludeId) {
    return allList.value
  }
  return allList.value.filter((item) => item.id !== props.excludeId)
}

/** 前端过滤（code + clientName） */
const handleFilter = (query: string) => {
  const available = getAvailableList()
  if (!query) {
    filteredList.value = available
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = available.filter(
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

/** 加载装箱单列表（无父箱 + 已完成状态） */
const loadList = async () => {
  const data = await WmPackageApi.getPackageSimpleList()
  allList.value = Array.isArray(data) ? data : []
  filteredList.value = getAvailableList()
}

/** 监听 excludeId 变化 */
watch(
  () => props.excludeId,
  () => {
    filteredList.value = getAvailableList()
  }
)

/** 初始化 */
onMounted(async () => {
  await loadList()
})
</script>
