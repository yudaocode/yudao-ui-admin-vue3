<!-- MES 车间选择器：纯下拉，前端过滤（支持 name、code），悬停 tooltip 展示详情 -->
<template>
  <el-tooltip :disabled="!selectedItem" placement="top" :show-after="500">
    <template #content>
      <div v-if="selectedItem" class="leading-6">
        <div>编码：{{ selectedItem.code || '-' }}</div>
        <div>名称：{{ selectedItem.name || '-' }}</div>
        <div>面积：{{ selectedItem.area != null ? selectedItem.area + ' ㎡' : '-' }}</div>
        <div>负责人：{{ selectedItem.chargeUserName || '-' }}</div>
      </div>
    </template>
    <el-select
      v-bind="$attrs"
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
        </div>
      </el-option>
    </el-select>
  </el-tooltip>
</template>

<script setup lang="ts">
import { MdWorkshopApi, MdWorkshopVO } from '@/api/mes/md/workstation/workshop'

defineOptions({ name: 'MdWorkshopSelect', inheritAttrs: false })

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
    placeholder: '请选择车间'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: MdWorkshopVO | undefined]
}>()

const allList = ref<MdWorkshopVO[]>([])
const filteredList = ref<MdWorkshopVO[]>([])
const selectedItem = ref<MdWorkshopVO | undefined>() // 当前选中的车间对象（用于 tooltip 展示）

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
  selectedItem.value = item
  emit('change', item)
}

/** 根据 modelValue 同步 selectedItem（用于编辑回显） */
watch(
  () => props.modelValue,
  (val) => {
    if (val == null) {
      selectedItem.value = undefined
      return
    }
    // 仅在列表已加载且当前 selectedItem 不匹配时更新
    if (selectedItem.value?.id !== val && allList.value.length > 0) {
      selectedItem.value = allList.value.find((o) => o.id === val)
    }
  }
)

/** 加载车间列表 */
onMounted(async () => {
  allList.value = await MdWorkshopApi.getWorkshopSimpleList()
  filteredList.value = allList.value
  // 列表加载完成后，回显 selectedItem
  if (props.modelValue != null) {
    selectedItem.value = allList.value.find((o) => o.id === props.modelValue)
  }
})
</script>
