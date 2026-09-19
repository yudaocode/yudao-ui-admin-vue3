<template>
  <!-- 文档评论 -->
  <el-divider content-position="left">
    {{ commentCount ? `评论（${commentCount}）` : '评论' }}
  </el-divider>
  <div v-loading="loading">
    <!-- 发表评论 -->
    <div class="mb-16px">
      <el-input
        v-model="newContent"
        :rows="2"
        maxlength="2000"
        placeholder="请输入评论内容"
        show-word-limit
        type="textarea"
      />
      <div class="mt-8px flex justify-end">
        <el-button :loading="submitting" type="primary" @click="submitRootComment">
          发表评论
        </el-button>
      </div>
    </div>
    <el-empty v-if="comments.length === 0" :image-size="72" description="暂无评论" />
    <!-- 评论列表 -->
    <div
      v-for="comment in comments"
      :key="comment.id"
      class="flex gap-12px border-b border-[var(--el-border-color-lighter)] py-16px text-14px leading-[1.6]"
    >
      <el-avatar :size="32" class="knowledge-comment-avatar shrink-0">
        {{ comment.userName?.slice(0, 1) }}
      </el-avatar>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-10px">
          <span class="font-500">{{ comment.userName }}</span>
          <span class="text-12px text-[var(--el-text-color-secondary)]">
            {{ formatDate(comment.createTime) }}
          </span>
        </div>
        <div class="mt-6px whitespace-pre-wrap break-all">{{ comment.content }}</div>
        <div class="mt-6px flex items-center gap-12px">
          <el-button
            v-if="comment.userId === loginUserId"
            class="!ml-0"
            link
            type="danger"
            @click="handleDelete(comment)"
          >
            删除
          </el-button>
          <el-button link type="primary" @click="startReply(comment, comment)">回复</el-button>
        </div>
        <!-- 评论回复 -->
        <div
          v-for="reply in comment.children"
          :key="reply.id"
          class="mt-12px flex gap-10px rounded-4px bg-[var(--el-fill-color-light)] px-16px py-12px"
        >
          <el-avatar :size="28" class="knowledge-comment-avatar shrink-0">
            {{ reply.userName?.slice(0, 1) }}
          </el-avatar>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-10px">
              <span class="font-500">{{ reply.userName }}</span>
              <span class="text-12px text-[var(--el-text-color-secondary)]">
                {{ formatDate(reply.createTime) }}
              </span>
            </div>
            <div
              v-if="reply.replyUserName"
              class="mt-4px text-12px text-[var(--el-text-color-secondary)]"
            >
              回复 @{{ reply.replyUserName }}
            </div>
            <div class="mt-4px whitespace-pre-wrap break-all">{{ reply.content }}</div>
            <div class="mt-6px flex items-center gap-12px">
              <el-button
                v-if="reply.userId === loginUserId"
                class="!ml-0"
                link
                type="danger"
                @click="handleDelete(reply)"
              >
                删除
              </el-button>
              <el-button link type="primary" @click="startReply(comment, reply)">回复</el-button>
            </div>
          </div>
        </div>
        <!-- 回复评论 -->
        <div v-if="replyMainId === comment.id" class="mt-8px flex gap-8px">
          <el-input
            v-model="replyContent"
            :placeholder="`回复 ${replyUserName}`"
            maxlength="2000"
            @keyup.enter="submitReply"
          />
          <el-button :loading="submitting" type="primary" @click="submitReply">回复</el-button>
          <el-button @click="cancelReply">取消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as KnowledgeDocumentCommentApi from '@/api/pms/kb/interaction/comment'
import { useUserStore } from '@/store/modules/user'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'PmsKnowledgeDocumentComment' })

const props = defineProps<{ documentId: number }>()
const message = useMessage() // 消息弹窗
const loginUserId = computed(() => useUserStore().getUser.id) // 当前登录用户编号
const loading = ref(false) // 评论加载中
const submitting = ref(false) // 评论提交中
const comments = ref<KnowledgeDocumentCommentApi.PmsKnowledgeDocumentCommentVO[]>([]) // 评论列表
const newContent = ref('') // 新评论内容
const replyMainId = ref<number>() // 当前回复的主评论编号
const replyUserId = ref<number>() // 当前回复对象用户编号
const replyUserName = ref('') // 当前回复对象姓名
const replyContent = ref('') // 回复内容
const commentCount = computed(() =>
  comments.value.reduce((count, comment) => count + 1 + (comment.children?.length || 0), 0)
) // 评论总数（包含回复）

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    comments.value = await KnowledgeDocumentCommentApi.getKnowledgeDocumentCommentList(
      props.documentId
    )
  } finally {
    loading.value = false
  }
}

/** 发表评论 */
async function submitRootComment() {
  // 1. 校验评论内容
  if (!newContent.value.trim()) {
    message.warning('请输入评论内容')
    return
  }
  submitting.value = true
  try {
    // 2. 提交评论
    const data = {
      documentId: props.documentId,
      content: newContent.value
    } as unknown as KnowledgeDocumentCommentApi.PmsKnowledgeDocumentCommentVO
    await KnowledgeDocumentCommentApi.createKnowledgeDocumentComment(data)
    message.success('评论成功')
    // 3. 清空输入并刷新评论列表
    newContent.value = ''
    await getList()
  } finally {
    submitting.value = false
  }
}

/** 开始回复评论 */
function startReply(
  mainComment: KnowledgeDocumentCommentApi.PmsKnowledgeDocumentCommentVO,
  targetComment: KnowledgeDocumentCommentApi.PmsKnowledgeDocumentCommentVO
) {
  replyMainId.value = mainComment.id
  replyUserId.value = targetComment.userId
  replyUserName.value = targetComment.userName || ''
  replyContent.value = ''
}

/** 取消回复评论 */
function cancelReply() {
  replyMainId.value = undefined
  replyUserId.value = undefined
  replyUserName.value = ''
  replyContent.value = ''
}

/** 提交评论回复 */
async function submitReply() {
  // 1. 校验回复内容和主评论
  if (!replyContent.value.trim() || !replyMainId.value) {
    message.warning('请输入回复内容')
    return
  }
  submitting.value = true
  try {
    // 2. 提交评论回复
    const data = {
      documentId: props.documentId,
      mainId: replyMainId.value,
      replyUserId: replyUserId.value,
      content: replyContent.value
    } as unknown as KnowledgeDocumentCommentApi.PmsKnowledgeDocumentCommentVO
    await KnowledgeDocumentCommentApi.createKnowledgeDocumentComment(data)
    message.success('回复成功')
    // 3. 重置回复状态并刷新列表
    cancelReply()
    await getList()
  } finally {
    submitting.value = false
  }
}

/** 删除评论 */
async function handleDelete(comment: KnowledgeDocumentCommentApi.PmsKnowledgeDocumentCommentVO) {
  try {
    // 删除的二次确认
    await message.delConfirm('确认删除这条评论吗？')
    // 发起删除
    await KnowledgeDocumentCommentApi.deleteKnowledgeDocumentComment(comment.id)
    message.success('删除成功')
    await getList()
  } catch {}
}

watch(
  () => props.documentId,
  () => getList(),
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.knowledge-comment-avatar {
  --el-avatar-bg-color: var(--el-color-primary);
  color: #fff;
}
</style>
