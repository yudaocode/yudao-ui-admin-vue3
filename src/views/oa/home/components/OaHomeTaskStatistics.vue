<template>
  <OaHomePanel title="任务完成情况">
    <template #actions>
      <el-button link type="primary" @click="push('/oa/task/my')">查看任务</el-button>
    </template>

    <!-- 我的任务状态 -->
    <div v-loading="loading" class="mb-22px">
      <div v-if="loadError" class="mb-12px text-13px text-[var(--el-color-danger)]">
        加载失败，
        <el-button link type="primary" @click="getList">重新加载</el-button>
      </div>
      <div class="mb-12px text-14px font-600 text-[var(--el-text-color-primary)]">我的任务</div>
      <div
        v-for="item in taskStatuses"
        :key="item.status"
        class="min-h-34px flex items-center gap-10px"
      >
        <span class="w-56px text-13px text-[var(--el-text-color-regular)]">
          <dict-tag :type="DICT_TYPE.OA_TASK_STATUS" :value="item.status ?? ''" />
        </span>
        <el-progress
          class="flex-1"
          :percentage="getStatusPercentage(item.count)"
          :show-text="false"
          :stroke-width="8"
        />
        <span class="w-28px text-right text-[var(--el-text-color-secondary)]">
          {{ item.count }}
        </span>
      </div>
    </div>

    <!-- 任务完成排行独立加载，不等待状态统计 -->
    <div v-loading="rankingLoading">
      <div v-if="rankingError" class="mb-12px text-13px text-[var(--el-color-danger)]">
        加载失败，
        <el-button link type="primary" @click="getRankingList">重新加载</el-button>
      </div>
      <div class="mb-12px text-14px font-600 text-[var(--el-text-color-primary)]">
        任务完成排行（按发布人）
      </div>
      <el-empty v-if="taskRankings.length === 0" :image-size="60" description="暂无完成记录" />
      <Echart v-else :options="rankingOptions" height="240px" />
    </div>
  </OaHomePanel>
</template>

<script setup lang="ts">
import OaHomePanel from './OaHomePanel.vue'
import { Echart } from '@/components/Echart'
import type { EChartsOption } from 'echarts'
import { DICT_TYPE } from '@/utils/dict'
import * as TaskApi from '@/api/oa/task'
import { OA_TASK_STATUS } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaHomeTaskStatistics' })

const loading = ref(false) // 区块加载中
const loadError = ref(false) // 区块加载失败
const { push } = useRouter() // 路由跳转
const rankingLoading = ref(false) // 排行加载中
const rankingError = ref(false) // 排行加载失败
const statusCountMap = ref<Record<number, number>>({}) // 状态与任务数量
const taskRankings = ref<TaskApi.OaTaskRankingVO[]>([]) // 任务完成排行
const taskStatuses = computed(() =>
  Object.values(OA_TASK_STATUS).map((status) => ({
    status,
    count: statusCountMap.value[status] || 0
  }))
) // 补齐没有任务的状态
const taskTotal = computed(() => taskStatuses.value.reduce((total, item) => total + item.count, 0)) // 我的任务总数

const rankingOptions = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 32, right: 16, top: 20, bottom: 50 },
  xAxis: {
    type: 'category',
    data: taskRankings.value.map((item) => item.userName || `用户 ${item.userId}`),
    axisLabel: { interval: 0, width: 60, overflow: 'truncate' }
  },
  yAxis: { type: 'value', minInterval: 1 },
  series: [
    {
      name: '已完成任务',
      type: 'bar',
      barMaxWidth: 36,
      data: taskRankings.value.map((item) => item.completedCount)
    }
  ]
})) // 按发布人统计已完成任务

/** 获得任务状态占比 */
function getStatusPercentage(count: number) {
  return taskTotal.value === 0 ? 0 : Math.round((count / taskTotal.value) * 100)
}

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return
  loading.value = true
  loadError.value = false
  try {
    statusCountMap.value = await TaskApi.getTaskStatusCount()
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

/** 查询任务完成排行 */
async function getRankingList() {
  rankingLoading.value = true
  rankingError.value = false
  try {
    taskRankings.value = await TaskApi.getCompletedTaskRanking()
  } catch {
    rankingError.value = true
  } finally {
    rankingLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
  getRankingList()
})
</script>
