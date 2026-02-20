<!-- MES 点检保养方案选择器：远程搜索下拉（支持 name、code） -->
<template>
  <el-select
    v-model="selectValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    filterable
    remote
    remote-show-suffix
    reserve-keyword
    :remote-method="handleRemoteSearch"
    class="!w-1/1"
    @change="handleChange"
  >
    <el-option v-for="item in optionList" :key="item.id" :label="item.name" :value="item.id">
      <div class="flex items-center gap-8px">
        <span>{{ item.name }}</span>
        <el-tag v-if="item.code" size="small" type="info" class="ml-4px">{{ item.code }}</el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { DvCheckPlanApi, DvCheckPlanVO } from '@/api/mes/dv/checkplan'

defineOptions({ name: 'DvCheckPlanSelect' })

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
    placeholder: '请选择保养计划'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: DvCheckPlanVO | undefined]
}>()

const optionList = ref<DvCheckPlanVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 远程搜索 */
const handleRemoteSearch = async (query: string) => {
  try {
    const data = await DvCheckPlanApi.getCheckPlanPage({ name: query, pageNo: 1, pageSize: 20 })
    optionList.value = data.list
  } catch {}
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = optionList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 回显：根据 modelValue 加载初始选项 */
watch(
  () => props.modelValue,
  async (val) => {
    if (val && !optionList.value.find((o) => o.id === val)) {
      const item = await DvCheckPlanApi.getCheckPlan(val)
      if (item) optionList.value = [item, ...optionList.value]
    }
  },
  { immediate: true }
)
</script>
