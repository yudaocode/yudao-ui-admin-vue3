<!-- MES 盘点方案选择器：纯下拉，展示已启用方案（支持 code、name） -->
<template>
  <el-select
    v-model="selectValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    filterable
    class="!w-full"
    @change="handleChange"
  >
    <el-option
      v-for="plan in planList"
      :key="plan.id"
      :label="plan.name || plan.code"
      :value="plan.id"
    >
      <span>{{ plan.code }}</span>
      <span class="ml-8px text-[var(--el-text-color-secondary)]">{{ plan.name }}</span>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { StockTakingPlanApi, type StockTakingPlanVO } from '@/api/mes/wm/stocktaking/plan/index'

defineOptions({ name: 'StockTakingPlanSelect' })

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
    placeholder: '请选择盘点方案'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: StockTakingPlanVO | undefined]
}>()

const planList = ref<StockTakingPlanVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = planList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载盘点方案列表 */
onMounted(async () => {
  planList.value = await StockTakingPlanApi.getEnabledConfirmedStockTakingPlanSimpleList()
})
</script>
