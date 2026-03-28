<!-- MES 物料产品选择器：纯下拉，前端过滤（支持 name、code） -->
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
    <el-option v-for="item in filteredList" :key="item.id" :label="item.name" :value="item.id">
      <div class="flex items-center gap-8px">
        <span>{{ item.name }}</span>
        <el-tag v-if="item.code" size="small" type="info" class="ml-4px">
          编号: {{ item.code }}
        </el-tag>
        <el-tag v-if="item.specification" size="small" type="info" class="ml-4px">
          规格: {{ item.specification }}
        </el-tag>
        <el-tag v-if="item.unitMeasureName" size="small" type="info" class="ml-4px">
          单位: {{ item.unitMeasureName }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { MdItemApi, MdItemVO } from '@/api/mes/md/item'

defineOptions({ name: 'MdItemSelect' })

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
    placeholder: '请选择产品'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: MdItemVO | undefined]
}>()

const allList = ref<MdItemVO[]>([]) // 全量数据
const filteredList = ref<MdItemVO[]>([]) // 过滤后数据

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（name + code） */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = allList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) =>
      item.name?.toLowerCase().includes(keyword) || item.code?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载物料列表 */
onMounted(async () => {
  allList.value = await MdItemApi.getItemSimpleList()
  filteredList.value = allList.value
})
</script>
