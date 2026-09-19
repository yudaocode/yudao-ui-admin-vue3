<template>
  <el-select
    :model-value="modelValue"
    :loading="loading"
    :placeholder="placeholder"
    @change="emit('change', $event)"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-option
      v-for="status in statusList"
      :key="status.id"
      :label="status.name"
      :value="status.id"
    />
  </el-select>
</template>

<script lang="ts" setup>
import * as WorkItemStatusApi from '@/api/pms/pm/workitem/status'

defineOptions({ name: 'PmsWorkItemStatusSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    projectId: number
    workItemType: number
    placeholder?: string
  }>(),
  { placeholder: '请选择状态' }
)
const emit = defineEmits(['update:modelValue', 'change'])

const loading = ref(false) // 选项加载中
const statusList = ref<WorkItemStatusApi.PmsWorkItemStatusVO[]>([]) // 工作项状态选项

/** 查询工作项状态选项 */
async function getWorkItemStatusList() {
  loading.value = true
  try {
    statusList.value = await WorkItemStatusApi.getWorkItemStatusList(
      props.projectId,
      props.workItemType
    )
  } finally {
    loading.value = false
  }
}

watch(() => [props.projectId, props.workItemType], getWorkItemStatusList, { immediate: true })
</script>
