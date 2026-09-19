<template>
  <el-divider v-if="showTitle" content-position="left">评论</el-divider>
  <div v-loading="loading">
    <!-- 发表评论 -->
    <div v-if="editable" class="mb-20px flex items-start gap-12px">
      <el-avatar
        class="shrink-0 !bg-[var(--el-color-primary)] !text-white"
        :size="34"
        :src="loginUser.avatar"
      >
        {{ loginUser.nickname?.slice(0, 1) }}
      </el-avatar>
      <div class="min-w-0 flex-1">
        <el-input
          v-model="newContent"
          :rows="3"
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
    </div>
    <!-- 评论列表 -->
    <el-empty v-if="commentList.length === 0" description="暂无评论" :image-size="72" />
    <div
      v-for="comment in commentList"
      :key="comment.id"
      class="flex gap-12px border-b-1 border-b-solid border-b-[var(--el-border-color-lighter)] py-16px text-14px leading-[1.6]"
    >
      <el-avatar class="shrink-0 !bg-[var(--el-color-primary)] !text-white" :size="32">
        {{ comment.userName?.slice(0, 1) }}
      </el-avatar>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-10px">
          <span class="font-500">{{ comment.userName || '-' }}</span>
          <span class="text-12px text-[var(--el-text-color-secondary)]">
            {{ formatDate(comment.createTime) }}
          </span>
        </div>
        <el-input
          v-if="editingId === comment.id"
          v-model="editingContent"
          class="my-8px"
          :rows="2"
          maxlength="2000"
          type="textarea"
        />
        <div v-else class="mt-6px whitespace-pre-wrap break-all">{{ comment.content }}</div>
        <div v-if="editable" class="mt-6px flex items-center gap-12px">
          <template v-if="comment.userId === loginUserId">
            <el-button
              v-if="editingId !== comment.id"
              class="!ml-0"
              link
              type="primary"
              @click="startEdit(comment)"
            >
              编辑
            </el-button>
            <el-button v-else class="!ml-0" link type="primary" @click="submitEdit(comment)">
              保存
            </el-button>
            <el-button v-if="editingId === comment.id" class="!ml-0" link @click="cancelEdit">
              取消
            </el-button>
            <el-popconfirm
              cancel-button-text="取消"
              confirm-button-text="确定"
              title="确认删除这条评论吗？"
              width="220"
              @confirm="handleDelete(comment)"
            >
              <template #reference>
                <el-button class="!ml-0" link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
          <el-button class="!ml-0" link type="primary" @click="startReply(comment, comment)">
            回复
          </el-button>
        </div>
        <!-- 评论回复 -->
        <div
          v-for="reply in comment.children || []"
          :key="reply.id"
          class="mt-12px flex gap-10px rounded-4px bg-[var(--el-fill-color-light)] px-16px py-12px"
        >
          <el-avatar class="shrink-0 !bg-[var(--el-color-primary)] !text-white" :size="28">
            {{ reply.userName?.slice(0, 1) }}
          </el-avatar>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-10px">
              <span class="font-500">{{ reply.userName || '-' }}</span>
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
            <el-input
              v-if="editingId === reply.id"
              v-model="editingContent"
              class="my-8px"
              :rows="2"
              maxlength="2000"
              type="textarea"
            />
            <div v-else class="mt-4px whitespace-pre-wrap break-all">{{ reply.content }}</div>
            <div v-if="editable" class="mt-6px flex items-center gap-12px">
              <template v-if="reply.userId === loginUserId">
                <el-button
                  v-if="editingId !== reply.id"
                  class="!ml-0"
                  link
                  type="primary"
                  @click="startEdit(reply)"
                >
                  编辑
                </el-button>
                <el-button v-else class="!ml-0" link type="primary" @click="submitEdit(reply)">
                  保存
                </el-button>
                <el-button v-if="editingId === reply.id" class="!ml-0" link @click="cancelEdit">
                  取消
                </el-button>
                <el-popconfirm
                  cancel-button-text="取消"
                  confirm-button-text="确定"
                  title="确认删除这条评论吗？"
                  width="220"
                  @confirm="handleDelete(reply)"
                >
                  <template #reference>
                    <el-button class="!ml-0" link type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
              <el-button class="!ml-0" link type="primary" @click="startReply(comment, reply)">
                回复
              </el-button>
            </div>
          </div>
        </div>
        <!-- 回复评论 -->
        <div v-if="replyMainId === comment.id" class="mt-10px flex gap-8px">
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
import * as WorkItemCommentApi from '@/api/pms/pm/workitem/comment'
import { useUserStore } from '@/store/modules/user'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'PmsWorkItemComment' })

