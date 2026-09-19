<template>
  <el-select
    :model-value="modelValue"
    class="!w-240px"
    clearable
    filterable
    placeholder="项目筛选"
    @change="handleChange"
  >
    <el-option
      v-for="project in projectList"
      :key="project.id"
      :label="project.name"
      :value="project.id"
    />
  </el-select>
</template>

<script lang="ts" setup>
import * as ProjectApi from '@/api/pms/pm/project'
import { getAllPageItems } from '@/utils/page'

defineOptions({ name: 'PmsProjectSelect' })

defineProps<{ modelValue?: number }>()
const emit = defineEmits<{
  'update:modelValue': [value?: number]
  change: [value?: number]
}>()

const projectList = ref<ProjectApi.PmsProjectVO[]>([]) // 当前用户可访问的项目列表

/** 切换项目 */
function handleChange(value?: number) {
  emit('update:modelValue', value)
  emit('change', value)
}

/** 查询当前用户可访问的项目 */
async function getProjectList() {
  projectList.value = await getAllPageItems<ProjectApi.PmsProjectVO>((pageNo, pageSize) =>
    ProjectApi.getProjectPage({ pageNo, pageSize })
  )
}

/** 初始化 */
onMounted(() => {
  getProjectList()
})
</script>
