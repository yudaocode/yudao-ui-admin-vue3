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
    class="!w-1/1"
    @update:model-value="handleChange"
  >
    <el-option
      v-for="item in currencyList"
      :key="item.id"
      :label="`${item.code} ${item.name}`"
      :value="item.id!"
    />
  </el-select>
</template>

<script lang="ts" setup>
import { parseId, isIdType } from '@/utils/id'

import { FmsCurrencyApi } from '@/api/fms/config/currency'
import type { FmsCurrencyVO } from '@/api/fms/config/currency'
import { useFmsStore } from '@/views/fms/store/fms'

defineOptions({ name: 'FmsCurrencySelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[]
    multiple?: boolean
    disabled?: boolean
    clearable?: boolean
    filterable?: boolean
    excludeStandard?: boolean
    placeholder?: string
  }>(),
  {
    multiple: false,
    disabled: false,
    clearable: true,
    filterable: true,
    excludeStandard: false,
    placeholder: '请选择币别'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
}>()

const fmsStore = useFmsStore() // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const loading = ref(false) // 币别列表的加载中
const list = ref<FmsCurrencyVO[]>([]) // 币别列表
const currencyList = computed(() =>
  props.excludeStandard ? list.value.filter((item) => !item.standard) : list.value
) // 可选币别列表

/** 选中变化 */
function handleChange(value: unknown) {
  if (Array.isArray(value)) {
    emit(
      'update:modelValue',
      value.map(parseId).filter(isIdType)
    )
    return
  }
  emit('update:modelValue', parseId(value))
}

/** 获得币别列表 */
async function getCurrencyList() {
  if (!accountSetId.value) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await FmsCurrencyApi.getCurrencySimpleList(accountSetId.value)
  } finally {
    loading.value = false
  }
}

/** 初始化并监听账套切换 */
watch(accountSetId, getCurrencyList, { immediate: true })
</script>
