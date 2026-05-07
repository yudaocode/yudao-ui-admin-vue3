<template>
  <!-- 名片单行 inline label：「[icon] 群名片 / 个人名片：xx」；列表摘要 / 引用预览 / 后台预览复用 -->
  <span class="inline-flex gap-1.5 items-center">
    <Icon :icon="labelInfo.icon" :size="iconSize" />
    <span>{{ labelInfo.label }}：{{ card?.name || '' }}</span>
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'

import { getCardLabelInfo } from '@/views/im/utils/message'

defineOptions({ name: 'ImCardLineLabel' })

const props = withDefaults(
  defineProps<{
    /** 名片数据；只读 targetType / name 派生标签 + 显示，结构性类型兼容 CardMessage / 引用预览的 partial */
    card: { targetType?: number; name?: string } | null | undefined
    iconSize?: number
  }>(),
  { iconSize: 14 }
)

/** 标签 + 图标按 targetType 二分；兜底「个人名片」避免 null 时 UI 空白 */
const labelInfo = computed(() => getCardLabelInfo(props.card))
</script>
