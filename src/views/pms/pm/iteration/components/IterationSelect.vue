<template>
  <el-select
    :model-value="modelValue"
    clearable
    :collapse-tags="multiple"
    collapse-tags-tooltip
    filterable
    :loading="loading"
    :multiple="multiple"
    :placeholder="placeholder"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-option
      v-for="iteration in iterationList"
      :key="iteration.id"
      :label="iteration.name"
      :value="iteration.id!"
    />
  </el-select>
</template>

<script lang="ts" setup>
import * as IterationApi from '@/api/pms/pm/iteration'
import { getAllPageItems } from '@/utils/page'

defineOptions({ name: 'PmsIterationSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[]
    multiple?: boolean
    projectId: number
    placeholder?: string
  }>(),
  { multiple: false, placeholder: '请选择迭代' }
)
const emit = defineEmits(['update:modelValue'])

const loading = ref(false) // 选项加载中
const iterationList = ref<IterationApi.PmsIterationVO[]>([]) // 迭代选项

/** 查询项目迭代选项 */
async function getIterationList() {
  loading.value = true
  try {
    iterationList.value = await getAllPageItems<IterationApi.PmsIterationVO>((pageNo, pageSize) => {
      const params = { pageNo, pageSize, projectId: props.projectId }
      return IterationApi.getIterationPage(params)
    })
  } finally {
    loading.value = false
  }
}

watch(() => props.projectId, getIterationList, { immediate: true })
</script>
