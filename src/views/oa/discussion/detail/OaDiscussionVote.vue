<template>
  <el-card shadow="never" class="my-16px">
    <template #header>
      <div class="flex items-center justify-between">
        <span>投票（{{ getDiscussionVoteModeName(detail.voteMultiple) }}）</span>
        <el-tag :type="voteStatusTagType">{{ voteStatusText }}</el-tag>
      </div>
    </template>
    <div class="mb-12px text-13px text-[var(--el-text-color-secondary)]">
      {{ formatDate(detail.voteStartTime) }} 至 {{ formatDate(detail.voteEndTime) }}
    </div>
    <el-checkbox-group v-if="detail.voteMultiple" v-model="selectedOptionIds">
      <div v-for="option in detail.voteOptions" :key="option.id" class="mb-14px">
        <el-checkbox :value="option.id" :disabled="voteStatus !== 'ongoing' || !!option.voted">
          {{ option.title }}（{{ option.voteCount || 0 }} 票）
        </el-checkbox>
        <el-progress
          :percentage="getVotePercentage(option)"
          :color="option.color || undefined"
          :stroke-width="8"
        />
        <el-popover
          v-if="option.voterUserNames?.length"
          trigger="click"
          title="投票人"
          :width="240"
        >
          <template #reference><el-button link type="primary">查看投票人</el-button></template>
          <div class="break-words">{{ option.voterUserNames.join('、') }}</div>
        </el-popover>
      </div>
    </el-checkbox-group>
    <el-radio-group v-else v-model="selectedOptionId" class="!block">
      <div v-for="option in detail.voteOptions" :key="option.id" class="mb-14px">
        <el-radio :value="option.id" :disabled="voteDisabled">
          {{ option.title }}（{{ option.voteCount || 0 }} 票）
        </el-radio>
        <el-progress
          :percentage="getVotePercentage(option)"
          :color="option.color || undefined"
          :stroke-width="8"
        />
        <el-popover
          v-if="option.voterUserNames?.length"
          trigger="click"
          title="投票人"
          :width="240"
        >
          <template #reference><el-button link type="primary">查看投票人</el-button></template>
          <div class="break-words">{{ option.voterUserNames.join('、') }}</div>
        </el-popover>
      </div>
    </el-radio-group>
    <el-button v-if="!voteDisabled" type="primary" :loading="submitLoading" @click="submitVote">
      提交投票
    </el-button>
    <el-tag v-else-if="hasVoted" type="success">已投票</el-tag>
  </el-card>
</template>
<script setup lang="ts">
import * as DiscussionApi from '@/api/oa/discussion'
import * as DiscussionVoteApi from '@/api/oa/discussion/vote'
import { formatDate } from '@/utils/formatTime'
import { getDiscussionVoteModeName } from '@/views/oa/utils/format'

defineOptions({ name: 'OaDiscussionVote' })

const props = defineProps<{ detail: DiscussionApi.OaDiscussionVO }>()
const detail = toRef(props, 'detail') // 讨论详情
const emit = defineEmits<{ success: [] }>() // 投票成功
const message = useMessage() // 消息提示
const selectedOptionIds = ref<number[]>([]) // 多选选项
const selectedOptionId = ref<number>() // 单选选项
const submitLoading = ref(false) // 投票提交中
const hasVoted = computed(() => detail.value?.voteOptions?.some((item) => item.voted) || false) // 是否已投票
const votedOptionIds = computed(
  () => detail.value?.voteOptions?.filter((item) => item.voted).map((item) => item.id!) || []
) // 已投票选项编号
const voteStatus = computed<string>(() => {
  const now = Date.now()
  const startTime = new Date(detail.value?.voteStartTime || 0).getTime()
  const endTime = new Date(detail.value?.voteEndTime || 0).getTime()
  if (now < startTime) {
    return 'notStarted'
  }
  return now > endTime ? 'ended' : 'ongoing'
}) // 投票状态
const voteStatusText = computed(() =>
  voteStatus.value === 'notStarted' ? '未开始' : voteStatus.value === 'ended' ? '已结束' : '进行中'
) // 投票状态文本
const voteStatusTagType = computed(() =>
  voteStatus.value === 'ongoing' ? 'success' : voteStatus.value === 'ended' ? 'info' : 'warning'
) // 投票状态标签类型
const voteDisabled = computed(() => {
  if (voteStatus.value !== 'ongoing') {
    return true
  }
  return detail.value.voteMultiple
    ? votedOptionIds.value.length >= (detail.value.voteOptions?.length || 0)
    : hasVoted.value
}) // 是否禁止投票
const voteCount = computed(() =>
  (detail.value?.voteOptions || []).reduce((total, item) => total + (item.voteCount || 0), 0)
) // 投票总票数

/** 获得投票选项百分比 */
function getVotePercentage(option: DiscussionVoteApi.OaVoteOptionVO) {
  return voteCount.value > 0 ? Math.round(((option.voteCount || 0) / voteCount.value) * 100) : 0
}

/** 提交投票 */
async function submitVote() {
  if (!detail.value?.id || submitLoading.value) return
  // 校验投票选项
  const optionIds = detail.value.voteMultiple
    ? selectedOptionIds.value.filter((optionId) => !votedOptionIds.value.includes(optionId))
    : selectedOptionId.value
      ? [selectedOptionId.value]
      : []
  if (optionIds.length === 0) {
    message.warning('请选择投票选项')
    return
  }
  // 提交投票
  submitLoading.value = true
  try {
    await DiscussionVoteApi.voteDiscussion(detail.value.id, optionIds)
    message.success('投票成功')
    // 刷新投票结果
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

/** 回显已提交的选项 */
watch(
  () => props.detail,
  (discussion) => {
    selectedOptionIds.value =
      discussion.voteOptions?.filter((item) => item.voted).map((item) => item.id!) || []
    selectedOptionId.value = selectedOptionIds.value[0]
  },
  { immediate: true }
)
</script>
