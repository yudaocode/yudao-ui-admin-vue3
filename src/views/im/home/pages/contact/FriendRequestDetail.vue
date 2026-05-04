<template>
  <!--
    新的朋友详情面板
    - 头像 + 昵称
    - 申请理由块
    - 来源行
    - 操作按钮：按「我发起 / 别人加我」 + 「未处理 / 同意 / 拒绝」状态切换
  -->
  <div class="flex flex-col items-center px-6 pt-12">
    <UserAvatar
      :id="peerUserId"
      :url="peerAvatar"
      :name="peerNickname"
      :size="64"
      :clickable="false"
    />
    <div class="mt-3 text-base font-semibold text-[var(--el-text-color-primary)]">
      {{ peerNickname }}
    </div>

    <!-- 申请理由块 -->
    <div
      v-if="request.applyContent"
      class="w-full max-w-[420px] mt-6 px-3.5 py-3 rounded-md bg-[var(--el-fill-color-light)] text-13px text-[var(--el-text-color-primary)]"
    >
      <span v-if="iSentIt">我:</span>
      <span class="ml-1">{{ request.applyContent }}</span>
    </div>
    <!-- 来源行 -->
    <div
      v-if="addSourceLabel"
      class="w-full max-w-[420px] mt-3 flex items-center text-13px text-[var(--el-text-color-secondary)]"
    >
      <span class="w-12 flex-shrink-0">来源</span>
      <span class="text-[var(--el-text-color-primary)]">{{ addSourceLabel }}</span>
    </div>
    <!-- 拒绝理由（拒绝状态展示）：长文本走 break-words 自动折行，避免横向溢出 -->
    <!-- TODO @AI：会折行，拒绝理由； -->
    <!-- TODO @AI：我指的是： -->
    <!-- TODO @AI：尽量对齐下微信的样式 /Users/yunai/Downloads/iShot_2026-05-04_10.42.58.png
/Users/yunai/Downloads/iShot_2026-05-04_10.42.46.png -->
    <div
      v-if="request.handleResult === ImFriendRequestHandleResult.REFUSED && request.handleContent"
      class="w-full max-w-[420px] mt-3 flex items-start text-13px text-[var(--el-text-color-secondary)]"
    >
      <span class="w-12 flex-shrink-0">拒绝理由</span>
      <span class="flex-1 min-w-0 break-words text-[var(--el-text-color-primary)]">
        {{ request.handleContent }}
      </span>
    </div>

    <!-- 操作按钮 -->
    <div class="w-full max-w-[420px] mt-8 flex justify-center">
      <!-- 我发起 + 等待中：禁用「等待对方验证」 -->
      <el-button
        v-if="iSentIt && request.handleResult === ImFriendRequestHandleResult.UNHANDLED"
        disabled
      >
        等待对方验证
      </el-button>
      <!-- 别人加我 + 等待中：同意 / 拒绝 -->
      <template v-if="!iSentIt && request.handleResult === ImFriendRequestHandleResult.UNHANDLED">
        <el-button @click="handleRefuse" :loading="refusing">拒绝</el-button>
        <el-button type="primary" @click="handleAgree" :loading="agreeing"> 同意 </el-button>
      </template>
      <!-- 已同意：发消息 -->
      <el-button
        v-if="request.handleResult === ImFriendRequestHandleResult.AGREED"
        type="primary"
        @click="emit('chat', peerUserId)"
      >
        发消息
      </el-button>
      <!-- 已拒绝：占位禁用按钮 -->
      <el-button v-if="request.handleResult === ImFriendRequestHandleResult.REFUSED" disabled>
        已拒绝
      </el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import { ElMessageBox } from 'element-plus'

import UserAvatar from '../../components/user/UserAvatar.vue'
import { useFriendStore } from '../../store/friendStore'
import { getCurrentUserId } from '../../../utils/storage'
import { ImFriendRequestHandleResult } from '../../../utils/constants'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import type { FriendRequest } from '../../types'

defineOptions({ name: 'ImContactFriendRequestDetail' })

const props = defineProps<{
  request: FriendRequest
}>()

const emit = defineEmits<{
  chat: [peerUserId: number]
}>()

const friendStore = useFriendStore()
const message = useMessage()

const currentUserId = Number(getCurrentUserId() || 0)

/** 是不是我发起的（fromUserId === me） */
const iSentIt = computed(() => props.request.fromUserId === currentUserId)

/** 对端的用户编号 / 昵称 / 头像 */
const peerUserId = computed(() =>
  iSentIt.value ? props.request.toUserId : props.request.fromUserId
)
const peerNickname = computed(() =>
  iSentIt.value
    ? props.request.toNickname || String(props.request.toUserId)
    : props.request.fromNickname || String(props.request.fromUserId)
)
const peerAvatar = computed(() =>
  iSentIt.value ? props.request.toAvatar : props.request.fromAvatar
)

/** 添加来源文案：走字典，对齐后端 ImFriendAddSourceEnum */
// TODO @AI：通过 html 里处理掉。不用抽个方法；
const addSourceLabel = computed(() =>
  props.request.addSource
    ? getDictLabel(DICT_TYPE.IM_FRIEND_ADD_SOURCE, props.request.addSource)
    : ''
)

const agreeing = ref(false)
const refusing = ref(false)

/** 同意申请 */
async function handleAgree() {
  agreeing.value = true
  try {
    await friendStore.agreeFriendRequest(props.request.id)
    message.success('已同意好友申请')
  } finally {
    agreeing.value = false
  }
}

/** 拒绝申请：弹 prompt 收集可选拒绝理由（点取消则中止），随后调 store 落库 + 提示 */
async function handleRefuse() {
  // 1. 弹 prompt 收集拒绝理由（最多 255 字）；用户点「取消」会 reject，中止后续流程
  let handleContent: string | undefined
  try {
    const result = await ElMessageBox.prompt('可填写拒绝理由（选填）', '拒绝好友申请', {
      confirmButtonText: '拒绝',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputValue: '',
      inputPlaceholder: '不填则不告知对方原因',
      inputValidator: (value: string) => (value || '').length <= 255 || '最多 255 个字符'
    })
    handleContent = (result as { value?: string }).value || undefined
  } catch {
    return
  }
  // 2. 调 store 拒绝申请；按钮 loading 期间不允许重复点击
  refusing.value = true
  try {
    await friendStore.refuseFriendRequest(props.request.id, handleContent)
    message.success('已拒绝好友申请')
  } finally {
    refusing.value = false
  }
}
</script>
