<!--
  消息文本片段渲染：tip 文案 + TEXT 气泡共用
  - mention 段挂点击 → openMentionUserInfoCardAtEvent
  - link 段渲染 <a target="_blank">，浏览器默认行为打开新标签
  - text 段原样输出
-->
<template>
  <template v-for="(segment, _index) in segments" :key="_index">
    <span
      v-if="segment.type === 'mention'"
      class="text-[#576b95]"
      :class="{ 'cursor-pointer hover:underline': isClickableMention(segment) }"
      @click.stop="handleMentionClick(segment, $event)"
      >{{ segment.text }}</span
    >
    <a
      v-else-if="segment.type === 'link'"
      :href="segment.href"
      target="_blank"
      rel="noopener noreferrer"
      class="text-[#576b95] hover:underline break-all"
      @click.stop
      >{{ segment.text }}</a
    >
    <span v-else>{{ segment.text }}</span>
  </template>
</template>

<script lang="ts" setup>
import { IM_AT_ALL_USER_ID } from '@/views/im/utils/constants'
import type { TipSegment } from '@/views/im/utils/message'
import { openMentionUserInfoCardAtEvent } from '@/views/im/utils/user'

defineOptions({ name: 'ImTipSegments' })

defineProps<{
  segments: TipSegment[]
}>()

/** @全体成员是广播 mention，仅高亮配色，不挂可点击交互 */
function isClickableMention(segment: { userId: number }): boolean {
  return segment.userId !== IM_AT_ALL_USER_ID
}

/** mention 段点击：fallbackName 取 segment 文本，避免 friend / member 都查不到时弹空 */
function handleMentionClick(
  segment: { type: 'mention'; userId: number; text: string },
  event: MouseEvent
) {
  if (!isClickableMention(segment)) {
    return
  }
  openMentionUserInfoCardAtEvent(segment.userId, event, segment.text)
}
</script>
