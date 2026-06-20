<template>
  <!-- 通话进行中的悬浮窗；1v1 私聊 320×540；群通话切大窗 720×560 -->
  <div
    class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.35)] z-[1000] flex flex-col text-white bg-[#1a1a1c]"
    :class="isGroup ? 'w-[720px] h-[560px]' : 'w-[320px] h-[540px]'"
  >
    <!-- 重连中横幅；网络抖动时显示，直到 Reconnected 事件清除 -->
    <div
      v-if="reconnecting"
      class="inline-flex absolute top-3 left-1/2 z-10 gap-2 items-center px-3.5 py-1.5 text-13px text-[#ffd45e] rounded-full -translate-x-1/2 bg-[rgba(255,196,0,0.18)]"
    >
      <span class="reconnect-dot w-2 h-2 rounded-full bg-[#ffd45e]"></span>
      网络不佳，正在重连……
    </div>
    <div class="flex relative flex-1 justify-center items-center">
      <!-- 群通话：网格布局，列数随人数自适应 -->
      <div
        v-if="isGroup"
        class="grid gap-1 p-1 w-full h-full content-stretch"
        :class="gridColsClass"
      >
        <RtcCallParticipantTile
          v-for="participant in participants"
          :key="participant.userId"
          :participant="participant"
          :speaker-enabled="speakerEnabled"
        />
      </div>

      <!-- 1v1 视频：远端铺底 + 本地缩略 -->
      <template v-else-if="isVideo">
        <div v-show="hasRemoteVideo" class="absolute inset-0">
          <video
            :ref="remoteVideoRef"
            class="object-cover w-full h-full"
            autoplay
            playsinline
          ></video>
        </div>
        <div v-if="!hasRemoteVideo" class="flex z-[1] flex-col gap-4 items-center">
          <UserAvatar
            :url="peerAvatar"
            :name="peerNickname"
            :size="96"
            radius="8px"
            :clickable="false"
          />
          <div class="text-[17px] font-medium">{{ peerNickname }}</div>
          <div class="text-13px text-white/60">等待对方开启摄像头……</div>
        </div>
        <div
          v-if="localStream"
          class="absolute top-4 right-4 z-[2] overflow-hidden w-30 rounded-lg aspect-[9/16] bg-[#333]"
        >
          <video
            :ref="localVideoRef"
            class="object-cover w-full h-full scale-x-[-1]"
            autoplay
            muted
            playsinline
          ></video>
        </div>
      </template>

      <!-- 1v1 语音：头像 + 时长 -->
      <template v-else>
        <div class="flex z-[1] flex-col gap-4 items-center">
          <UserAvatar
            :url="peerAvatar"
            :name="peerNickname"
            :size="96"
            radius="8px"
            :clickable="false"
          />
          <div class="text-[17px] font-medium">{{ peerNickname }}</div>
          <div class="text-13px text-white/60">{{ formattedDuration }}</div>
        </div>
      </template>
      <audio
        v-if="!isGroup && remoteAudioStream"
        :ref="remoteAudioRef"
        autoplay
        :muted="!speakerEnabled"
      ></audio>
    </div>

    <!-- 底部操作区：麦克风 / 扬声器 / 摄像头 / (群聊：共享屏幕 / 添加成员) / 挂断 -->
    <div class="flex flex-shrink-0 gap-3 justify-around items-center pt-4 px-4 pb-5 bg-black/20">
      <div
        class="flex flex-col gap-2 items-center cursor-pointer select-none min-w-[64px]"
        @click="$emit('toggle-mic')"
      >
        <span
          class="flex justify-center items-center w-[52px] h-[52px] rounded-full"
          :class="micEnabled ? 'bg-white text-[#1a1a1c]' : 'bg-white/15 text-white'"
        >
          <Icon
            :icon="micEnabled ? 'ant-design:audio-outlined' : 'ant-design:audio-muted-outlined'"
            :size="22"
          />
        </span>
        <span class="text-xs text-white/70 whitespace-nowrap">
          {{ micEnabled ? '麦克风已开' : '麦克风已关' }}
        </span>
      </div>
      <div
        class="flex flex-col gap-2 items-center cursor-pointer select-none min-w-[64px]"
        @click="$emit('toggle-speaker')"
      >
        <span
          class="flex justify-center items-center w-[52px] h-[52px] rounded-full"
          :class="speakerEnabled ? 'bg-white text-[#1a1a1c]' : 'bg-white/15 text-white'"
        >
          <Icon
            :icon="speakerEnabled ? 'ant-design:sound-outlined' : 'tabler:volume-off'"
            :size="22"
          />
        </span>
        <span class="text-xs text-white/70 whitespace-nowrap">
          {{ speakerEnabled ? '扬声器已开' : '扬声器已关' }}
        </span>
      </div>
      <!-- 摄像头按钮：私聊视频固定显示；群聊不论起始 mediaType 都显示，让用户按需开 -->
      <div
        v-if="isVideo || isGroup"
        class="flex flex-col gap-2 items-center cursor-pointer select-none min-w-[64px]"
        @click="$emit('toggle-camera')"
      >
        <span
          class="flex justify-center items-center w-[52px] h-[52px] rounded-full"
          :class="cameraEnabled ? 'bg-white text-[#1a1a1c]' : 'bg-white/15 text-white'"
        >
          <Icon
            :icon="cameraEnabled ? 'ant-design:video-camera-outlined' : 'tabler:video-off'"
            :size="22"
          />
        </span>
        <span class="text-xs text-white/70 whitespace-nowrap">
          {{ cameraEnabled ? '摄像头已开' : '摄像头已关' }}
        </span>
      </div>
      <!-- 群通话才有：共享屏幕 / 添加成员；共享中按钮高亮 + 文案换成「停止共享」 -->
      <template v-if="isGroup">
        <div
          class="flex flex-col gap-2 items-center cursor-pointer select-none min-w-[64px]"
          @click="$emit('toggle-screen-share')"
        >
          <span
            class="flex justify-center items-center w-[52px] h-[52px] rounded-full"
            :class="screenShareEnabled ? 'bg-[#07c160] text-white' : 'bg-white/15 text-white'"
          >
            <Icon
              :icon="screenShareEnabled ? 'ant-design:laptop-outlined' : 'tabler:device-laptop-off'"
              :size="22"
            />
          </span>
          <span class="text-xs text-white/70 whitespace-nowrap">
            {{ screenShareEnabled ? '停止共享' : '共享屏幕' }}
          </span>
        </div>
        <div
          class="flex flex-col gap-2 items-center cursor-pointer select-none min-w-[64px]"
          @click="$emit('add-member')"
        >
          <span
            class="flex justify-center items-center w-[52px] h-[52px] text-white rounded-full bg-white/15"
          >
            <Icon icon="ant-design:plus-outlined" :size="22" />
          </span>
          <span class="text-xs text-white/70 whitespace-nowrap">添加成员</span>
        </div>
      </template>
      <div
        class="flex flex-col gap-2 items-center cursor-pointer select-none min-w-[64px]"
        :class="{ 'opacity-60 pointer-events-none': hangingUp }"
        @click="$emit('hangup')"
      >
        <span
          class="flex justify-center items-center w-[52px] h-[52px] text-white rounded-full bg-[#f04a4a]"
        >
          <Icon icon="ant-design:phone-outlined" :size="22" class="rotate-[135deg]" />
        </span>
        <span class="text-xs text-white/70 whitespace-nowrap">挂断</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import UserAvatar from '../user/UserAvatar.vue'
import RtcCallParticipantTile, { type CallParticipantVM } from './RtcCallParticipantTile.vue'
import { formatCallDuration } from '@/views/im/utils/time'
import { useMediaStreamElement } from '../../composables/useMediaStreamElement'

const props = defineProps<{
  /** 是否群通话；决定网格 / 单点布局 + 浮窗大小 */
  isGroup: boolean
  isVideo: boolean
  micEnabled: boolean
  cameraEnabled: boolean
  /** 扬声器开关；true 时正常播放远端音频，false 时所有远端 audio 元素静音 */
  speakerEnabled: boolean
  /** 是否正在屏幕共享；按钮高亮 + 文案切换 */
  screenShareEnabled?: boolean
  /** 是否处于网络重连中；显示顶部黄色提示条 */
  reconnecting?: boolean
  startedAt: number
  /** 网格视图用：所有参与者（含自己） */
  participants: CallParticipantVM[]
  /** 1v1 视图用 */
  peerNickname?: string
  peerAvatar?: string
  localStream?: MediaStream | null
  remoteVideoStream?: MediaStream | null
  remoteAudioStream?: MediaStream | null
  hangingUp?: boolean
}>()

defineEmits<{
  hangup: []
  'toggle-mic': []
  'toggle-camera': []
  'toggle-speaker': []
  'toggle-screen-share': []
  'add-member': []
}>()

/** 网格列数；按人数自适应；返回 UnoCSS class 字面量让 JIT 扫描器静态识别 */
const gridColsClass = computed(() => {
  const n = props.participants.length
  if (n <= 1) return 'grid-cols-1'
  if (n <= 4) return 'grid-cols-2'
  return 'grid-cols-3'
})

const localVideoRef = useMediaStreamElement<HTMLVideoElement>(() => props.localStream)
const remoteVideoRef = useMediaStreamElement<HTMLVideoElement>(() => props.remoteVideoStream)
const remoteAudioRef = useMediaStreamElement<HTMLAudioElement>(() => props.remoteAudioStream)

/** 1v1 视频：是否有远端视频流 */
const hasRemoteVideo = computed(() => !props.isGroup && !!props.remoteVideoStream)

/** 通话时长；仅 1v1 语音视图需要展示，其它视图不启 tick */
const now = ref(Date.now())
let tick = 0
watch(
  () => props.isGroup || props.isVideo,
  (suppressTick) => {
    if (suppressTick) {
      if (tick) {
        clearInterval(tick)
        tick = 0
      }
      return
    }
    now.value = Date.now()
    tick = window.setInterval(() => {
      now.value = Date.now()
    }, 1000)
  },
  { immediate: true }
)
onUnmounted(() => {
  if (tick) {
    clearInterval(tick)
  }
})

/** 通话时长 MM:SS / HH:MM:SS */
const formattedDuration = computed(() =>
  formatCallDuration(Math.floor((now.value - props.startedAt) / 1000))
)
</script>

<style scoped>
/* 重连小点淡入淡出；@keyframes 必须 CSS 定义 */
.reconnect-dot {
  animation: reconnect-pulse 1s ease-in-out infinite;
}

@keyframes reconnect-pulse {
  0%,
  100% {
    opacity: 0.3;
  }

  50% {
    opacity: 1;
  }
}
</style>
