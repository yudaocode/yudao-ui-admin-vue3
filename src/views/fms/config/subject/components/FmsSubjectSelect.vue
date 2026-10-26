<template>
  <el-select
    :clearable="clearable"
    :disabled="disabled"
    :filterable="filterable"
    :loading="loading"
    :model-value="modelValue"
    :placeholder="placeholder"
    @update:model-value="handleChange"
  >
    <el-option
      v-for="subject in subjectOptions"
      :key="subject.id"
      :label="formatSubjectOption(subject)"
      :value="subject.id"
    />
  </el-select>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import * as FmsSubjectApi from '@/api/fms/config/subject'
import type { FmsSubjectVO } from '@/api/fms/config/subject'
import { treeToList } from '@/utils/tree'
import { useFmsStore } from '@/views/fms/store/fms'
import { FMS_SUBJECT_STATUS } from '@/views/fms/utils/constants'

defineOptions({ name: 'FmsSubjectSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    options?: FmsSubjectVO[]
    disabled?: boolean
    clearable?: boolean
    filterable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: false,
    filterable: true,
    placeholder: '请选择科目'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [value: number | undefined]
}>()

const fmsStore = useFmsStore() // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const loading = ref(false) // 会计科目列表的加载中
const subjectList = ref<FmsSubjectVO[]>([]) // 自动加载的会计科目列表
const subjectOptions = computed(() =>
  treeToList<FmsSubjectVO[]>(props.options || subjectList.value)
) // 平铺会计科目列表

/** 格式化会计科目选项 */
function formatSubjectOption(subject: FmsSubjectVO) {
  const indent = '　'.repeat(Math.max((subject.level || 1) - 1, 0))
  const statusLabel = subject.status === FMS_SUBJECT_STATUS.DISABLED ? '（已停用）' : ''
  return `${indent}${subject.code} ${subject.name}${statusLabel}`
}

/** 选中变化 */
function handleChange(value: unknown) {
  const subjectId = parseId(value)
  emit('update:modelValue', subjectId)
  emit('change', subjectId)
}

/** 获得会计科目列表 */
async function getSubjectList() {
  if (props.options) return
  if (!accountSetId.value) {
    subjectList.value = []
    return
  }
  loading.value = true
  try {
    subjectList.value = await FmsSubjectApi.getSubjectSimpleList(accountSetId.value)
  } finally {
    loading.value = false
  }
}

/** 未传入选项时，监听账套切换并自动加载 */
watch(accountSetId, getSubjectList, { immediate: true })
</script>
