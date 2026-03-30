<!-- MES 发货通知单选择器：纯下拉，前端过滤（支持 noticeCode、noticeName） -->
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
      :label="item.noticeName"
      :value="item.id"
    >
      <div class="flex items-center gap-8px">
        <span>{{ item.noticeName }}</span>
        <el-tag v-if="item.noticeCode" size="small" type="info" class="ml-4px">
          编号: {{ item.noticeCode }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { WmSalesNoticeApi, WmSalesNoticeVO } from '@/api/mes/wm/salesnotice'

defineOptions({ name: 'WmSalesNoticeSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
    status?: number
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择发货通知单'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: WmSalesNoticeVO | undefined]
}>()

const allList = ref<WmSalesNoticeVO[]>([])
const filteredList = ref<WmSalesNoticeVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（noticeCode + noticeName） */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = allList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) =>
      item.noticeName?.toLowerCase().includes(keyword) ||
      item.noticeCode?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载发货通知单列表 */
onMounted(async () => {
  allList.value = await WmSalesNoticeApi.getSalesNoticeSimpleList(props.status)
  filteredList.value = allList.value
})
</script>
