<template>
  <ContentWrap>
    <!-- 回复标题和筛选 -->
    <div
      class="mb-12px flex flex-wrap items-center justify-between gap-12px bg-[var(--el-fill-color-light)] px-12px py-8px"
    >
      <h3 class="m-0 text-16px font-semibold">回复 {{ detail.replyCount || 0 }}</h3>
      <div class="flex gap-8px">
        <el-select v-model="replyScope" class="!w-120px" @change="handleReplyScopeChange">
          <el-option label="查看所有" value="all" />
          <el-option label="只看楼主" value="owner" />
          <el-option label="只看我的" value="mine" />
        </el-select>
        <el-select v-model="replySortOrder" class="!w-120px" @change="handleReplySortChange">
          <el-option label="时间升序" value="asc" />
          <el-option label="时间降序" value="desc" />
        </el-select>
      </div>
    </div>
    <!-- 发表主回复 -->
    <div v-if="replyVisible" class="mb-12px">
      <el-input
        ref="replyInputRef"
        v-model="replyContent"
        type="textarea"
        :rows="3"
        show-word-limit
        placeholder="分享你的看法，参与讨论"
      />
      <div class="mt-8px text-right">
        <el-button :disabled="submitLoading" @click="handleCancelReply">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          :disabled="!replyContent.trim()"
          @click="submitReply()"
        >
          发表回复
        </el-button>
      </div>
    </div>
    <!-- 主回复按楼层分页 -->
    <div v-loading="replyLoading">
      <div
        v-for="(reply, index) in replyList"
        :key="reply.id"
        class="border-t border-[var(--el-border-color-lighter)] py-12px"
      >
        <div class="flex items-center gap-10px">
          <el-avatar :size="36" class="shrink-0">{{ reply.userName?.slice(0, 1) }}</el-avatar>
          <div>
            <span class="font-medium">{{ reply.userName }}</span>
            <el-tag
              v-if="reply.userId === detail.userId"
              size="small"
              effect="plain"
              class="ml-8px"
            >
              楼主
            </el-tag>
            <div class="mt-2px text-12px text-[var(--el-text-color-secondary)]">
              {{ formatDate(reply.createTime) }}
            </div>
          </div>
        </div>
        <div class="my-8px whitespace-pre-wrap break-words leading-7">{{ reply.content }}</div>
        <!-- 楼层操作与楼层编号 -->
        <div class="flex items-center justify-between gap-8px">
          <div class="flex flex-wrap items-center gap-8px [&>.el-button]:!ml-0">
            <el-button link type="primary" @click="handleReply(reply, reply.id!)">
              <Icon icon="ep:chat-dot-round" :size="14" class="mr-4px" aria-hidden="true" /> 回复
            </el-button>
            <el-button link type="primary" @click="handleReplyLike(reply)">
              <Icon
                :icon="reply.liked ? 'mdi:thumb-up' : 'mdi:thumb-up-outline'"
                :size="14"
                class="mr-4px"
                aria-hidden="true"
              />
              {{ reply.liked ? '取消点赞' : '点赞' }}（{{ reply.likeCount || 0 }}）
            </el-button>
            <el-button
              link
              type="primary"
              v-if="getChildReplies(reply).length"
              :aria-expanded="!!expandedReplies[reply.id!]"
              @click="expandedReplies[reply.id!] = !expandedReplies[reply.id!]"
            >
              <Icon
                :icon="expandedReplies[reply.id!] ? 'ep:arrow-up' : 'ep:arrow-down'"
                :size="14"
                class="mr-4px"
                aria-hidden="true"
              />
              <span>{{ expandedReplies[reply.id!] ? '收起评论' : '展开评论' }}</span>
              <span>（{{ getChildReplies(reply).length }}）</span>
            </el-button>
            <el-button
              v-if="detail.userId === currentUserId || isSuperAdmin"
              link
              type="danger"
              @click="handleDeleteReply(reply.id!)"
            >
              删除
            </el-button>
          </div>
          <span class="shrink-0 text-12px text-[var(--el-text-color-secondary)]">
            {{ (replyQueryParams.pageNo - 1) * replyQueryParams.pageSize + index + 1 }} 楼
          </span>
        </div>
        <!-- 点赞摘要，完整名单按需查看 -->
        <div
          v-if="reply.likeUserNames?.length"
          class="mt-6px text-13px text-[var(--el-text-color-secondary)]"
        >
          {{ reply.likeUserNames.slice(0, 3).join('、') }}，
          <el-popover trigger="click" title="点赞人" :width="260">
            <template #reference>
              <el-button link>共 {{ reply.likeCount || 0 }} 人觉得很赞</el-button>
            </template>
            <div class="break-words leading-7">{{ reply.likeUserNames.join('、') }}</div>
          </el-popover>
        </div>
        <!-- 楼层内评论使用紧凑列表，避免每条评论重复大块卡片 -->
        <div
          v-if="expandedReplies[reply.id!] && getChildReplies(reply).length"
          class="ml-0 mt-8px border-l border-[var(--el-border-color-lighter)] pl-12px sm:ml-44px"
        >
          <div
            v-for="child in getChildReplies(reply)"
            :key="child.id"
            class="flex flex-wrap items-start gap-x-12px gap-y-4px border-t border-[var(--el-border-color-lighter)] py-8px"
          >
            <div class="min-w-0 flex flex-1 items-start gap-8px">
              <el-avatar :size="24" class="shrink-0">{{ child.userName?.slice(0, 1) }}</el-avatar>
              <div class="min-w-0 break-words text-13px leading-6">
                <span class="text-[var(--el-color-primary)]">{{ child.userName }}：</span>
                <span
                  v-if="child.replyUserName"
                  class="mr-4px text-[var(--el-text-color-secondary)]"
                >
                  @{{ child.replyUserName }}
                </span>
                <span class="whitespace-pre-wrap">{{ child.content }}</span>
              </div>
            </div>
            <div
              class="flex flex-wrap items-center gap-8px text-12px text-[var(--el-text-color-secondary)] [&>.el-button]:!ml-0"
            >
              <span>{{ formatDate(child.createTime) }}</span>
              <el-button link type="primary" @click="handleReply(child, reply.id!)">
                <Icon icon="ep:chat-dot-round" :size="14" class="mr-4px" aria-hidden="true" /> 回复
              </el-button>
              <el-button
                v-if="detail.userId === currentUserId || isSuperAdmin"
                link
                type="danger"
                @click="handleDeleteReply(child.id!)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
        <!-- 在所选楼层内回复，保持实际被回复人 -->
        <div v-if="replyTarget && replyRootId === reply.id" class="ml-0 mt-8px sm:ml-44px">
          <el-input
            v-model="inlineContent"
            type="textarea"
            :rows="2"
            maxlength="255"
            show-word-limit
            :placeholder="'回复 ' + replyTarget.userName"
          />
          <div class="mt-8px text-right">
            <el-button :disabled="submitLoading" @click="handleCancelReply">取消</el-button>
            <el-button
              type="primary"
              :loading="submitLoading"
              :disabled="!inlineContent.trim()"
              @click="submitReply(replyTarget)"
            >
              发表回复
            </el-button>
          </div>
        </div>
      </div>
      <el-empty
        v-if="!replyLoading && replyList.length === 0"
        description="暂无回复"
        :image-size="60"
      />
      <Pagination
        v-if="replyTotal > 0"
        v-model:page="replyQueryParams.pageNo"
        v-model:limit="replyQueryParams.pageSize"
        :total="replyTotal"
        @pagination="getReplyList"
      />
    </div>
  </ContentWrap>
