<template>
  <!--
    添加好友对话框（双层流程）
    - 第一层 search：按昵称搜索用户列表
    - 第二层 apply：选中用户后展开「申请添加朋友」表单（申请理由 + 备注）
  -->
  <el-dialog v-model="visible" :title="dialogTitle" width="480px" :close-on-click-modal="false">
    <!-- 第一层：搜索 + 用户列表 -->
    <template v-if="step === 'search'">
      <el-input
        v-model="keyword"
        placeholder="输入昵称回车搜索（最多展示 20 条）"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #suffix>
          <Icon icon="ant-design:search-outlined" class="cursor-pointer" @click="handleSearch" />
        </template>
      </el-input>

      <el-scrollbar v-loading="loading" class="h-[400px] mt-2.5">
        <div
          v-if="visibleUsers.length === 0"
          class="py-10 text-13px text-center text-[var(--el-text-color-disabled)]"
        >
          {{ searched ? '没有搜到用户' : '输入关键字后回车开始搜索' }}
        </div>
        <div
          v-for="user in visibleUsers"
          :key="user.id"
          class="flex gap-3 items-center px-2 py-2.5 border-b border-b-solid border-[var(--el-border-color-lighter)]"
        >
          <UserAvatar
            :id="user.id"
            :url="user.avatar"
            :name="user.nickname"
            :size="42"
            :clickable="false"
          />
          <div class="flex-1 min-w-0 overflow-hidden">
            <!-- 昵称 + 性别图标 -->
            <div
              class="flex items-center gap-1 text-sm font-semibold text-[var(--el-text-color-primary)]"
            >
              <span class="truncate">{{ user.nickname }}</span>
              <Icon
                v-if="getGenderIcon(user.sex)"
                :icon="getGenderIcon(user.sex)"
                :size="14"
                :color="getGenderColor(user.sex)"
                class="flex-shrink-0"
              />
            </div>
            <!-- 部门 -->
            <div
              v-if="user.deptName"
              class="mt-0.5 text-xs truncate text-[var(--el-text-color-secondary)]"
            >
              {{ user.deptName }}
            </div>
          </div>
          <!-- 已是好友显示「已添加」；否则显示「添加」（点击进入 apply 步骤） -->
          <el-button
            v-if="!friendStore.isActiveFriend(user.id)"
            type="primary"
            size="small"
            @click="enterApply(user)"
          >
            添加
          </el-button>
          <el-button v-else size="small" disabled>已添加</el-button>
        </div>
      </el-scrollbar>
    </template>

    <!-- 第二层：申请表单（对齐微信「申请添加朋友」） -->
    <template v-if="step === 'apply' && targetUser">
      <!-- 选中的用户卡片 -->
      <div
        class="flex gap-3 items-center px-2 py-3 mb-4 rounded-md bg-[var(--el-fill-color-light)]"
      >
        <UserAvatar
          :id="targetUser.id"
          :url="targetUser.avatar"
          :name="targetUser.nickname"
          :size="42"
          :clickable="false"
        />
        <div class="flex-1 min-w-0 overflow-hidden">
          <div class="text-sm font-semibold text-[var(--el-text-color-primary)] truncate">
            {{ targetUser.nickname }}
          </div>
          <div
            v-if="targetUser.deptName"
            class="mt-0.5 text-xs truncate text-[var(--el-text-color-secondary)]"
          >
            {{ targetUser.deptName }}
          </div>
        </div>
      </div>

      <div class="text-13px text-[var(--el-text-color-secondary)] mb-1.5">发送添加朋友申请</div>
      <el-input
        v-model="applyContent"
        type="textarea"
        :rows="3"
        :maxlength="255"
        show-word-limit
        placeholder="请填写申请理由"
      />

      <div class="text-13px text-[var(--el-text-color-secondary)] mt-3 mb-1.5">备注</div>
      <el-input
        v-model="displayName"
        :maxlength="16"
        placeholder="给对方起个备注（仅自己可见，可不填）"
      />
    </template>

    <!-- 仅在 apply 步骤显示 footer 操作按钮（slot 必须是 el-dialog 直接子节点） -->
    <template v-if="step === 'apply'" #footer>
      <!-- 预填模式无搜索步骤，「取消」直接关闭弹窗 -->
      <el-button @click="presetMode ? (visible = false) : backToSearch()">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmitApply"> 确定 </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'
import { useUserStore } from '@/store/modules/user'

import UserAvatar from '../user/UserAvatar.vue'
import { useFriendStore } from '../../store/friendStore'
import { getCurrentUserId } from '@/utils/auth'
import { ImFriendAddSource } from '../../../utils/constants'
import { getGenderColor, getGenderIcon } from '../../../utils/user'
import { getSimpleUserListByNickname, type UserVO } from '@/api/system/user'

defineOptions({ name: 'ImFriendAddDialog' })

const visible = ref(false)
/** 预填目标用户：非 null 时跳过搜索步骤，直接进入申请表单（群成员加好友 / 名片加好友等场景） */
const presetUser = ref<UserVO | null>(null)
/** 添加来源；参见 ImFriendAddSourceEnum，默认 SEARCH */
const addSource = ref<number>(ImFriendAddSource.SEARCH)
/** 来源附带信息：addSource=ImFriendAddSource.GROUP 时传群名，话术拼为「我是 XX 群的 YY」 */
const addSourceExtra = ref<string>('')

