<template>
  <!-- 仅当该群有活跃通话时显示；点击胶囊条展开 popover 看在通话成员 + 加入 -->
  <div v-if="activeCall" class="flex-shrink-0 px-4 pb-2 bg-[var(--el-fill-color-light)]">
    <el-popover
      v-model:visible="popoverVisible"
      placement="bottom-start"
      :width="280"
      trigger="click"
    >
      <!-- 胶囊条本体：电话图标 + 文案（含人数）+ 右箭头 -->
      <template #reference>
        <div
          class="inline-flex gap-2 items-center px-2.5 py-1 text-13px rounded-full cursor-pointer select-none transition-colors duration-150 bg-[var(--el-color-success-light-9)] text-[var(--el-text-color-primary)] hover:bg-[var(--el-color-success-light-8)]"
        >
          <span
            class="inline-flex flex-shrink-0 justify-center items-center w-[18px] h-[18px] text-white rounded-full bg-[#07c160]"
          >
            <Icon icon="ant-design:phone-filled" :size="14" />
          </span>
          <span class="font-medium">{{ pillText }}</span>
          <Icon
            icon="ant-design:right-outlined"
            :size="12"
            class="text-[var(--el-text-color-secondary)]"
          />
        </div>
      </template>

      <!-- 展开面板：通话成员（含接入中）头像横排 + 加入按钮 -->
      <div class="flex flex-col gap-4 items-center pt-2 pb-1">
        <div class="flex flex-wrap gap-1.5 justify-center max-w-[240px]">
          <UserAvatar
            v-for="member in memberList"
            :key="member.userId"
            :url="member.avatar"
            :name="member.nickname"
            :size="40"
            radius="6px"
            :clickable="false"
            :class="{ 'opacity-50': member.pending }"
            :title="member.pending ? `${member.nickname}（接入中）` : member.nickname"
          />
          <!-- 首次填充时房内可能暂时 0 人；加入后由 ParticipantConnected 事件追加 -->
          <div
            v-if="memberList.length === 0"
            class="p-3 text-13px text-[var(--el-text-color-secondary)]"
          >
            暂无成员在通话
          </div>
        </div>
        <!-- 本端在通话内时置灰「已在通话中」；服务端残留我但本端连接断了显示「重新加入」（刷新页面后场景） -->
        <button
          class="w-[200px] h-9 text-sm font-medium rounded-lg cursor-pointer border-none bg-[#f1f1f3] text-[#1a1a1c] transition-colors duration-150 disabled:cursor-not-allowed disabled:text-[#999] hover:[&:not(:disabled)]:bg-[#e7e7ea]"
          :disabled="joinDisabled"
          @click="handleJoin"
        >
          {{ joinLabel }}
        </button>
      </div>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import UserAvatar from '../user/UserAvatar.vue'
import { useMessage } from '@/hooks/web/useMessage'
import { useRtcStore } from '../../store/rtcStore'
import { useGroupStore } from '../../store/groupStore'
import { useGroupCallMembers } from '../../composables/useGroupCallMembers'
import { joinCall, getActiveCall } from '@/api/im/rtc'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { getCurrentUserId } from '@/utils/auth'

const props = defineProps<{
  groupId: number
}>()

defineOptions({ name: 'ImRtcGroupCallBanner' })

const rtcStore = useRtcStore()
const groupStore = useGroupStore()
const message = useMessage()

const popoverVisible = ref(false)

/** 当前群的活跃通话；rtcStore 维护，参与者加入 / 离开通知增删 joinedUserIds，通话结束移除 */
const activeCall = computed(() => rtcStore.getGroupCall(props.groupId))

/** 胶囊条文案；有成员（已加入 + 接入中）则带人数，初始 0 人时只显示媒体类型 */
const pillText = computed(() => {
  const media = getDictLabel(DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE, activeCall.value?.mediaType)
  const count = memberList.value.length
  return count > 0 ? `正在${media}通话（${count} 人）` : `正在${media}通话`
})

