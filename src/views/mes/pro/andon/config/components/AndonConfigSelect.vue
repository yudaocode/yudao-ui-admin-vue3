<!-- MES 安灯配置选择器：纯下拉，前端过滤（支持 reason），选中后可获取完整配置 -->
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
      :label="item.reason"
      :value="item.id"
    >
      <div class="flex items-center gap-8px">
        <span>{{ item.reason }}</span>
        <dict-tag :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="item.level" />
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ProAndonConfigApi, ProAndonConfigVO } from '@/api/mes/pro/andon/config'
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'AndonConfigSelect' })

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
    placeholder: '请选择呼叫原因'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: ProAndonConfigVO | undefined]
}>()

const allList = ref<ProAndonConfigVO[]>([])
const filteredList = ref<ProAndonConfigVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（reason） */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = allList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) => item.reason?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载配置列表 */
onMounted(async () => {
  allList.value = await ProAndonConfigApi.getAndonConfigList()
  filteredList.value = allList.value
})
</script>
