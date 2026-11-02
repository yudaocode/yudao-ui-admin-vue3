<template>
  <!-- 统计：全部匹配筛选条件的记录 -->
  <ContentWrap>
    <div v-loading="loading" class="flex flex-wrap gap-12px">
      <div
        class="min-w-200px flex-[1_1_220px] rounded-4px bg-[var(--el-fill-color-light)] px-16px py-12px"
      >
        <div class="text-13px text-[var(--el-text-color-secondary)]">请求总数</div>
        <div class="my-4px text-20px font-600">{{ statistics?.requestCount }}</div>
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          成功 {{ statistics?.successCount }} / 失败 {{ statistics?.failCount }} / 取消
          {{ statistics?.cancelCount }}
        </div>
      </div>
      <div
        class="min-w-200px flex-[1_1_220px] rounded-4px bg-[var(--el-fill-color-light)] px-16px py-12px"
      >
        <div class="text-13px text-[var(--el-text-color-secondary)]">已知输入 Token 合计</div>
        <div class="my-4px text-20px font-600">
          {{ statistics && formatTokenCount(statistics.inputTokens) }}
        </div>
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          仅累加已返回输入用量的请求
        </div>
      </div>
      <div
        class="min-w-200px flex-[1_1_220px] rounded-4px bg-[var(--el-fill-color-light)] px-16px py-12px"
      >
        <div class="text-13px text-[var(--el-text-color-secondary)]">已知输出 Token 合计</div>
        <div class="my-4px text-20px font-600">
          {{ statistics && formatTokenCount(statistics.outputTokens) }}
        </div>
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          仅累加已返回输出用量的请求
        </div>
      </div>
      <div
        class="min-w-200px flex-[1_1_220px] rounded-4px bg-[var(--el-fill-color-light)] px-16px py-12px"
      >
        <div class="text-13px text-[var(--el-text-color-secondary)]">完整用量合计 Token</div>
        <div class="my-4px text-20px font-600">
          {{ statistics && formatTokenCount(statistics.totalTokens) }}
        </div>
        <div class="text-12px text-[var(--el-text-color-secondary)]">
          完整用量 {{ statistics?.knownUsageCount }} 条，用量未知
          {{ statistics?.unknownUsageCount }} 条
        </div>
      </div>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { RequestLogApi, RequestLogStatisticsVO } from '@/api/ai/requestlog'
import { formatTokenCount } from '@/views/ai/utils/format'

/** AI 请求日志的统计 */
defineOptions({ name: 'AiRequestLogStatistics' })

const loading = ref(false) // 统计的加载中
const statistics = ref<RequestLogStatisticsVO>() // 统计数据
let statisticsRequestId = 0 // 统计请求序号：筛选快速切换时，只采用最后一次请求的结果

/** 查询统计 */
const getStatistics = async (params: any) => {
  const requestId = ++statisticsRequestId
  loading.value = true
  statistics.value = undefined
  try {
    const data = await RequestLogApi.getRequestLogStatistics(params)
    if (requestId === statisticsRequestId) {
      statistics.value = data
    }
  } finally {
    if (requestId === statisticsRequestId) {
      loading.value = false
    }
  }
}

defineExpose({ getStatistics }) // 提供 getStatistics 方法，按已搜索的筛选条件刷新统计
</script>
