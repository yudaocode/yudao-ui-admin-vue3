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
      v-for="member in memberList"
      :key="member.userId"
      :label="member.nickname"
      :value="member.userId"
    />
  </el-select>
</template>

<script lang="ts" setup>
import * as ProjectMemberApi from '@/api/pms/pm/project/member'

defineOptions({ name: 'PmsProjectMemberSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[]
    projectId: number
    placeholder?: string
    multiple?: boolean
  }>(),
  { placeholder: '请选择项目成员', multiple: false }
)
const emit = defineEmits(['update:modelValue', 'loaded'])

const loading = ref(false) // 选项加载中
const memberList = ref<ProjectMemberApi.PmsProjectMemberVO[]>([]) // 项目成员选项

/** 查询项目成员选项 */
async function getProjectMemberList() {
  loading.value = true
  try {
    memberList.value = await ProjectMemberApi.getProjectMemberList(props.projectId)
    emit('loaded', memberList.value)
  } finally {
    loading.value = false
  }
}

watch(() => props.projectId, getProjectMemberList, { immediate: true })
</script>
