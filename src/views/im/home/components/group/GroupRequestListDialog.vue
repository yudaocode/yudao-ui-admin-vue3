<template>
  <!--
    群「进群申请」列表对话框
    - 仅群主 / 管理员入口可达；展示当前群下全部申请（含已处理）
    - 顶部最新一条卡片化突出（带申请理由），其余按 id 倒序紧凑列表
    - 同意 / 拒绝走 groupRequestStore 的 action，处理后本地更新 handleResult 让按钮转灰态
  -->
  <el-dialog
    v-model="visible"
    title="进群申请"
    width="560px"
    :close-on-click-modal="false"
    class="im-group-request-list__dialog"
  >
    <div v-loading="loading" class="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
      <!-- 空态 -->
      <el-empty v-if="!loading && list.length === 0" description="暂无进群申请" />

      <!-- 顶部卡片：最新一条 -->
      <div
        v-if="latest"
        class="flex flex-col gap-2.5 p-3.5 rounded-[10px] border border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <div class="flex items-center gap-3">
          <UserAvatar
            :url="latest.userAvatar"
            :name="latest.userNickname"
            :size="44"
            :clickable="false"
          />
          <div class="flex-1 min-w-0">
            <div
              class="truncate text-sm font-medium leading-[1.4] text-[var(--el-text-color-primary)]"
            >
              {{ latest.userNickname || `用户 ${latest.userId}` }}
            </div>
            <div
              class="truncate mt-[2px] text-12px leading-[1.5] text-[var(--el-text-color-secondary)]"
            >
              <template v-if="latest.inviterUserId">
                通过
                <span class="text-[var(--el-color-primary)]">
                  {{ latest.inviterNickname || `用户 ${latest.inviterUserId}` }}
                </span>
                的邀请进群
              </template>
              <template v-else>申请加入</template>
            </div>
          </div>
          <span
            v-if="latest.handleResult === ImGroupRequestHandleResult.AGREED"
            class="flex-shrink-0 text-[13px] text-[var(--el-text-color-placeholder)]"
          >
            已同意
          </span>
          <span
            v-else-if="latest.handleResult === ImGroupRequestHandleResult.REFUSED"
            class="flex-shrink-0 text-[13px] text-[var(--el-text-color-placeholder)]"
          >
            已拒绝
          </span>
          <div v-else class="flex gap-1.5 flex-shrink-0">
            <button
              class="im-group-request-list__btn im-group-request-list__btn--primary"
              :disabled="actingId === latest.id"
              @click="handleAgree(latest)"
            >
              确认
            </button>
            <button
              class="im-group-request-list__btn im-group-request-list__btn--ghost"
              :disabled="actingId === latest.id"
              @click="handleRefuse(latest)"
            >
              拒绝
            </button>
          </div>
        </div>
        <!-- 申请理由：邀请场景显示邀请人 + 留言；主动申请显示申请人 + 留言 -->
        <div
          v-if="latest.applyContent"
          class="px-3 py-2 rounded-md text-[13px] leading-[1.5] break-all bg-[var(--el-fill-color-light)] text-[var(--el-text-color-regular)]"
        >
          <span class="text-[var(--el-color-primary)]">
            {{
              latest.inviterUserId
                ? latest.inviterNickname || `用户 ${latest.inviterUserId}`
                : latest.userNickname || `用户 ${latest.userId}`
            }}：
          </span>
          {{ latest.applyContent }}
        </div>
      </div>

      <!-- 分割线：仅在有更早申请时出现 -->
      <div
        v-if="histories.length > 0"
        class="flex items-center justify-center mt-1.5 -mb-0.5 text-12px text-[var(--el-text-color-placeholder)]"
      >
        <span>以下为更早的申请</span>
      </div>

      <!-- 历史申请列表 -->
      <div
        v-for="item in histories"
        :key="item.id"
        class="flex flex-col gap-2.5 px-3.5 py-2.5 rounded-[10px] border border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <div class="flex items-center gap-3">
          <UserAvatar
            :url="item.userAvatar"
            :name="item.userNickname"
            :size="40"
            :clickable="false"
          />
          <div class="flex-1 min-w-0">
            <div
              class="truncate text-sm font-medium leading-[1.4] text-[var(--el-text-color-primary)]"
            >
              {{ item.userNickname || `用户 ${item.userId}` }}
            </div>
            <div
              class="truncate mt-[2px] text-12px leading-[1.5] text-[var(--el-text-color-secondary)]"
            >
              <template v-if="item.inviterUserId">
                通过
                <span class="text-[var(--el-color-primary)]">
                  {{ item.inviterNickname || `用户 ${item.inviterUserId}` }}
                </span>
                的邀请进群
              </template>
              <template v-else>申请加入</template>
            </div>
          </div>
          <span
            v-if="item.handleResult === ImGroupRequestHandleResult.AGREED"
            class="flex-shrink-0 text-[13px] text-[var(--el-text-color-placeholder)]"
          >
            已同意
          </span>
          <span
            v-else-if="item.handleResult === ImGroupRequestHandleResult.REFUSED"
            class="flex-shrink-0 text-[13px] text-[var(--el-text-color-placeholder)]"
          >
            已拒绝
          </span>
          <div v-else class="flex gap-1.5 flex-shrink-0">
            <button
              class="im-group-request-list__btn im-group-request-list__btn--primary"
              :disabled="actingId === item.id"
              @click="handleAgree(item)"
            >
              确认
            </button>
            <button
              class="im-group-request-list__btn im-group-request-list__btn--ghost"
              :disabled="actingId === item.id"
              @click="handleRefuse(item)"
            >
              拒绝
            </button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'