</template>
<script setup lang="ts">
import * as DiscussionApi from '@/api/oa/discussion'
import * as DiscussionLikeApi from '@/api/oa/discussion/like'
import * as DiscussionReplyApi from '@/api/oa/discussion/reply'
import { formatDate } from '@/utils/formatTime'
import { useUserStoreWithOut } from '@/store/modules/user'

defineOptions({ name: 'OaDiscussionReply' })

const props = defineProps<{ detail: DiscussionApi.OaDiscussionVO }>()
const detail = toRef(props, 'detail') // 讨论详情
const emit = defineEmits<{ success: [] }>() // 回复操作成功
const message = useMessage() // 消息提示
const { t } = useI18n() // 国际化
const inlineContent = ref('') // 楼层内回复内容
const submitLoading = ref(false) // 回复提交中
const userStore = useUserStoreWithOut() // 用户信息 Store
const currentUserId = userStore.getUser.id // 当前用户编号
const isSuperAdmin = userStore.getRoles.includes('super_admin') // 是否为超级管理员
const replyLoading = ref(false) // 回复加载中
const replyList = ref<DiscussionReplyApi.OaDiscussionReplyVO[]>([]) // 回复列表
const replyTotal = ref(0) // 回复总数
const replyContent = ref('') // 回复内容
const replyVisible = ref(false) // 主回复输入框是否显示
const replyInputRef = ref() // 主回复输入框
const replyRootId = ref<number>() // 被回复对象所属楼层
const expandedReplies = reactive<Record<number, boolean>>({}) // 楼层评论展开状态，默认收起
const replyTarget = ref<DiscussionReplyApi.OaDiscussionReplyVO>() // 被回复对象
const replyScope = ref('all') // 回复查看范围
const replySortOrder = ref('asc') // 回复时间排序
const replyQueryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  discussionId: undefined as number | undefined,
  userId: undefined as number | undefined,
  sortingFields: [{ field: 'createTime', order: 'asc' }]
}) // 回复查询参数

