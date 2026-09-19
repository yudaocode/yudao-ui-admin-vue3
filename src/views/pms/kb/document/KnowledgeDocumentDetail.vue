<template>
  <!-- 文档信息与快捷操作 -->
  <div
    class="mb-16px flex items-start justify-between gap-24px border-b border-[var(--el-border-color-lighter)] pb-12px pt-8px max-[1100px]:flex-col"
  >
    <div class="min-w-0">
      <div class="truncate text-20px font-600 leading-[1.4]">{{ document.title }}</div>
      <div
        class="mt-8px flex items-center gap-10px text-12px text-[var(--el-text-color-secondary)]"
      >
        <span v-if="document.creatorUserName">{{ document.creatorUserName }} 创建于</span>
        <span>{{ formatDate(document.createTime) }}</span>
        <el-tag size="small" :type="getKnowledgeDocumentStatusTagType(document.status)">
          {{ getKnowledgeDocumentStatusName(document.status) }}
        </el-tag>
      </div>
      <div v-if="labels.length" class="mt-10px flex flex-wrap items-center gap-8px">
        <span
          v-for="label in labels"
          :key="label.id"
          :style="{
            color: label.color,
            borderColor: label.color,
            backgroundColor: `${label.color}14`
          }"
          class="rounded border border-solid px-6px py-1px text-12px leading-18px"
        >
          {{ label.name }}
        </span>
      </div>
    </div>
    <div class="flex shrink-0 flex-wrap items-center gap-8px">
      <el-button
        v-if="canEditKnowledgeContent(document.currentUserLevel)"
        v-hasPermi="['pms:kb:library:update']"
        class="!ml-0"
        size="small"
        @click="emit('update')"
      >
        <Icon icon="ep:edit" />编辑
      </el-button>
      <el-button
        v-if="canManage"
        v-hasPermi="['pms:kb:library:update']"
        class="!ml-0"
        size="small"
        @click="emit('permission')"
      >
        <Icon icon="ep:user" />协作
      </el-button>
      <el-button class="!ml-0" size="small" @click="emit('collect')">
        <Icon :icon="document.favoriteStatus ? 'ep:star-filled' : 'ep:star'" />
        {{ document.favoriteStatus ? '已关注' : '关注' }}
      </el-button>
      <el-button
        v-if="canEditKnowledgeContent(document.currentUserLevel)"
        v-hasPermi="['pms:kb:library:update']"
        class="!ml-0"
        size="small"
        type="primary"
        @click="emit('share')"
      >
        <Icon icon="ep:share" />分享
      </el-button>
      <el-dropdown
        v-if="canEditKnowledgeContent(document.currentUserLevel)"
        @command="handleMoreCommand"
      >
        <el-button class="!ml-0" size="small"><Icon icon="ep:more-filled" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-if="canManage"
              v-hasPermi="['pms:kb:library:update']"
              command="move"
            >
              移动
            </el-dropdown-item>
            <el-dropdown-item
              v-if="canDeleteKnowledgeContent(document.currentUserLevel)"
              v-hasPermi="['pms:kb:library:delete']"
              command="delete"
              divided
            >
              删除
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>

  <!-- 文档正文或文件预览 -->
  <div
    v-if="document.type === PmsKnowledgeDocumentType.RICH_TEXT"
    v-dompurify-html="document.content || '<p>暂无内容</p>'"
    class="pms-knowledge-rich-text"
  ></div>
  <div v-else>
    <template v-if="document.content">
      <div class="mb-12px flex items-center justify-end gap-8px">
        <el-tag type="info">{{ document.fileType || '文件' }}</el-tag>
        <span
          v-if="document.fileSize !== undefined"
          class="text-12px text-[var(--el-text-color-secondary)]"
        >
          {{ formatKnowledgeFileSize(document.fileSize) }}
        </span>
        <el-link
          v-if="document.downloadStatus"
          :href="document.content"
          target="_blank"
          type="primary"
        >
          下载文件
        </el-link>
        <span v-else class="text-12px text-[var(--el-text-color-secondary)]">
          当前角色仅可在线预览
        </span>
      </div>
      <FilePreview
        :downloadable="document.downloadStatus"
        :file-name="document.title"
        :file-type="document.fileType"
        :url="document.previewUrl || document.content"
      />
    </template>
    <el-empty v-else description="文件未上传" />
  </div>

  <!-- 仅富文本支持点赞和评论；文件类型不支持互动 -->
  <div
    v-if="document.type === PmsKnowledgeDocumentType.RICH_TEXT"
    class="mt-12px flex items-center gap-10px text-12px text-[var(--el-text-color-secondary)]"
  >
    <el-button link :type="document.likeStatus ? 'primary' : 'info'" @click="emit('like')">
      <Icon :icon="document.likeStatus ? 'ant-design:like-filled' : 'ant-design:like-outlined'" />
      {{ document.likeStatus ? '取消点赞' : '点赞' }}
    </el-button>
    <span v-if="likeSummary">{{ likeSummary }}</span>
    <el-avatar
      v-for="user in document.likeUsers.slice(0, 5)"
      :key="user.id"
      :size="22"
      :src="user.avatar"
    >
      {{ user.nickname?.slice(0, 1) }}
    </el-avatar>
  </div>

  <!-- 文档评论 -->
  <KnowledgeDocumentComment
    v-if="document.type === PmsKnowledgeDocumentType.RICH_TEXT"
    :document-id="document.id"
  />
