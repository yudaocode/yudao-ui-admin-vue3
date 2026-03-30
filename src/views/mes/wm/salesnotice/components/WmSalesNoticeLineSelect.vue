<!-- MES 发货通知单行选择器：纯下拉，前端过滤（支持 itemCode、itemName），支持按发货通知单筛选 -->
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
    <el-option v-for="item in filteredList" :key="item.id" :label="`${item.itemCode} - ${item.itemName}`" :value="item.id">
      <div class="flex items-center gap-8px">
        <span>{{ item.itemCode }}</span>
        <span class="text-gray-500">{{ item.itemName }}</span>
        <el-tag size="small" type="info" class="ml-4px">{{ item.quantity }}</el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { WmSalesNoticeLineApi, WmSalesNoticeLineVO } from '@/api/mes/wm/salesnotice/line'

defineOptions({ name: 'WmSalesNoticeLineSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    noticeId?: number
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择发货通知单行'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: WmSalesNoticeLineVO | undefined]
}>()

const allList = ref<WmSalesNoticeLineVO[]>([])
const filteredList = ref<WmSalesNoticeLineVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（itemCode + itemName） */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = allList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) =>
      item.itemCode?.toLowerCase().includes(keyword) ||
      item.itemName?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载列表 */
const loadList = async () => {
  if (!props.noticeId) {
    allList.value = []
    filteredList.value = []
    return
  }
  const data = await WmSalesNoticeLineApi.getSalesNoticeLinePage({
    pageNo: 1,
    pageSize: 100,
    noticeId: props.noticeId
  })
  allList.value = data.list
  filteredList.value = allList.value
}

/** 监听 noticeId 变化重新加载 */
watch(() => props.noticeId, () => {
  loadList()
})

onMounted(() => {
  loadList()
})
</script>
