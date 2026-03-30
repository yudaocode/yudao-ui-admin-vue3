<!-- MES 到货通知单行选择器：纯下拉，前端过滤（支持 itemCode、itemName），支持按到货通知单筛选 -->
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
      :label="`${item.itemCode} - ${item.itemName}`"
      :value="item.id"
    >
      <div class="flex items-center gap-8px">
        <span>{{ item.itemCode }}</span>
        <span class="text-gray-500">{{ item.itemName }}</span>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { WmArrivalNoticeLineApi, WmArrivalNoticeLineVO } from '@/api/mes/wm/arrivalnotice/line'

defineOptions({ name: 'WmArrivalNoticeLineSelect' })

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
    placeholder: '请选择到货通知单行'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: WmArrivalNoticeLineVO | undefined]
}>()

const allList = ref<WmArrivalNoticeLineVO[]>([])
const filteredList = ref<WmArrivalNoticeLineVO[]>([])

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
  allList.value = await WmArrivalNoticeLineApi.getArrivalNoticeLineListByNoticeId(props.noticeId)
  filteredList.value = allList.value
}

/** 监听 noticeId 变化，重新加载列表 */
watch(
  () => props.noticeId,
  async () => {
    selectValue.value = undefined
    await loadList()
  }
)

/** 初始化 */
onMounted(async () => {
  await loadList()
})
</script>
