<template>
  <el-select
    :model-value="modelValue"
    clearable
    filterable
    :loading="loading"
    :placeholder="placeholder"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-option
      v-for="workItem in workItemList"
      :key="workItem.id"
      :label="`#${workItem.serialNumber} ${workItem.name}`"
      :value="workItem.id!"
    />
  </el-select>
</template>

<script lang="ts" setup>
import * as WorkItemApi from '@/api/pms/pm/workitem'
import { getAllPageItems } from '@/utils/page'

defineOptions({ name: 'PmsWorkItemSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    projectId: number
    type: number
    excludeId?: number
    placeholder?: string
  }>(),
  { placeholder: '请选择工作项' }
)
const emit = defineEmits(['update:modelValue'])

const loading = ref(false) // 选项加载中
const workItemList = ref<WorkItemApi.PmsWorkItemVO[]>([]) // 工作项选项

/** 查询工作项选项 */
async function getWorkItemList() {
  loading.value = true
  try {
    const list = await getAllPageItems<WorkItemApi.PmsWorkItemVO>((pageNo, pageSize) => {
      const params = {
        pageNo,
        pageSize,
        projectId: props.projectId,
        type: props.type
      }
      return WorkItemApi.getWorkItemPage(params)
    })
    workItemList.value = list.filter((workItem) => workItem.id !== props.excludeId)
  } finally {
    loading.value = false
  }
}

watch(() => [props.projectId, props.type, props.excludeId], getWorkItemList, { immediate: true })
</script>
