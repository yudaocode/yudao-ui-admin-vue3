<!-- MES 到货通知单选择器：纯下拉，前端过滤（支持 code、vendorName），支持按状态筛选 -->
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
        <el-tag v-if="item.vendorName" size="small" type="info" class="ml-4px">
          {{ item.vendorName }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { WmArrivalNoticeApi, WmArrivalNoticeVO } from '@/api/mes/wm/arrivalnotice'

defineOptions({ name: 'WmArrivalNoticeSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    status?: number
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择到货通知单'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: WmArrivalNoticeVO | undefined]
}>()

const allList = ref<WmArrivalNoticeVO[]>([])
const filteredList = ref<WmArrivalNoticeVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（code + vendorName） */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = allList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) =>
      item.code?.toLowerCase().includes(keyword) || item.vendorName?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载列表 */
const loadList = async () => {
  allList.value = await WmArrivalNoticeApi.getArrivalNoticeSimpleList(props.status)
  filteredList.value = allList.value
}

/** 监听状态变化，重新加载列表 */
watch(
  () => props.status,
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