import { getGroupRequestListByGroupId, type ImGroupRequestRespVO } from '@/api/im/group/request'
import { ImGroupRequestHandleResult } from '@/views/im/utils/constants'
import { useGroupRequestStore } from '../../store/groupRequestStore'
import UserAvatar from '../user/UserAvatar.vue'

defineOptions({ name: 'ImGroupRequestListDialog' })

const message = useMessage()
const groupRequestStore = useGroupRequestStore()

const visible = ref(false)
/** 当前展示的群编号；undefined 时走全局未处理列表（store.unhandledList） */
const groupId = ref<number | undefined>()
const loading = ref(false)
const groupList = ref<ImGroupRequestRespVO[]>([])
const actingId = ref<number | null>(null)

defineExpose({
  /** 打开进群申请弹窗：reset → 灌参 → visible=true；不传 groupId 走全局未处理列表 */
  open(opts?: { groupId?: number }) {
    groupId.value = opts?.groupId
    actingId.value = null
    visible.value = true
  }
})

/** 数据源：单群模式用 fetch 回来的 groupList；全局模式直接读 store.unhandledList，处理后 store 自动 reactive 同步 */
const list = computed<ImGroupRequestRespVO[]>(() =>
  groupId.value ? groupList.value : groupRequestStore.unhandledList
)

/** 顶部卡片：最新一条；空数组时为 null */
const latest = computed(() => list.value[0] || null)
/** 历史列表：除最新一条外的其余 */
const histories = computed(() => list.value.slice(1))

/** 打开 dialog 时拉数据：单群拉 API；全局直接读 store；关闭时清掉单群缓存 */
watch(
  [visible, groupId],
  ([isVisible, currentGroupId]) => {
    if (isVisible && currentGroupId) {
      void fetchList(currentGroupId)
    } else if (!isVisible) {
      groupList.value = []
    }
  },
  { immediate: true }
)

/**
 * 单群模式下订阅 store 中归属本群的未处理列表变化：远端事件（WS 1503 新申请 / 其他管理员处理）触发时 refetch
 * 拿最新 handleResult；本端 agree / refuse 期间 actingId 锁住，跳过本端动作引发的 store 变化避免冗余 RTT
 *
 * key 不能只 join id：复用旧记录时同一 requestId 的 applyContent / inviterUserId 会刷新但 id 不变，必须把内容字段也纳入触发
 */
