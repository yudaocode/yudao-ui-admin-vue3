<template>
  <!-- 公众号会话内大卡片：对齐微信公众号单图文卡（封面 9:5 + 下方白底加粗标题条） -->
  <div
    v-if="isChannelView"
    class="material-card cursor-pointer w-full overflow-hidden rounded-lg bg-[var(--el-bg-color)] border border-solid border-[var(--el-border-color-lighter)]"
    @click="onClick"
  >
    <img
      v-if="payload.coverUrl"
      class="block w-full h-[200px] object-cover"
      :src="payload.coverUrl"
    />
    <div
      class="px-3.5 py-3 text-15px font-600 leading-[1.4] text-[var(--el-text-color-primary)] line-clamp-2"
    >
      {{ payload.title || '(无标题)' }}
    </div>
  </div>

  <!-- 私聊 / 群聊里被转发的素材紧凑卡片：标题 + 摘要在左、小封面在右、底部频道头像 + 名称（对齐微信公众号转发卡） -->
  <div
    v-else
    class="material-card cursor-pointer flex flex-col w-[260px] px-3.5 pt-3 pb-2.5 rounded-lg bg-[var(--el-bg-color)] border border-solid border-[var(--el-border-color-lighter)]"
    @click="onClick"
  >
    <div class="flex gap-2.5 items-start">
      <div class="flex flex-1 flex-col gap-1.5 min-w-0">
        <div
          class="text-15px font-600 leading-[1.4] text-[var(--el-text-color-primary)] line-clamp-2 break-all"
        >
          {{ payload.title || '(无标题)' }}
        </div>
        <div
          v-if="payload.summary"
          class="text-12px leading-[1.5] text-[var(--el-text-color-secondary)] line-clamp-2 break-all"
        >
          {{ payload.summary }}
        </div>
      </div>
      <img
        v-if="payload.coverUrl"
        class="flex-shrink-0 w-[60px] h-[60px] object-cover rounded bg-[var(--el-fill-color-light)]"
        :src="payload.coverUrl"
      />
    </div>
    <div
      class="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-t-solid border-[var(--el-border-color-lighter)] text-12px text-[var(--el-text-color-secondary)]"
    >
      <img
        v-if="sourceChannel?.avatar"
        class="w-4 h-4 rounded-full object-cover flex-shrink-0"
        :src="sourceChannel.avatar"
      />
      <Icon v-else icon="ep:promotion" :size="14" />
      <span class="truncate">{{ sourceChannel?.name || '频道消息' }}</span>
    </div>
  </div>

  <!-- 富文本详情：全屏弹窗按需挂载，destroy-on-close 关闭后释放 v-dompurify-html 解析的 DOM -->
  <Dialog v-model="detailVisible" :title="payload.title || '详情'" fullscreen destroy-on-close>
    <div
      v-loading="detailLoading"
      class="material-detail-body max-w-[720px] mx-auto px-5 pt-6 pb-20"
    >
      <div class="text-[22px] font-600 leading-[1.4] text-[var(--el-text-color-primary)] mb-5">
        {{ payload.title || '' }}
      </div>
      <div
        v-if="detailHtml"
        class="article-content text-15px leading-[1.75] text-[var(--el-text-color-primary)]"
        v-dompurify-html="detailHtml"
      ></div>
      <div
        v-else-if="!detailLoading"
        class="text-center text-[var(--el-text-color-secondary)] mt-20"
      >
        暂无正文
      </div>
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
import { openSafeUrl } from '@/utils/url'

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
const payload = computed<MaterialMessage>(() => parseMessage<MaterialMessage>(props.content) ?? {})

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
    openSafeUrl(payload.value.url)
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
/* hover 阴影 + transition：合写一处，写法更紧凑 */
.material-card {
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 2px 12px rgb(0 0 0 / 8%);
  }
}

/* :deep 穿透 v-dompurify-html 渲染的内嵌 DOM；统一控制富文本里的 img / p / hN 排版 */
.article-content {
  :deep(img) {
    height: auto;
    max-width: 100%;
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
</style>
