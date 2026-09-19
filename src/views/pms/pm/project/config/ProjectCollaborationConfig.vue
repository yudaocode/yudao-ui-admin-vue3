<template>
  <div>
    <el-table :data="configurationList">
      <el-table-column label="事项类型" prop="name" width="180" />
      <el-table-column label="适用项目" prop="projectTypeName" min-width="220" />
      <el-table-column label="说明" prop="description" min-width="360" />
      <el-table-column align="center" fixed="right" label="操作" width="120">
        <template #default="scope">
          <el-button
            v-hasPermi="['pms:pm:work-item:update']"
            link
            type="primary"
            @click="statusListRef?.open(projectId, scope.row.type)"
          >
            状态设置
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <WorkItemStatusList ref="statusListRef" />
  </div>
</template>

<script lang="ts" setup>
import { PmsWorkItemConfigurationOptions } from '@/views/pms/pm/utils/constants'
import WorkItemStatusList from '@/views/pms/pm/workitem/status/WorkItemStatusList.vue'

defineOptions({ name: 'PmsProjectCollaborationConfig' })

const props = defineProps<{ projectId: number; projectType: number }>()

const statusListRef = ref<InstanceType<typeof WorkItemStatusList>>() // 状态列表 Ref
const configurationList = computed(() =>
  PmsWorkItemConfigurationOptions.filter((option) =>
    option.projectTypes.some((projectType) => projectType === props.projectType)
  )
) // 当前项目可配置的事项类型
</script>
