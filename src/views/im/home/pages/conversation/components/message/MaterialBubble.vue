<template>
  <!-- 公众号会话内大卡片：对齐微信公众号单图文卡（封面 9:5 + 下方白底加粗标题条） -->
  <div
    v-if="isChannelView"
    class="material-card channel-card cursor-pointer"
    @click="onClick"
  >
    <img v-if="payload.coverUrl" class="channel-cover" :src="payload.coverUrl" />
    <div class="channel-title">{{ payload.title || '(无标题)' }}</div>
  </div>

  <!-- 私聊 / 群聊里被转发的素材紧凑卡片：标题 + 摘要在左、小封面在右、底部频道头像 + 名称（对齐微信公众号转发卡） -->
  <div v-else class="material-card forward-card cursor-pointer" @click="onClick">
    <div class="forward-body">
      <div class="forward-text">
        <div class="forward-title">{{ payload.title || '(无标题)' }}</div>
        <div v-if="payload.summary" class="forward-summary">{{ payload.summary }}</div>
      </div>
      <img v-if="payload.coverUrl" class="forward-cover" :src="payload.coverUrl" />
    </div>
    <div class="forward-footer">
      <img
        v-if="sourceChannel?.avatar"
        class="forward-channel-avatar"
        :src="sourceChannel.avatar"
      />
      <Icon v-else icon="ep:promotion" :size="14" />
      <span class="forward-channel-name">{{ sourceChannel?.name || '频道消息' }}</span>
    </div>
  </div>

  <!-- 富文本详情：全屏弹窗按需挂载，destroy-on-close 关闭后释放 v-dompurify-html 解析的 DOM -->
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
import Icon from '@/components/Icon/src/Icon.vue'
import { getChannelMaterial } from '@/api/im/channel/material'
import { parseMessage, type MaterialMessage } from '@/views/im/utils/message'
import { useConversationStore } from '@/views/im/home/store/conversationStore'
import { useChannelStore } from '@/views/im/home/store/channelStore'
import { ImConversationType } from '@/views/im/utils/constants'

const props = defineProps<{
  content: string
}>()

const conversationStore = useConversationStore()
const channelStore = useChannelStore()

/** 当前是否在公众号 / 频道会话里：决定走大卡片还是紧凑转发卡片 */
const isChannelView = computed(
  () => conversationStore.activeConversation?.type === ImConversationType.CHANNEL
)

/** 反序列化 content JSON 为 payload 对象 */
const payload = computed<MaterialMessage>(
  () => parseMessage<MaterialMessage>(props.content) ?? {}
)

/** 来源频道；紧凑卡底部渲染头像 + 名称 */
const sourceChannel = computed(() =>
  payload.value.channelId ? channelStore.getChannel(payload.value.channelId) : undefined
)

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailHtml = ref('')

/** 点击行为：url 非空跳外链；为空则按 payload.materialId 拉富文本正文，全屏 dialog 渲染 */
const onClick = async () => {
  if (payload.value.url) {
    // 外链强制 noopener,noreferrer，阻断目标页面 window.opener 篡改 / referrer 泄露
    window.open(payload.value.url, '_blank', 'noopener,noreferrer')
    return
  }
  if (!payload.value.materialId) {
    return
  }
  detailVisible.value = true
  detailLoading.value = true
  detailHtml.value = ''
  try {
    const material = await getChannelMaterial(payload.value.materialId)
    detailHtml.value = material?.content ?? ''
  } catch (e) {
    console.error('[Material] 拉取正文失败', e)
  } finally {
    detailLoading.value = false
  }
}
</script>

<style scoped lang="scss">
/* hover 阴影 + transition 用 SCSS 写更紧凑；unocss 写成 hover: 一行还行，但 transition 缓动还得带类，反而散 */
.material-card {
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
}

/* 公众号大卡片：封面 9:5 + 下方加粗标题条；纯 SCSS 写避免 unocss 偶发 arbitrary value 漏生成 */
.channel-card {
  width: 100%;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;

  .channel-cover {
    display: block;
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .channel-title {
    padding: 12px 14px;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--el-text-color-primary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* 私聊 / 群聊转发卡片：标题 + 摘要左、封面右、底部频道头像 + 名称 */
.forward-card {
  display: flex;
  flex-direction: column;
  width: 260px;
  padding: 12px 14px 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;

  .forward-body {
    display: flex;
    gap: 10px;
    align-items: flex-start;

    .forward-text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .forward-title {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--el-text-color-primary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-all;
    }

    .forward-summary {
      font-size: 12px;
      line-height: 1.5;
      color: var(--el-text-color-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-all;
    }

    .forward-cover {
      flex-shrink: 0;
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      background: var(--el-fill-color-light);
    }
  }

  .forward-footer {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .forward-channel-avatar {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .forward-channel-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

/* 富文本详情：article-content 内置 img / p / hN 用 :deep 全局生效；unocss 无法穿透 scoped 边界 */
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
