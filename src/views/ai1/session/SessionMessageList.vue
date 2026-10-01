<!-- AI1 会话消息列表 -->
<template>
  <div class="relative h-full">
    <div
      ref="scrollRef"
      class="h-full overflow-x-hidden overflow-y-auto p-20px"
      @scroll="handleScroll"
    >
      <div
        v-for="item in list"
        :key="item.id"
        class="group mb-16px flex gap-10px"
        :class="{ 'flex-row-reverse': item.role === Ai1SessionMessageRoleEnum.USER }"
      >
        <!-- 头像 -->
        <div
          class="h-34px w-34px flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--el-color-primary-light-8)] text-16px text-[var(--el-color-primary)]"
        >
          <Icon
            :icon="item.role === Ai1SessionMessageRoleEnum.USER ? 'ep:user' : 'ep:chat-dot-round'"
          />
        </div>
        <div
          class="min-w-0 max-w-76% flex flex-col"
          :class="{ 'items-end': item.role === Ai1SessionMessageRoleEnum.USER }"
        >
          <div
            class="max-w-full break-words rounded-8px px-14px py-10px text-14px leading-[1.7]"
            :class="
              item.role === Ai1SessionMessageRoleEnum.USER
                ? 'bg-[var(--el-color-primary)] text-white'
                : 'border border-[var(--el-border-color-light)] border-solid bg-[var(--el-bg-color)] text-[var(--el-text-color-primary)]'
            "
          >
            <template v-if="item.role === Ai1SessionMessageRoleEnum.ASSISTANT">
              <!-- 思考过程 -->
              <SessionMessageReasoning
                :reasoning="item.reasoning"
                :default-expanded="item.status === Ai1SessionMessageStatusEnum.GENERATING"
              />
              <!-- 思考中 -->
              <span
                v-if="
                  !item.content &&
                  item.status === Ai1SessionMessageStatusEnum.GENERATING &&
                  !item.interrupted
                "
                class="inline-flex items-center italic text-[var(--el-text-color-placeholder)]"
              >
                思考中
                <span class="ml-3px inline-flex items-end gap-2px">
                  <span
                    v-for="dot in 3"
                    :key="dot"
                    class="ai1-session-dot"
                    :style="{ animationDelay: `${(dot - 1) * 0.2}s` }"
                  ></span>
                </span>
              </span>
              <MarkdownView v-if="item.content" :content="item.content" />
              <!-- 生成失败 -->
              <div
                v-if="item.status === Ai1SessionMessageStatusEnum.FAILED"
                class="mt-6px flex items-center text-12px text-[var(--el-color-danger)]"
              >
                <Icon icon="ep:warning" :size="13" class="mr-4px" />
                {{ item.errorMessage || '生成失败，请稍后重试' }}
              </div>
              <!-- 已中断 -->
              <div
                v-else-if="
                  item.interrupted && item.status === Ai1SessionMessageStatusEnum.GENERATING
                "
                class="mt-6px flex items-center text-12px text-[var(--el-text-color-secondary)]"
              >
                <Icon icon="ep:info-filled" :size="13" class="mr-4px" />
                已停止接收，服务端可能仍在生成，重新打开该会话可继续查看
              </div>
            </template>
            <span v-else class="whitespace-pre-wrap">{{ item.content }}</span>
          </div>
          <!-- 发送时间 -->
          <div
            class="invisible mt-4px text-11px leading-[1.4] text-[var(--el-text-color-placeholder)] group-hover:visible"
          >
            {{ formatDate(item.createTime) }}
          </div>
        </div>
      </div>
    </div>
    <!-- 回到底部 -->
    <button
      v-if="!nearBottom"
      class="absolute bottom-16px right-26px z-10 h-36px w-36px flex cursor-pointer items-center justify-center border border-[var(--el-border-color)] border-solid rounded-full bg-[var(--el-bg-color)] text-16px text-[var(--el-text-color-regular)] shadow-[0_2px_8px_rgb(0_0_0/12%)] hover:border-[var(--el-color-primary)] hover:text-[var(--el-color-primary)]"
      title="回到底部"
      @click="scrollToBottom(true)"
    >
      <Icon icon="ep:arrow-down" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/formatTime'
import MarkdownView from '@/components/MarkdownView/index.vue'
import { Ai1SessionMessageRoleEnum, Ai1SessionMessageStatusEnum } from '@/views/ai1/utils/constants'
import SessionMessageReasoning from './SessionMessageReasoning.vue'
import type { Ai1SessionMessageItem } from './types'

defineOptions({ name: 'Ai1SessionMessageList' })

defineProps<{
  list: Ai1SessionMessageItem[] // 消息列表
}>()

const scrollRef = ref<HTMLElement>() // 滚动容器
const nearBottom = ref(true) // 是否贴近底部

/** 滚动时，计算是否贴近底部 */
const handleScroll = () => {
  const el = scrollRef.value
  if (!el) {
    return
  }
  nearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 80
}

/** 平滑滚动到底部 */
const smoothScrollToBottom = (el: HTMLElement) => {
  const startTop = el.scrollTop
  const distance = el.scrollHeight - startTop
  if (distance <= 0) {
    return
  }
  const duration = 260
  const startTime = performance.now()
  const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3)
  const tick = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1)
    el.scrollTop = startTop + distance * easeOutCubic(progress)
    if (progress < 1) {
      requestAnimationFrame(tick)
    }
  }
  requestAnimationFrame(tick)
}

/** 滚动到底部：force 为 true 时强制吸底，否则仅在贴近底部时吸底 */
const scrollToBottom = async (force = false) => {
  await nextTick()
  const el = scrollRef.value
  if (!el || (!force && !nearBottom.value)) {
    return
  }
  if (force) {
    smoothScrollToBottom(el)
  } else {
    el.scrollTop = el.scrollHeight
  }
  nearBottom.value = true
}

defineExpose({ scrollToBottom })
</script>

<style scoped>
/* 思考中：省略号逐点跳动 */
.ai1-session-dot {
  width: 3px;
  height: 3px;
  background: currentcolor;
  border-radius: 50%;
  animation: ai1-session-dot 1.2s infinite ease-in-out;
}

@keyframes ai1-session-dot {
  0%,
  60%,
  100% {
    opacity: 0.25;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}
</style>
