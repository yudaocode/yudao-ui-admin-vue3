<template>
  <!-- 公众号会话内（大卡片：封面 + 标题 + 摘要） -->
  <div v-if="isChannelView" class="material-card" @click="onClick">
    <div class="title">{{ payload.title || '(无标题)' }}</div>
    <img v-if="payload.coverUrl" class="cover" :src="payload.coverUrl" />
    <div v-if="payload.summary" class="summary">{{ payload.summary }}</div>
    <span class="link">{{ payload.url ? '外链' : '查看详情' }}</span>
  </div>

  <!-- 私聊 / 群聊里被转发的素材（紧凑卡片：标题左 + 小封面右 + 底部频道标识） -->
  <!-- TODO @AI：转发后的消息，无法点击打开； -->
  <div v-else class="material-card-forward" @click="onClick">
    <div class="forward-body">
      <div class="forward-title">{{ payload.title || '(无标题)' }}</div>
      <img v-if="payload.coverUrl" class="forward-cover" :src="payload.coverUrl" />
    </div>
    <div class="forward-footer">
      <Icon icon="ep:promotion" :size="12" />
      <span>频道消息</span>
    </div>
  </div>

  <!-- TODO @ai：需要注释下； -->
  <Dialog
    v-model="detailVisible"
    :title="payload.title || '详情'"
    fullscreen
    destroy-on-close
  >
    <div v-loading="detailLoading" class="material-detail-body">
      <div class="article-title">{{ payload.title || '' }}</div>
      <div v-if="detailHtml" class="article-content" v-dompurify-html="detailHtml"></div>
      <div v-else-if="!detailLoading" class="article-empty">暂无正文</div>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { getChannelMaterial } from '@/api/im/channel/material'
import { parseMessage, type MaterialMessage } from '@/views/im/utils/message'
import { useConversationStore } from '@/views/im/home/store/conversationStore'
import { ImConversationType } from '@/views/im/utils/constants'

interface MessageInfo {
  materialId?: number
  content: string
}

const props = defineProps({
  message: { type: Object as PropType<MessageInfo>, required: true }
})

const conversationStore = useConversationStore()

/** 当前是否在公众号 / 频道会话里：决定走大卡片还是紧凑转发卡片 */
const isChannelView = computed(
  () => conversationStore.activeConversation?.type === ImConversationType.CHANNEL
)

/** 反序列化 content JSON 为 payload 对象 */
const payload = computed<MaterialMessage>(
  () => parseMessage<MaterialMessage>(props.message.content) ?? {}
)

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailHtml = ref('')

/** 点击行为：url 非空跳外链；为空则按 materialId 拉富文本正文，全屏 dialog 渲染 */
const onClick = async () => {
  if (payload.value.url) {
    // 外链强制 noopener,noreferrer，阻断目标页面 window.opener 篡改 / referrer 泄露
    window.open(payload.value.url, '_blank', 'noopener,noreferrer')
    return
  }
  if (!props.message.materialId) {
    return
  }
  detailVisible.value = true
  detailLoading.value = true
  detailHtml.value = ''
  try {
    const material = await getChannelMaterial(props.message.materialId)
    detailHtml.value = material?.content ?? ''
  } catch (e) {
    console.error('[Material] 拉取正文失败', e)
  } finally {
    detailLoading.value = false
  }
}
</script>

<style scoped lang="scss">
/* 公众号会话内大卡片：占父容器全宽，封面 + 标题 + 摘要纵向铺开 */
/** TODO @AI：有没可能 unocss 尽量替代掉； */
.material-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 14px 16px 12px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  .title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .cover {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    border-radius: 4px;
    background: var(--el-fill-color-light);
  }

  .summary {
    margin-top: 10px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .link {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
    font-size: 12px;
    color: var(--el-color-primary);
  }
}

/* 私聊 / 群聊转发紧凑卡片：标题左 + 小封面右 + 底部频道标识 */
.material-card-forward {
  display: flex;
  flex-direction: column;
  width: 280px;
  padding: 10px 12px 8px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  .forward-body {
    display: flex;
    gap: 10px;
    align-items: flex-start;

    .forward-title {
      flex: 1;
      min-width: 0;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
      color: var(--el-text-color-primary);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .forward-cover {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      background: var(--el-fill-color-light);
      flex-shrink: 0;
    }
  }

  .forward-footer {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
}

.material-detail-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px 80px;

  .article-title {
    font-size: 22px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--el-text-color-primary);
    margin-bottom: 20px;
  }

  .article-content {
    font-size: 15px;
    line-height: 1.75;
    color: var(--el-text-color-primary);

    :deep(img) {
      max-width: 100%;
      height: auto;
    }

    :deep(p) {
      margin: 12px 0;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3) {
      margin: 20px 0 12px;
      font-weight: 600;
    }
  }

  .article-empty {
    text-align: center;
    color: var(--el-text-color-secondary);
    margin-top: 80px;
  }
}
</style>
