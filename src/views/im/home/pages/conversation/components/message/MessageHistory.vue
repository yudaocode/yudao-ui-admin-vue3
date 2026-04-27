<template>
  <!--
    历史消息抽屉（对应 boxim chat/ChatHistory.vue）
    - 从输入框工具栏触发，展示当前会话的全部历史消息
    - 简化实现：基于本地缓存的 activeChat.messages 全量展示 + 关键词搜索
    - 未来可接入后端「按时间段 / 发送人」查询，并用 PagedScroller 做增量加载
  -->
  <el-drawer
    v-model="visible"
    title="历史消息"
    direction="rtl"
    size="420px"
    append-to-body
  >
    <div class="im-message-history">
      <el-input
        v-model="keyword"
        placeholder="搜索消息内容"
        clearable
        class="im-message-history__search"
      />

      <div class="im-message-history__count">
        共 {{ filtered.length }} 条{{ keyword ? '（过滤后）' : '' }}
      </div>

      <div class="im-message-history__list">
        <div
          v-for="msg in filtered"
          :key="msg.id || msg.tmpId"
          class="im-message-history__item"
        >
          <div class="im-message-history__meta">
            <span class="im-message-history__sender">{{ msg.selfSend ? '我' : (msg.sendNickName || '对方') }}</span>
            <span class="im-message-history__time">{{ formatTime(msg.sendTime) }}</span>
          </div>
          <div class="im-message-history__content">{{ renderContent(msg) }}</div>
        </div>
        <div v-if="filtered.length === 0" class="im-message-history__empty">
          {{ keyword ? '没有匹配的消息' : '暂无历史消息' }}
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import { useChatStore } from '../../../../store/chatStore'
import { ImMessageType } from '../../../../../utils/constants'
import { parseTextContent, buildRecallTip } from '../../../../../utils'

defineOptions({ name: 'ImMessageHistory' })

const props = defineProps<{
  /** v-model 控制抽屉显隐 */
  modelValue: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const chatStore = useChatStore()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const keyword = ref('')

const filtered = computed(() => {
  const all = chatStore.activeChat?.messages || []
  const kw = keyword.value.trim()
  if (!kw) return [...all].reverse()
  return all.filter((m) => renderContent(m).includes(kw)).reverse()
})

function renderContent(msg: { type: number; content: string; sendNickName?: string; selfSend?: boolean }): string {
  switch (msg.type) {
    case ImMessageType.TEXT:
    case ImMessageType.TIP_TEXT:
      return parseTextContent(msg.content)
    case ImMessageType.IMAGE:
      return '[图片]'
    case ImMessageType.FILE:
      return '[文件]'
    case ImMessageType.VOICE:
      return '[语音]'
    case ImMessageType.VIDEO:
      return '[视频]'
    case ImMessageType.RECALL:
      return buildRecallTip(msg.sendNickName || '', !!msg.selfSend)
    default:
      return '[不支持的消息类型]'
  }
}

function formatTime(ts: number): string {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.im-message-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.im-message-history__search {
  flex-shrink: 0;
}

.im-message-history__count {
  flex-shrink: 0;
  font-size: 12px;
  color: #909399;
}

.im-message-history__list {
  flex: 1;
  overflow-y: auto;
}

.im-message-history__item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
}

.im-message-history__meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.im-message-history__sender {
  font-weight: 500;
  color: #606266;
}

.im-message-history__content {
  margin-top: 4px;
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
  word-break: break-all;
}

.im-message-history__empty {
  padding: 40px 0;
  font-size: 13px;
  color: #c0c4cc;
  text-align: center;
}
</style>
