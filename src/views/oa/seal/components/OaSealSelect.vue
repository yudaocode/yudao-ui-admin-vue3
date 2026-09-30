<template>
  <el-select
    :model-value="modelValue"
    :disabled="disabled"
    :clearable="clearable"
    :loading="loading"
    :placeholder="placeholder"
    filterable
    remote
    :remote-method="getList"
    @update:model-value="handleChange"
  >
    <el-option
      v-for="seal in options"
      :key="seal.id"
      :value="seal.id!"
      :label="seal.no + ' / ' + seal.name"
    />
  </el-select>
</template>

<script setup lang="ts">
import * as SealApplyApi from '@/api/oa/seal/apply'
import type { SealVO } from '@/api/oa/seal'

defineOptions({ name: 'OaSealSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    selectedSeal?: SealVO
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请输入印章名称搜索'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const list = ref<SealVO[]>([]) // 可申请的印章列表
const loading = ref(false) // 列表的加载中
const currentSeal = ref<SealVO>() // 已选印章，用于搜索结果之外的回显
const options = computed(() => {
  const selected = currentSeal.value
  if (
    selected?.id &&
    selected.id === props.modelValue &&
    !list.value.some((seal) => seal.id === selected.id)
  ) {
    return [selected, ...list.value]
  }
  return list.value
})

/** 选中变化 */
function handleChange(value: unknown) {
  currentSeal.value = options.value.find((seal) => seal.id === value)
  emit('update:modelValue', typeof value === 'number' ? value : undefined)
}

/** 查询可申请的印章 */
async function getList(name: string) {
  loading.value = true
  try {
    const params = { pageNo: 1, pageSize: 20, name }
    const data = await SealApplyApi.getSealPage(params)
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 回显申请关联的印章，无需印章管理查询权限 */
watch(
  () => props.selectedSeal,
  (seal) => {
    if (seal?.id && seal.name && currentSeal.value?.id !== seal.id) {
      currentSeal.value = seal
    }
  },
  { immediate: true }
)

/** 初始化 */
onMounted(() => {
  getList('')
})
</script>