/** 定位到主回复输入框 */
async function focusReply() {
  handleCancelReply()
  replyVisible.value = true
  await nextTick()
  replyInputRef.value?.$el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  replyInputRef.value?.focus()
}
defineExpose({ focusReply }) // 提供正文区回复入口

/** 取消回复，收起输入框并清空内容 */
function handleCancelReply() {
  replyVisible.value = false
  replyContent.value = ''
  replyTarget.value = undefined
  replyRootId.value = undefined
  inlineContent.value = ''
}

/** 查询回复列表 */
async function getReplyList() {
  if (!replyQueryParams.discussionId) return
  replyLoading.value = true
  try {
    const data = await DiscussionReplyApi.getDiscussionReplyPage(replyQueryParams)
    replyList.value = data.list
    replyTotal.value = data.total
  } finally {
    replyLoading.value = false
  }
}

/** 回复查看范围切换操作 */
function handleReplyScopeChange() {
  replyQueryParams.userId =
    replyScope.value === 'owner'
      ? detail.value?.userId
      : replyScope.value === 'mine'
        ? currentUserId
        : undefined
  replyQueryParams.pageNo = 1
  getReplyList()
}

/** 回复时间排序切换操作 */
function handleReplySortChange() {
  replyQueryParams.sortingFields = [{ field: 'createTime', order: replySortOrder.value }]
  replyQueryParams.pageNo = 1
  getReplyList()
}

/** 点赞回复 */
async function handleReplyLike(reply: DiscussionReplyApi.OaDiscussionReplyVO) {
  // 发起点赞或取消点赞
  if (reply.liked) {
    await DiscussionLikeApi.deleteDiscussionLike(undefined, reply.id)
  } else {
    await DiscussionLikeApi.createDiscussionLike(undefined, reply.id)
  }
  // 刷新回复列表
  await getReplyList()
}

/** 设置回复对象 */
function handleReply(reply: DiscussionReplyApi.OaDiscussionReplyVO, rootId: number) {
  handleCancelReply()
  replyRootId.value = rootId
  inlineContent.value = ''
  replyTarget.value = reply
}

/** 获得楼层内的回复，保持父子关系顺序 */
function getChildReplies(
  reply: DiscussionReplyApi.OaDiscussionReplyVO
): DiscussionReplyApi.OaDiscussionReplyVO[] {
  return (reply.children || []).flatMap((child) => [child, ...getChildReplies(child)])
}

/** 发表主回复或楼层内回复 */
async function submitReply(target?: DiscussionReplyApi.OaDiscussionReplyVO) {
  if (submitLoading.value) return
  submitLoading.value = true
  try {
    // 提交回复
    await DiscussionReplyApi.createDiscussionReply({
      discussionId: detail.value.id!,
      parentId: target?.id || 0,
      content: target ? inlineContent.value : replyContent.value
    })
    message.success('回复成功')
    // 清空对应输入框并刷新楼层
    if (target) {
      // 发表成功后展开所属楼层，便于查看刚提交的评论
      expandedReplies[replyRootId.value!] = true
      inlineContent.value = ''
      replyTarget.value = undefined
    } else {
      replyContent.value = ''
      replyVisible.value = false
      replyQueryParams.pageNo = 1
    }
    await getReplyList()
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

/** 删除回复及其子回复 */
async function handleDeleteReply(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    await DiscussionReplyApi.deleteDiscussionReply(id)
    message.success(t('common.delSuccess'))
    replyTarget.value = undefined
    await getReplyList()
    // 删除最后一层后返回上一页
    if (!replyList.value.length && replyQueryParams.pageNo > 1) {
      replyQueryParams.pageNo--
      await getReplyList()
    }
    emit('success')
  } catch {}
}

/** 初始化回复列表 */
onMounted(() => {
  replyQueryParams.discussionId = detail.value.id
  getReplyList()
})
</script>
