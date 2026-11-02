<template>
  <!-- 本次生成的 Token 用量：直接展示业务快照，未知显示未取得，真实 0 显示 0 -->
  <span v-if="!pending" class="text-12px text-[var(--el-text-color-secondary)] whitespace-nowrap">
    输入 {{ formatTokenCount(inputTokens) }} · 输出 {{ formatTokenCount(outputTokens) }} · 合计
    {{ formatTokenCount(totalTokens) }} Token
  </span>
</template>

<script setup lang="ts">
import { formatTokenCount } from '@/views/ai/utils/format'

/** AI 本次生成的 Token 用量 */
defineOptions({ name: 'AiTokenUsage' })

defineProps<{
  inputTokens?: number | null // 输入 Token，未知为 null
  outputTokens?: number | null // 输出 Token，未知为 null
  totalTokens?: number | null // 合计 Token，未知为 null
  pending?: boolean // 是否仍在生成中，生成中快照未完整，不展示
}>()
</script>
