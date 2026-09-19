<template>
  <!-- 工作项活动记录 -->
  <el-divider v-if="showTitle" content-position="left">工作项动态</el-divider>
  <div v-loading="loading">
    <el-empty v-if="activityList.length === 0" :image-size="60" description="暂无动态" />
    <div v-else>
      <div
        v-for="activity in activityList"
        :key="activity.id"
        class="flex gap-10px border-b border-solid border-[var(--el-border-color-lighter)] py-10px last:border-b-0"
      >
        <el-avatar :size="32" :src="activity.operatorUserAvatar">
          {{ activity.operatorUserName?.slice(0, 1) }}
        </el-avatar>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-8px">
            <span>{{ activity.operatorUserName }}</span>
            <span class="text-12px text-[var(--el-text-color-secondary)]">
              {{ formatDate(activity.createTime) }}
            </span>
          </div>
          <div class="mt-4px text-13px text-[var(--el-text-color-regular)]">
            {{ activity.content }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as WorkItemActivityApi from '@/api/pms/pm/workitem/activity'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'PmsWorkItemActivity' })

const props = withDefaults(defineProps<{ workItemId: number; showTitle?: boolean }>(), {
  showTitle: true
})

const loading = ref(false) // 动态加载中
const activityList = ref<WorkItemActivityApi.PmsWorkItemActivityVO[]>([]) // 动态列表

/** 查询工作项动态列表 */
async function getWorkItemActivityList() {
  loading.value = true
  try {
    activityList.value = await WorkItemActivityApi.getWorkItemActivityList(props.workItemId)
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getWorkItemActivityList()
})

defineExpose({ getWorkItemActivityList }) // 提供 getWorkItemActivityList 方法，用于刷新动态
</script>