</template>

<script lang="ts" setup>
import * as KnowledgeDocumentApi from '@/api/pms/kb/content/document'
import type { PmsKnowledgeDocumentLabelVO } from '@/api/pms/kb/content/document/label'
import { FilePreview } from '@/components/FilePreview'
import { useUserStore } from '@/store/modules/user'
import { formatDate } from '@/utils/formatTime'
import KnowledgeDocumentComment from './KnowledgeDocumentComment.vue'
import { PmsKnowledgeContentLevel, PmsKnowledgeDocumentType } from '@/views/pms/kb/utils/constants'
import { canDeleteKnowledgeContent, canEditKnowledgeContent } from '@/views/pms/kb/utils/permission'
import {
  getKnowledgeDocumentStatusName,
  getKnowledgeDocumentStatusTagType,
  formatKnowledgeFileSize
} from '@/views/pms/kb/utils/format'

defineOptions({ name: 'PmsKnowledgeDocumentDetail' })

const props = defineProps<{
  document: KnowledgeDocumentApi.PmsKnowledgeDocumentVO
  labels: PmsKnowledgeDocumentLabelVO[]
}>() // 组件参数
const emit = defineEmits(['collect', 'like', 'permission', 'share', 'update', 'move', 'delete']) // 组件事件
const message = useMessage() // 消息弹窗

const canManage = computed(
  () => props.document.currentUserLevel === PmsKnowledgeContentLevel.MANAGE
) // 是否可管理文档协作权限
const loginUserId = computed(() => useUserStore().getUser.id) // 当前登录用户编号
const likeSummary = computed(() => {
  // 优先表达“您”和其他点赞人数
  const likeUsers = props.document.likeUsers.filter((user) => user.nickname)
  if (props.document.likeStatus) {
    const otherCount = likeUsers.filter((user) => user.id !== loginUserId.value).length
    return otherCount > 0 ? `您和其他 ${otherCount} 人` : '您赞了该文档'
  }
  return likeUsers.length > 0 ? `${likeUsers.length} 人赞了该文档` : ''
}) // 点赞摘要文案

/** 处理更多操作 */
async function handleMoreCommand(command: string) {
  if (command === 'delete') {
    await handleDelete()
    return
  }
  if (command === 'move') emit('move')
}

/** 删除文档 */
async function handleDelete() {
  try {
    // 删除的二次确认
    await message.delConfirm(`确认删除文档“${props.document.title}”及其子文档吗？`)
    // 发起删除
    await KnowledgeDocumentApi.deleteKnowledgeDocument(props.document.id)
    message.success('删除成功')
    // 通知父组件刷新目录树
    emit('delete')
  } catch {}
}
</script>

<!-- 富文本由 v-html 动态插入，使用唯一的全局命名空间保证子节点样式稳定生效 -->
<style lang="scss">
.pms-knowledge-rich-text {
  display: flow-root;
  padding: 0 0 4px;
  color: var(--el-text-color-primary);
  font-size: 14px;
  overflow-wrap: anywhere;

  h1 {
    margin: 20px 0 14px;
    font-size: 24px;
    font-weight: 600;
    line-height: 1.4;
  }

  h2 {
    margin: 18px 0 10px;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.4;
  }

  h3 {
    margin: 14px 0 8px;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
  }

  p {
    margin: 0 0 12px;
    line-height: 1.75;
  }

  > :first-child {
    margin-top: 0;
  }

  img {
    height: auto;
    max-width: 100%;
  }
}
</style>