watch(
  () =>
    groupId.value && visible.value
      ? groupRequestStore.unhandledList
          .filter((request) => request.groupId === groupId.value)
          .map(
            (request) =>
              `${request.id}:${request.inviterUserId ?? ''}:${request.applyContent ?? ''}`
          )
          .join(',')
      : null,
  (current, previous) => {
    if (current === null || previous === undefined || current === previous) {
      return
    }
    if (actingId.value !== null) {
      return
    }
    if (groupId.value) {
      void fetchList(groupId.value)
    }
  }
)

let fetchSeq = 0 // 单调递增请求序号；同群也会因为 WS 1503 推送触发额外 fetch，乱序返回时旧响应不能覆盖新数据
async function fetchList(targetGroupId: number) {
  const seq = ++fetchSeq
  loading.value = true
  try {
    const data = (await getGroupRequestListByGroupId(targetGroupId)) || []
    // 期间切群 / 关弹窗 / 又触发更新 fetch：丢响应
    if (seq !== fetchSeq || !visible.value || groupId.value !== targetGroupId) {
      return
    }
    groupList.value = data
  } finally {
    // 旧请求 finally 命中时新请求仍在跑，跳过避免提前关 loading
    if (seq === fetchSeq) {
      loading.value = false
    }
  }
}

/** 同意：走 store 同步全局未处理列表 + 本地更新 handleResult 让按钮变灰 */
async function handleAgree(item: ImGroupRequestRespVO) {
  if (actingId.value !== null) return
  actingId.value = item.id
  try {
    await groupRequestStore.agreeGroupRequest(item.id)
    updateLocalResult(item.id, ImGroupRequestHandleResult.AGREED)
    message.success('已同意')
  } finally {
    actingId.value = null
  }
}

/** 拒绝：弹理由输入框；为空则不带 handleContent */
async function handleRefuse(item: ImGroupRequestRespVO) {
  if (actingId.value !== null) return
  let handleContent = ''
  try {
    const result = await message.prompt('请输入拒绝理由（可选）', '拒绝申请')
    handleContent = result.value || ''
  } catch {
    return
  }
  actingId.value = item.id
  try {
    await groupRequestStore.refuseGroupRequest(item.id, handleContent || undefined)
    updateLocalResult(item.id, ImGroupRequestHandleResult.REFUSED)
    message.success('已拒绝')
  } finally {
    actingId.value = null
  }
}

/** 单群模式下处理后更新 groupList 里的 handleResult，按钮转「已同意 / 已拒绝」灰态；全局模式 store 直接移除该项无需更新 */
function updateLocalResult(id: number, handleResult: number) {
  const target = groupList.value.find((r) => r.id === id)
  if (target) {
    target.handleResult = handleResult
  }
}
</script>

<style scoped>
/* 自绘按钮：贴近微信小药丸样式；与 :disabled、:hover:not(:disabled) 等伪类叠加 modifier 类的组合选择器写在 class 里成本高，留 SCSS */
.im-group-request-list__btn {
  height: 28px;
  min-width: 56px;
  padding: 0 12px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 4px;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;
  flex-shrink: 0;
}

.im-group-request-list__btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.im-group-request-list__btn--primary {
  color: #fff;
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.im-group-request-list__btn--primary:hover:not(:disabled) {
  background-color: var(--el-color-primary-light-3);
  border-color: var(--el-color-primary-light-3);
}

.im-group-request-list__btn--ghost {
  color: var(--el-text-color-regular);
  background-color: var(--el-bg-color);
  border-color: var(--el-border-color);
}

.im-group-request-list__btn--ghost:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
</style>

<style>
/* el-dialog 内部 body 通过 teleport 渲染到 body，scoped 选不到，留非 scoped 全局覆盖 */
.im-group-request-list__dialog .el-dialog__body {
  padding: 12px 20px 8px;
  background-color: var(--el-fill-color-light);
}
</style>
