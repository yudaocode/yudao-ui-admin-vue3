<template>
  <div v-loading="loading">
    <template v-if="detail">
      <!-- 主题正文 -->
      <ContentWrap>
        <h1 class="mb-12px mt-0 break-words text-24px font-semibold leading-9">
          {{ detail.title }}
        </h1>
        <div
          class="flex flex-wrap items-center gap-12px text-13px text-[var(--el-text-color-secondary)]"
        >
          <el-avatar :size="36">{{ detail.userName?.slice(0, 1) }}</el-avatar>
          <span class="text-[var(--el-text-color-primary)]">{{ detail.userName }}</span>
          <span>{{ formatDate(detail.createTime) }}</span>
        </div>
        <el-divider class="!my-16px" />
        <div
          v-dompurify-html="detail.content || ''"
          class="oa-discussion-content break-words text-15px leading-7"
        >
        </div>
        <!-- 附件 -->
        <div
          v-if="detail.fileUrls?.length"
          class="mt-16px border-t border-[var(--el-border-color-lighter)] pt-12px"
        >
          <h3 class="mb-12px mt-0 text-14px font-medium">附件</h3>
          <el-link
            v-for="(url, index) in detail.fileUrls"
            :key="url"
            :href="url"
            target="_blank"
            class="mr-16px"
          >
            附件 {{ index + 1 }}
          </el-link>
        </div>
        <!-- 投票 -->
        <OaDiscussionVote
          v-if="detail.type === OA_DISCUSSION_TYPE.VOTE"
          :detail="detail"
          @success="getDetail()"
        />
        <!-- 点赞统计，名单按需展开 -->
        <div
          class="mt-16px flex flex-wrap items-center gap-8px border-t border-[var(--el-border-color-lighter)] pt-12px [&>.el-button]:!ml-0"
        >
          <el-button link type="primary" @click="replyRef?.focusReply()">
            <Icon icon="ep:chat-dot-round" :size="14" class="mr-4px" aria-hidden="true" /> 回复
          </el-button>
          <span class="inline-flex items-center text-13px text-[var(--el-text-color-secondary)]">
            <Icon icon="ep:view" :size="14" class="mr-4px" aria-hidden="true" />
            浏览（{{ detail.visitCount || 0 }}）
          </span>
          <span class="inline-flex items-center text-13px text-[var(--el-text-color-secondary)]">
            <Icon icon="ep:chat-dot-round" :size="14" class="mr-4px" aria-hidden="true" />
            回复（{{ detail.replyCount || 0 }}）
          </span>
          <el-button link type="primary" :loading="likeLoading" @click="handleDiscussionLike">
            <Icon
              :icon="detail.liked ? 'mdi:thumb-up' : 'mdi:thumb-up-outline'"
              :size="14"
              class="mr-4px"
              aria-hidden="true"
            />
            {{ detail.liked ? '取消点赞' : '点赞' }}（{{ detail.likeCount || 0 }}）
          </el-button>
        </div>
        <!-- 点赞人摘要 -->
        <div
          v-if="detail.likeUserNames?.length"
          class="mt-6px text-13px text-[var(--el-text-color-secondary)]"
        >
          {{ detail.likeUserNames.slice(0, 3).join('、') }}，
          <el-popover trigger="click" title="点赞人" :width="260">
            <template #reference>
              <el-button link>共 {{ detail.likeCount || 0 }} 人觉得很赞</el-button>
            </template>
            <div class="break-words leading-7">{{ detail.likeUserNames.join('、') }}</div>
          </el-popover>
        </div>
      </ContentWrap>
      <!-- 讨论楼层 -->
      <OaDiscussionReply ref="replyRef" :key="detail.id" :detail="detail" @success="getDetail()" />
    </template>
  </div>
</template>

<script setup lang="ts">
import * as DiscussionApi from '@/api/oa/discussion'
import * as DiscussionLikeApi from '@/api/oa/discussion/like'
import { formatDate } from '@/utils/formatTime'
import { OA_DISCUSSION_TYPE } from '@/views/oa/utils/constants'
import OaDiscussionReply from './OaDiscussionReply.vue'
import OaDiscussionVote from './OaDiscussionVote.vue'

defineOptions({ name: 'OaDiscussionDetail' })

const route = useRoute() // 当前路由
const loading = ref(false) // 详情加载中
const likeLoading = ref(false) // 点赞提交中
const detail = ref<DiscussionApi.OaDiscussionVO>() // 讨论详情
const replyRef = ref<InstanceType<typeof OaDiscussionReply>>() // 回复区域

/** 查询讨论详情，只有进入页面时记录访问 */
async function getDetail(visit = false) {
  detail.value = await DiscussionApi.getDiscussion(Number(route.params.id), visit)
}

/** 点赞或取消点赞 */
async function handleDiscussionLike() {
  if (!detail.value?.id || likeLoading.value) return
  likeLoading.value = true
  try {
    if (detail.value.liked) {
      await DiscussionLikeApi.deleteDiscussionLike(detail.value.id)
    } else {
      await DiscussionLikeApi.createDiscussionLike(detail.value.id)
    }
    await getDetail()
  } finally {
    likeLoading.value = false
  }
}

/** 初始化详情，兼容在不同讨论之间切换 */
watch(
  () => route.params.id,
  async (id) => {
    if (route.name !== 'OaDiscussionDetail' || !id) return
    detail.value = undefined
    loading.value = true
    try {
      await getDetail(true)
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.oa-discussion-content :deep(> :first-child) {
  margin-top: 0;
}
.oa-discussion-content :deep(> :last-child) {
  margin-bottom: 0;
}
.oa-discussion-content :deep(img) {
  max-width: 100%;
  height: auto;
}
.oa-discussion-content :deep(table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}
.oa-discussion-content :deep(pre) {
  overflow-x: auto;
}
</style>
