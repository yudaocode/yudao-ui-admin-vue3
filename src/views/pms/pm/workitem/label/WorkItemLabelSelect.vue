<template>
  <el-select
    :model-value="modelValue"
    clearable
    collapse-tags
    filterable
    :loading="loading"
    multiple
    :placeholder="placeholder"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-option v-for="label in labelList" :key="label.id" :label="label.name" :value="label.id!" />
  </el-select>
</template>

<script lang="ts" setup>
import * as WorkItemLabelApi from '@/api/pms/pm/workitem/label'

defineOptions({ name: 'PmsWorkItemLabelSelect' })

withDefaults(
  defineProps<{
    modelValue?: number[]
    placeholder?: string
  }>(),
  { placeholder: '请选择标签' }
)
const emit = defineEmits(['update:modelValue'])

const loading = ref(false) // 选项加载中
const labelList = ref<WorkItemLabelApi.PmsWorkItemLabelVO[]>([]) // 工作项标签选项

/** 查询工作项标签选项 */
async function getWorkItemLabelList() {
  loading.value = true
  try {
    labelList.value = await WorkItemLabelApi.getWorkItemLabelList()
  } finally {
    loading.value = false
  }
}
defineExpose({ getWorkItemLabelList }) // 提供 getWorkItemLabelList 方法，用于标签管理后刷新选项

onMounted(() => getWorkItemLabelList())
</script>
