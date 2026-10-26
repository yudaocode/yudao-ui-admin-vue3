<template>
  <el-select
    :clearable="clearable"
    :disabled="disabled"
    :filterable="filterable"
    :loading="loading"
    :model-value="modelValue"
    :multiple="multiple"
    :placeholder="placeholder"
    class="w-full"
    @update:model-value="handleChange"
  >
    <el-option
      v-for="item in auxiliaryItemList"
      :key="item.id"
      :label="`${item.code} ${item.name}`"
      :value="item.id"
    />
  </el-select>
</template>

<script lang="ts" setup>
import { parseId, isIdType } from '@/utils/id'

import { FmsAuxiliaryItemApi } from '@/api/fms/config/auxiliary/item'
import type { FmsAuxiliaryItemOptionVO } from '@/api/fms/config/auxiliary/item'
import { useFmsStore } from '@/views/fms/store/fms'

defineOptions({ name: 'FmsAuxiliaryItemSelect' })

const props = withDefaults(
  defineProps<{
    auxiliaryTypeId?: number // 辅助核算类别编号
    modelValue?: number | number[]
    multiple?: boolean
    disabled?: boolean
    clearable?: boolean
    filterable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    filterable: true,
    multiple: false,
    placeholder: '请选择'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
  change: [item: FmsAuxiliaryItemOptionVO | FmsAuxiliaryItemOptionVO[] | undefined]
}>()

const fmsStore = useFmsStore() // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const loading = ref(false) // 辅助核算项目列表的加载中
const auxiliaryItemList = ref<FmsAuxiliaryItemOptionVO[]>([]) // 辅助核算项目列表

/** 选中变化 */
function handleChange(value: unknown) {
  if (Array.isArray(value)) {
    const itemIds = value.map(parseId).filter(isIdType)
    emit('update:modelValue', itemIds)
    emit(
      'change',
      auxiliaryItemList.value.filter((item) => itemIds.includes(item.id))
    )
    return
  }
  const itemId = parseId(value)
  emit('update:modelValue', itemId)
  emit(
    'change',
    auxiliaryItemList.value.find((item) => item.id === itemId)
  )
}

/** 获得辅助核算项目列表 */
async function getAuxiliaryItemList() {
  if (!accountSetId.value || !props.auxiliaryTypeId) {
    auxiliaryItemList.value = []
    return
  }
  loading.value = true
  try {
    auxiliaryItemList.value = await FmsAuxiliaryItemApi.getAuxiliaryItemSimpleList(
      accountSetId.value,
      props.auxiliaryTypeId
    )
  } finally {
    loading.value = false
  }
}

/** 初始化并监听账套和类别切换 */
watch([accountSetId, () => props.auxiliaryTypeId], getAuxiliaryItemList, { immediate: true })
</script>