defineExpose({
  /** 打开加好友弹窗：reset → 灌参 → visible=true；不传 opts 走搜索模式 */
  open(opts?: { presetUser?: UserVO | null; addSource?: number; addSourceExtra?: string }) {
    presetUser.value = opts?.presetUser ?? null
    addSource.value = opts?.addSource ?? ImFriendAddSource.SEARCH
    addSourceExtra.value = opts?.addSourceExtra ?? ''
    resetAll()
    visible.value = true
  }
})

const friendStore = useFriendStore()
const userStore = useUserStore()
const message = useMessage()

/** 当前登录用户编号；用 computed 包一层，切账号后随 wsCache 重取，避免顶层求值在 keep-alive 实例里持有旧 id */
const currentUserId = computed(() => getCurrentUserId())

/** 搜索结果过滤掉自己；用 v-if 而非 v-show，避免 DOM 占位 + 头像无效请求 */
const visibleUsers = computed(() => users.value.filter((user) => user.id !== currentUserId.value))
const keyword = ref('')
const users = ref<UserVO[]>([])
const searched = ref(false)
const loading = ref(false)

/** 当前步骤：search=搜索列表；apply=申请表单 */
const step = ref<'search' | 'apply'>('search')
/** 申请目标用户 */
const targetUser = ref<UserVO | null>(null)
/** 申请理由（默认填「我是 ${当前昵称}」，对齐微信交互） */
const applyContent = ref('')
/** 对接收方的备注（仅自己可见） */
const displayName = ref('')
const submitting = ref(false)

/** 弹窗标题随步骤切换 */
const dialogTitle = computed(() => (step.value === 'apply' ? '申请添加朋友' : '添加好友'))

/** 是否预填模式（presetUser 不为空 → 跳过搜索，关闭即销毁，无「取消返回搜索」按钮） */
const presetMode = computed(() => !!presetUser.value)

function resetAll() {
  keyword.value = ''
  users.value = []
  searched.value = false
  // 预填模式：直接进申请表单，targetUser 取自 presetUser；申请理由按 addSource 区分话术
  if (presetUser.value) {
    targetUser.value = presetUser.value
    applyContent.value = buildPresetApplyContent()
    displayName.value = ''
    step.value = 'apply'
    return
  }
  // 非预填模式：默认进搜索步骤
  step.value = 'search'
  targetUser.value = null
  applyContent.value = ''
  displayName.value = ''
}

/** 预填模式下的申请理由话术：群聊「我是"XX 群"的 YY」；其它「我是 YY」 */
function buildPresetApplyContent(): string {
  const myNickname = userStore.getUser?.nickname || ''
  if (!myNickname) {
    return ''
  }
  // 群聊场景拼带群名的话术；其它场景默认「我是 YY」
  const groupExtra = addSource.value === ImFriendAddSource.GROUP ? addSourceExtra.value : ''
  return groupExtra ? `我是"${groupExtra}"的${myNickname}` : `我是${myNickname}`
}

/** 按昵称搜索用户：空关键字直接清空结果 */
async function handleSearch() {
  searched.value = true
  if (!keyword.value.trim()) {
    users.value = []
    return
  }
  loading.value = true
  try {
    users.value = (await getSimpleUserListByNickname(keyword.value.trim())) || []
  } finally {
    loading.value = false
  }
}

/** 进入申请步骤：预填申请理由「我是 ${当前用户昵称}」（对齐微信交互） */
function enterApply(user: UserVO) {
  targetUser.value = user
  const myNickname = userStore.getUser?.nickname || ''
  applyContent.value = myNickname ? `我是${myNickname}` : ''
  displayName.value = ''
  step.value = 'apply'
}

/** 取消申请，回到搜索步骤 */
function backToSearch() {
  step.value = 'search'
  targetUser.value = null
}

/** 提交好友申请：返回 requestId 走「等待验证」；返回 null 表示后端命中「单向好友静默重启」分支，已直接成为好友 */
async function handleSubmitApply() {
  if (!targetUser.value) {
    return
  }
  // 预校验：不能加自己（搜索列表已过滤，这里兜底 presetUser / 名片入口等场景）
  if (targetUser.value.id === currentUserId.value) {
    message.warning('不能添加自己为好友')
    return
  }
  submitting.value = true
  try {
    const requestId = await friendStore.applyFriendRequest({
      toUserId: targetUser.value.id,
      applyContent: applyContent.value.trim() || undefined,
      displayName: displayName.value.trim() || undefined,
      addSource: addSource.value
    })
    // silent 分支（已是单向好友被静默重启）：主动 fetchFriendInfo 入库，不依赖 WS FRIEND_ADD 推送，避免丢推时列表看不到
    if (requestId === null) {
      await friendStore.fetchFriendInfo(targetUser.value.id)
    }
    message.success(requestId ? '申请已发送，等待对方验证' : '已添加为好友')
    visible.value = false
  } catch {
    // 业务错误（已是好友 / 被对方拉黑 / 用户被禁用 等）：全局拦截器已弹错误提示，本地关弹窗避免脏状态停留
    visible.value = false
  } finally {
    submitting.value = false
  }
}
</script>