const props = withDefaults(
  defineProps<{
    workItemId: number
    editable: boolean
    showTitle?: boolean
  }>(),
  { showTitle: true }
)
const emit = defineEmits<{ changed: [] }>() // 定义 changed 事件，用于评论变化后的回调

const message = useMessage() // 消息弹窗
const loginUser = computed(() => useUserStore().getUser) // 当前登录用户
const loginUserId = computed(() => loginUser.value.id) // 当前登录用户编号
const loading = ref(false) // 评论加载中
const submitting = ref(false) // 评论提交中
const commentList = ref<WorkItemCommentApi.PmsWorkItemCommentVO[]>([]) // 评论列表
const newContent = ref('') // 新评论内容
const replyMainId = ref<number>() // 当前回复的主评论编号
const replyUserId = ref<number>() // 当前回复对象用户编号
const replyUserName = ref('') // 当前回复对象姓名
const replyContent = ref('') // 回复内容
const editingId = ref<number>() // 当前编辑的评论编号
const editingContent = ref('') // 编辑中的评论内容

/** 查询工作项评论列表 */
async function getCommentList() {
  loading.value = true
  try {
    commentList.value = await WorkItemCommentApi.getWorkItemCommentList(props.workItemId)
  } finally {
    loading.value = false
  }
}

/** 发表评论 */
async function submitRootComment() {
  if (!newContent.value.trim()) {
    message.warning('请输入评论内容')
    return
  }
  submitting.value = true
  try {
    await WorkItemCommentApi.createWorkItemComment({
      ...getDefaultCommentData(),
      content: newContent.value
    })
    message.success('评论成功')
    newContent.value = ''
    await getCommentList()
    emit('changed')
  } finally {
    submitting.value = false
  }
}

/** 开始回复评论 */
function startReply(
  mainComment: WorkItemCommentApi.PmsWorkItemCommentVO,
  targetComment: WorkItemCommentApi.PmsWorkItemCommentVO
) {
  replyMainId.value = mainComment.id
  replyUserId.value = targetComment.userId
  replyUserName.value = targetComment.userName || '-'
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
  if (!replyContent.value.trim() || !replyMainId.value) {
    message.warning('请输入回复内容')
    return
  }
  submitting.value = true
  try {
    await WorkItemCommentApi.createWorkItemComment({
      ...getDefaultCommentData(),
      mainId: replyMainId.value,
      replyUserId: replyUserId.value,
      content: replyContent.value
    })
    message.success('回复成功')
    cancelReply()
    await getCommentList()
    emit('changed')
  } finally {
    submitting.value = false
  }
}

/** 开始编辑评论 */
function startEdit(comment: WorkItemCommentApi.PmsWorkItemCommentVO) {
  editingId.value = comment.id
  editingContent.value = comment.content
}

/** 取消编辑评论 */
function cancelEdit() {
  editingId.value = undefined
  editingContent.value = ''
}

/** 提交评论修改 */
async function submitEdit(comment: WorkItemCommentApi.PmsWorkItemCommentVO) {
  if (!editingContent.value.trim()) {
    message.warning('请输入评论内容')
    return
  }
  await WorkItemCommentApi.updateWorkItemComment({
    ...comment,
    content: editingContent.value
  })
  message.success('更新成功')
  cancelEdit()
  await getCommentList()
  emit('changed')
}

/** 删除评论 */
async function handleDelete(comment: WorkItemCommentApi.PmsWorkItemCommentVO) {
  await WorkItemCommentApi.deleteWorkItemComment(comment.id!)
  message.success('删除成功')
  await getCommentList()
  emit('changed')
}

/** 获得默认评论数据 */
function getDefaultCommentData(): WorkItemCommentApi.PmsWorkItemCommentVO {
  return {
    workItemId: props.workItemId,
    content: ''
  }
}

/** 监听工作项变化并刷新评论 */
watch(
  () => props.workItemId,
  () => getCommentList(),
  { immediate: true }
)
</script>
