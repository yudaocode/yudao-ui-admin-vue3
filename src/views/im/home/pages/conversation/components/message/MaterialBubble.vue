<template>
  <!-- TODO @AI：要不使用 model 组件，弹窗。用户允许手动弹窗； -->
  <div class="material-card" @click="onClick">
    <div class="title">{{ payload.title || '(无标题)' }}</div>
    <img v-if="payload.coverUrl" class="cover" :src="payload.coverUrl" />
    <div v-if="payload.summary" class="summary">{{ payload.summary }}</div>
    <span class="link">{{ payload.url ? '外链' : '查看详情' }}</span>
  </div>

  <!-- 全屏文章详情：仿微信公众号文章打开 -->
  <el-dialog
    v-model="detailVisible"
    :show-close="false"
    fullscreen
    append-to-body
    destroy-on-close
    class="material-detail-dialog"
  >
    <template #header>
      <div class="detail-header">
        <button class="back-btn" @click="detailVisible = false">
          <Icon icon="ant-design:close-outlined" :size="18" />
        </button>
        <span class="detail-title">{{ payload.title || '详情' }}</span>
        <span class="placeholder"></span>
      </div>
    </template>
    <div v-loading="detailLoading" class="detail-body">
      <div class="article-title">{{ payload.title || '' }}</div>
      <div v-if="detailHtml" class="article-content" v-html="detailHtml"></div>
      <div v-else-if="!detailLoading" class="article-empty">暂无正文</div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { ElDialog } from 'element-plus'
import type { PropType } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { getChannelMaterial } from '@/api/im/channel/material'
import { parseMessage, type MaterialMessage } from '@/views/im/utils/message'

interface MessageInfo {
  materialId?: number
  content: string
}

const props = defineProps({
  message: { type: Object as PropType<MessageInfo>, required: true }
})

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
    window.open(payload.value.url, '_blank')
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
</style>

<style lang="scss">
/* 全屏文章详情样式（非 scoped；el-dialog 全屏后 header / body 在 teleport 子树） */
.material-detail-dialog {
  .el-dialog__header {
    margin: 0;
    padding: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-dialog__body {
    padding: 0;
  }

  .detail-header {
    display: flex;
    align-items: center;
    height: 52px;
    padding: 0 12px;
    background: var(--el-bg-color);

    .back-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      color: var(--el-text-color-primary);

      &:hover {
        background: var(--el-fill-color-light);
      }
    }

    .detail-title {
      flex: 1;
      text-align: center;
      font-size: 15px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .placeholder {
      width: 36px;
    }
  }

  .detail-body {
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 20px 80px;
    min-height: calc(100vh - 52px);

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

      :deep(img),
      img {
        max-width: 100%;
        height: auto;
      }

      :deep(p),
      p {
        margin: 12px 0;
      }

      :deep(h1),
      :deep(h2),
      :deep(h3),
      h1,
      h2,
      h3 {
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
}
</style>
