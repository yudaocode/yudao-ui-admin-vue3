<template>
  <div
    v-loading="loading"
    class="mb-16px grid grid-cols-4 gap-16px lt-sm:grid-cols-1 lt-xl:grid-cols-2"
  >
    <!-- Agent 数量 -->
    <div
      class="flex items-center gap-16px border border-[var(--el-border-color-light)] border-solid rounded-8px bg-[var(--el-bg-color)] p-20px"
    >
      <div
        class="h-56px w-56px flex flex-none items-center justify-center rounded-12px bg-[rgba(47,125,246,0.1)]"
      >
        <Icon icon="fa-solid:robot" :size="26" class="text-[#2f7df6]" />
      </div>
      <div class="min-w-0">
        <div class="text-14px text-[var(--el-text-color-secondary)]">Agent</div>
        <div class="mt-6px text-28px font-600 leading-32px text-[var(--el-text-color-primary)]">
          {{ summary.agentCount }}
        </div>
      </div>
    </div>
    <!-- SKILL 数量 -->
    <div
      class="flex items-center gap-16px border border-[var(--el-border-color-light)] border-solid rounded-8px bg-[var(--el-bg-color)] p-20px"
    >
      <div
        class="h-56px w-56px flex flex-none items-center justify-center rounded-12px bg-[rgba(24,160,88,0.1)]"
      >
        <Icon icon="ep:magic-stick" :size="26" class="text-[#18a058]" />
      </div>
      <div class="min-w-0">
        <div class="text-14px text-[var(--el-text-color-secondary)]">SKILL</div>
        <div class="mt-6px text-28px font-600 leading-32px text-[var(--el-text-color-primary)]">
          {{ summary.skillCount }}
        </div>
      </div>
    </div>
    <!-- MCP 数量 -->
    <div
      class="flex items-center gap-16px border border-[var(--el-border-color-light)] border-solid rounded-8px bg-[var(--el-bg-color)] p-20px"
    >
      <div
        class="h-56px w-56px flex flex-none items-center justify-center rounded-12px bg-[rgba(245,158,11,0.1)]"
      >
        <Icon icon="ep:connection" :size="26" class="text-[#f59e0b]" />
      </div>
      <div class="min-w-0">
        <div class="text-14px text-[var(--el-text-color-secondary)]">MCP</div>
        <div class="mt-6px text-28px font-600 leading-32px text-[var(--el-text-color-primary)]">
          {{ summary.mcpCount }}
        </div>
      </div>
    </div>
    <!-- 模型数量 -->
    <div
      class="flex items-center gap-16px border border-[var(--el-border-color-light)] border-solid rounded-8px bg-[var(--el-bg-color)] p-20px"
    >
      <div
        class="h-56px w-56px flex flex-none items-center justify-center rounded-12px bg-[rgba(124,58,237,0.1)]"
      >
        <Icon icon="ep:cpu" :size="26" class="text-[#7c3aed]" />
      </div>
      <div class="min-w-0">
        <div class="text-14px text-[var(--el-text-color-secondary)]">模型</div>
        <div class="mt-6px text-28px font-600 leading-32px text-[var(--el-text-color-primary)]">
          {{ summary.modelCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { HomeApi, HomeSummary } from '@/api/ai1/home'

/** AI1 首页总量统计 */
defineOptions({ name: 'Ai1HomeSummaryCards' })

const loading = ref(false) // 加载中
const summary = ref<HomeSummary>({ agentCount: 0, skillCount: 0, mcpCount: 0, modelCount: 0 }) // 总量统计

/** 加载总量统计 */
const load = async () => {
  loading.value = true
  try {
    summary.value = await HomeApi.getSummary()
  } finally {
    loading.value = false
  }
}
defineExpose({ load }) // 提供 load 方法，用于首页刷新
</script>
