<template>
  <el-select
    :clearable="clearable"
    :disabled="disabled"
    :filterable="filterable"
    :loading="loading"
    :model-value="modelValue"
    :multiple="multiple"
    :placeholder="placeholder"
    collapse-tags
    collapse-tags-tooltip
    class="w-full"
    @update:model-value="handleChange"
  >
    <el-option
      v-for="item in auxiliaryTypeList"
      :key="item.id"
      :label="item.name"
      :value="item.id!"
    />
  </el-select>
</template>

<script lang="ts" setup>
import { parseId, isIdType } from '@/utils/id'

import { FmsAuxiliaryTypeApi } from '@/api/fms/config/auxiliary/type'
import type { FmsAuxiliaryTypeOptionVO } from '@/api/fms/config/auxiliary/type'
import { useFmsStore } from '@/views/fms/store/fms'

defineOptions({ name: 'FmsAuxiliaryTypeSelect' })

withDefaults(
  defineProps<{
    modelValue?: number | number[]
    multiple?: boolean
    disabled?: boolean
    clearable?: boolean
    filterable?: boolean
    placeholder?: string
  }>(),
  {
    multiple: false,
    disabled: false,
    clearable: true,
    filterable: true,
    placeholder: '请选择辅助核算'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
  change: [value: number | number[] | undefined]
  loaded: [list: FmsAuxiliaryTypeOptionVO[]]
}>()

const fmsStore = useFmsStore() // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const loading = ref(false) // 辅助核算类别列表的加载中
const auxiliaryTypeList = ref<FmsAuxiliaryTypeOptionVO[]>([]) // 辅助核算类别列表

/** 选中变化 */
function handleChange(value: unknown) {
  if (Array.isArray(value)) {
    const typeIds = value.map(parseId).filter(isIdType)
    emit('update:modelValue', typeIds)
    emit('change', typeIds)
    return
  }
  const typeId = parseId(value)
  emit('update:modelValue', typeId)
  emit('change', typeId)
}

/** 获得辅助核算类别列表 */
async function getAuxiliaryTypeList() {
  if (!accountSetId.value) {
    auxiliaryTypeList.value = []
    return
  }
  loading.value = true
  try {
    auxiliaryTypeList.value = await FmsAuxiliaryTypeApi.getAuxiliaryTypeSimpleList(
      accountSetId.value
    )
    emit('loaded', auxiliaryTypeList.value)
  } finally {
    loading.value = false
  }
}

/** 初始化并监听账套切换 */
watch(accountSetId, getAuxiliaryTypeList, { immediate: true })
</script>