/**
 * 切到群 / 通话 room 变化时拉一次最新参与者列表；
 * 两个触发场景：1）用户切群，本端可能没有该群通话的最新缓存；2）参与者通知首次填充后只含本次加入者，缺历史加入者；
 * 用 [groupId, room] 双源监听 + 已填充守卫，避免切群 / 首次填充触发的双次重复拉取
 */
watch(
  () =>
    [
      props.groupId,
      activeCall.value?.room,
      groupStore.isGroupActiveCallExpired(props.groupId)
    ] as const,
  async ([groupId, room], oldValues) => {
    if (!groupId) {
      return
    }

    if (!activeCall.value) {
      if (!groupStore.isGroupActiveCallExpired(groupId)) {
        return
      }
      try {
        const data = await getActiveCall(groupId)
        if (data) {
          rtcStore.setGroupCall(data, true)
        } else {
          rtcStore.removeGroupCall(groupId)
        }
      } catch (e) {
        console.warn('[GroupCallBanner] getActiveCall 失败', { groupId }, e)
      }
      return
    }

    // 决策是否需要拉取：补齐本地已有通话；没有本地通话时按群缓存过期状态懒探测一次
    const groupChanged = !oldValues || oldValues[0] !== groupId
    const roomChanged = oldValues && oldValues[1] !== room
    const participantsLoaded = (activeCall.value?.joinedUserIds?.length ?? 0) > 1
    const activeCallExpired = groupStore.isGroupActiveCallExpired(groupId)
    if (
      !activeCallExpired &&
      (rtcStore.isGroupCallParticipantsLoaded(groupId, room) ||
        (!groupChanged && !roomChanged && participantsLoaded))
    ) {
      return
    }

    // 拉最新参与者写回 store；接口返回空 → 该群已无活跃通话，移除本地缓存
    try {
      const data = await getActiveCall(groupId)
      if (data) {
        rtcStore.setGroupCall(data, true)
      } else {
        rtcStore.removeGroupCall(groupId)
      }
    } catch (e) {
      console.warn('[GroupCallBanner] getActiveCall 失败', { groupId }, e)
    }
  },
  { immediate: true }
)

/** 在通话中的成员（已加入）+ 接入中的成员（已邀请未接通） */
const memberList = useGroupCallMembers(computed(() => props.groupId))

/** 本端是否正在该房间通话（处于 INVITING / RUNNING） */
const isInThisCall = computed(
  () => rtcStore.isActive && rtcStore.call?.room === activeCall.value?.room
)

/**
 * 服务端是否记录我已加入；刷新后 LiveKit 连接已断但 webhook 还没把 status 标为 LEFT 时仍为 true；
 * 用于把按钮文案切到「重新加入」，但不 disable 按钮
 */
const serverSaysJoined = computed(() => {
  const myId = getCurrentUserId()
  return activeCall.value?.joinedUserIds?.includes(myId) ?? false
})

/** 加入按钮禁用：仅在本端实际持有 LiveKit 连接时禁用 */
const joinDisabled = computed(() => isInThisCall.value)

/** 加入按钮文案；本端连着 → 已在通话中；服务端还残留我但本端断了 → 重新加入；其它 → 加入 */
const joinLabel = computed(() => {
  if (isInThisCall.value) return '已在通话中'
  if (serverSaysJoined.value) return '重新加入'
  return '加入'
})

/** 主动加入：调 invite 命中已有 call 拿 token；rtcStore 按 status 自动进 RUNNING */
async function handleJoin() {
  const call = activeCall.value
  if (!call || joinDisabled.value) {
    return
  }
  if (rtcStore.isActive) {
    message.warning('您正在通话中')
    return
  }
  popoverVisible.value = false
  const data = await joinCall(call.room)
  rtcStore.startInviting(data)
}
</script>
