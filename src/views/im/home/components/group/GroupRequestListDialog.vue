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
    <div v-loading="loading" class="im-group-request-list__body">
      <!-- 空态 -->
      <el-empty v-if="!loading && list.length === 0" description="暂无进群申请" />

      <!-- 顶部卡片：最新一条 -->
      <div v-if="latest" class="im-group-request-list__card">
        <div class="im-group-request-list__row">
          <UserAvatar
            :url="latest.userAvatar"
            :name="latest.userNickname"
            :size="44"
            :clickable="false"
          />
          <div class="im-group-request-list__main">
            <div class="im-group-request-list__name truncate">
              {{ latest.userNickname || `用户 ${latest.userId}` }}
            </div>
            <div class="im-group-request-list__source truncate">
              <template v-if="latest.inviterUserId">
                通过
                <span class="im-group-request-list__inviter">
                  {{ latest.inviterNickname || `用户 ${latest.inviterUserId}` }}
                </span>
                的邀请进群
              </template>
              <template v-else>申请加入</template>
            </div>
          </div>
          <span
            v-if="latest.handleResult === ImGroupRequestHandleResult.AGREED"
            class="im-group-request-list__done"
          >
            已同意
          </span>
          <span
            v-else-if="latest.handleResult === ImGroupRequestHandleResult.REFUSED"
            class="im-group-request-list__done"
          >
            已拒绝
          </span>
          <div v-else class="im-group-request-list__actions">
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
        <div v-if="latest.applyContent" class="im-group-request-list__quote">
          <span class="im-group-request-list__quote-name">
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
      <div v-if="histories.length > 0" class="im-group-request-list__divider">
        <span>以下为更早的申请</span>
      </div>

      <!-- 历史申请列表 -->
      <div
        v-for="item in histories"
        :key="item.id"
        class="im-group-request-list__card im-group-request-list__card--compact"
      >
        <div class="im-group-request-list__row">
          <UserAvatar
            :url="item.userAvatar"
            :name="item.userNickname"
            :size="40"
            :clickable="false"
          />
          <div class="im-group-request-list__main">
            <div class="im-group-request-list__name truncate">
              {{ item.userNickname || `用户 ${item.userId}` }}
            </div>
            <div class="im-group-request-list__source truncate">
              <template v-if="item.inviterUserId">
                通过
                <span class="im-group-request-list__inviter">
                  {{ item.inviterNickname || `用户 ${item.inviterUserId}` }}
                </span>
                的邀请进群
              </template>
              <template v-else>申请加入</template>
            </div>
          </div>
          <span
            v-if="item.handleResult === ImGroupRequestHandleResult.AGREED"
            class="im-group-request-list__done"
          >
            已同意
          </span>
          <span
            v-else-if="item.handleResult === ImGroupRequestHandleResult.REFUSED"
            class="im-group-request-list__done"
          >
            已拒绝
          </span>
          <div v-else class="im-group-request-list__actions">
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

const props = defineProps<{
  modelValue: boolean
  groupId?: number
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const message = useMessage()
const groupRequestStore = useGroupRequestStore()

const loading = ref(false)
const groupList = ref<ImGroupRequestRespVO[]>([])
const actingId = ref<number | null>(null)

/** 数据源：单群模式用 fetch 回来的 groupList；全局模式直接读 store.unhandledList，处理后 store 自动 reactive 同步 */
const list = computed<ImGroupRequestRespVO[]>(() =>
  props.groupId ? groupList.value : groupRequestStore.unhandledList
)

/** 顶部卡片：最新一条；空数组时为 null */
const latest = computed(() => list.value[0] || null)
/** 历史列表：除最新一条外的其余 */
const histories = computed(() => list.value.slice(1))

/** 打开 dialog 时拉数据：单群拉 API；全局直接读 store；关闭时清掉单群缓存 */
watch(
  () => [visible.value, props.groupId] as const,
  ([open, groupId]) => {
    if (open && groupId) {
      void fetchList(groupId)
    } else if (!open) {
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
    props.groupId && visible.value
      ? groupRequestStore.unhandledList
          .filter((request) => request.groupId === props.groupId)
          .map((request) => `${request.id}:${request.inviterUserId ?? ''}:${request.applyContent ?? ''}`)
          .join(',')
      : null,
  (current, previous) => {
    if (current === null || previous === undefined || current === previous) {
      return
    }
    if (actingId.value !== null) {
      return
    }
    if (props.groupId) {
      void fetchList(props.groupId)
    }
  }
)

async function fetchList(groupId: number) {
  loading.value = true
  try {
    groupList.value = (await getGroupRequestListByGroupId(groupId)) || []
  } finally {
    loading.value = false
  }
}

/** 同意：走 store 同步全局未处理列表 + 本地更新 handleResult 让按钮变灰 */
async function handleAgree(item: ImGroupRequestRespVO) {
  if (actingId.value !== null) return
  actingId.value = item.id
  try {
    await groupRequestStore.agreeRequest(item.id)
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
    await groupRequestStore.refuseRequest(item.id, handleContent || undefined)
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
.im-group-request-list__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}

.im-group-request-list__card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background-color: var(--el-bg-color);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--el-border-color-lighter);
}
.im-group-request-list__card--compact {
  padding: 10px 14px;
}

.im-group-request-list__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.im-group-request-list__main {
  flex: 1;
  min-width: 0;
}

.im-group-request-list__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.im-group-request-list__source {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.im-group-request-list__inviter {
  color: var(--el-color-primary);
}

.im-group-request-list__quote {
  padding: 8px 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  word-break: break-all;
}

.im-group-request-list__quote-name {
  color: var(--el-color-primary);
}

.im-group-request-list__divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 6px 0 -2px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.im-group-request-list__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* 自绘按钮：贴近微信小药丸样式；el-button 默认尺寸偏大、圆角偏方 */
.im-group-request-list__btn {
  flex-shrink: 0;
  min-width: 56px;
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;
}
.im-group-request-list__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.im-group-request-list__done {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}
</style>

<style>
.im-group-request-list__dialog .el-dialog__body {
  padding: 12px 20px 8px;
  background-color: var(--el-fill-color-light);
}
</style>
