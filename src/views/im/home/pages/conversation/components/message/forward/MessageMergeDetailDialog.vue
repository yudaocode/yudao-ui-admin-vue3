<template>
  <el-dialog
    v-model="visible"
    width="560px"
    :close-on-click-modal="false"
    class="im-merge-detail-dialog"
    :show-close="true"
    @close="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <Icon
          v-if="stack.length > 1"
          icon="ant-design:left-outlined"
          class="cursor-pointer text-[var(--el-text-color-secondary)] hover:text-[var(--el-text-color-primary)]"
          @click="handleBack"
        />
        <span class="text-base font-medium truncate">{{
          currentPayload?.title || '聊天记录'
        }}</span>
      </div>
    </template>

    <div v-if="currentPayload" class="flex flex-col h-[480px]">
      <div
        class="px-4 py-2 text-12px text-[var(--el-text-color-secondary)] border-b border-b-solid border-[var(--el-border-color-lighter)]"
      >
        以下是 {{ currentPayload.messages.length }} 条消息
      </div>
      <el-scrollbar class="flex-1">
        <div
          v-for="(item, idx) in currentPayload.messages"
          :key="idx"
          class="flex gap-3 items-start px-4 py-3 border-b border-b-solid border-[var(--el-border-color-lighter)]"
        >
          <UserAvatar
            :url="item.senderAvatar"
            :name="item.senderNickname"
            :size="36"
            :clickable="false"
          />
          <div class="flex-1 min-w-0">
            <div class="flex gap-2 items-baseline">
              <span class="text-13px font-medium text-[var(--el-text-color-primary)] truncate">
                {{ item.senderNickname }}
              </span>
              <span class="text-12px text-[var(--el-text-color-secondary)] flex-shrink-0">
                {{ formatMergeItemTime(item.sendTime) }}
              </span>
            </div>
            <!-- 复用主聊天气泡渲染；MERGE 嵌套点击 push 当前层 -->
            <div class="mt-1.5">
              <MessageBubble
                :type="item.type"
                :content="item.content"
                @open-merge="handleNestedOpen($event)"
              />
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'

import UserAvatar from '@/views/im/home/components/user/UserAvatar.vue'
import MessageBubble from '../MessageBubble.vue'
import { parseMessage, type MergeMessage } from '@/views/im/utils/message'
import { formatMergeItemTime } from '@/views/im/utils/time'
import { useVoicePlayer } from '@/views/im/home/composables/useVoicePlayer'

defineOptions({ name: 'ImMessageMergeDetailDialog' })

const voicePlayer = useVoicePlayer()
const visible = ref(false)

/** 嵌套层级栈，存 parsed payload 避免切层重 parse */
const stack = ref<MergeMessage[]>([])

defineExpose({
  /** 打开详情弹窗，传入顶层合并消息 content */
  open(content: string) {
    const payload = parseMessage<MergeMessage>(content)
    stack.value = payload ? [payload] : []
    visible.value = true
  }
})

/** 当前层 payload */
const currentPayload = computed<MergeMessage | null>(
  () => stack.value[stack.value.length - 1] ?? null
)

/** 嵌套合并气泡点击：解析 content 后压栈进入下一层 */
function handleNestedOpen(content: string) {
  const payload = parseMessage<MergeMessage>(content)
  if (payload) {
    stack.value.push(payload)
  }
}

/** 顶部返回箭头点击：弹出栈顶回到上一层 */
function handleBack() {
  if (stack.value.length > 1) {
    stack.value.pop()
  }
}

/** 弹窗关闭：清栈 + 停语音，下次打开从顶层重新开始 */
function handleClose() {
  stack.value = []
  voicePlayer.stop()
}
</script>

<style scoped>
/* :deep 穿透 el-dialog 内部 body，去掉默认内边距，让滚动区贴边 */
.im-merge-detail-dialog :deep(.el-dialog__body) {
  padding: 0;
}
</style>
