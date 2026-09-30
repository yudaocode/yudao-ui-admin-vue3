<!-- AI1 会话消息的思考过程 -->
<template>
  <div
    v-if="reasoning"
    class="mb-8px overflow-hidden border border-[#dfcfa6] border-dashed rounded-6px bg-[#faf6ec]"
  >
    <!-- 标题栏 -->
    <div
      class="flex cursor-pointer select-none items-center gap-5px px-10px py-6px text-12px text-[#a0884f]"
      @click="expanded = !expanded"
    >
      <Icon icon="ep:magic-stick" :size="13" />
      <span class="font-600">{{ expanded ? '收起思考' : '深度思考' }}</span>
      <Icon
        icon="ep:arrow-down"
        :size="11"
        class="transition-transform duration-200"
        :class="{ 'rotate-180': expanded }"
      />
    </div>
    <!-- 思考内容 -->
    <div
      v-show="expanded"
      class="mx-10px mb-8px whitespace-pre-wrap break-words border-t border-t-[#eadfcb] border-t-dashed pt-6px text-12.5px leading-[1.7] text-[#8a8370]"
      >{{ reasoning }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Ai1SessionMessageReasoning' })

const props = withDefaults(
  defineProps<{
    reasoning?: string // 思考过程
    defaultExpanded?: boolean // 是否默认展开
  }>(),
  { reasoning: '', defaultExpanded: false }
)

const expanded = ref(props.defaultExpanded) // 当前是否展开
</script>
