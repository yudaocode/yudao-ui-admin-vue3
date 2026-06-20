<template>
  <!--
    群通话宫格里的单个参与者格子；
    优先渲染远端视频（有 videoStream 时铺满），无视频降级渲染头像 + 名字胶囊；
    pending=true 时叠加「接入中」三点动画占位，用于被邀请人未接通前的占位渲染；
    远端音频通过隐藏 audio 播放（本端 isLocal 不渲染避免回声）
  -->
  <div
    class="flex relative overflow-hidden justify-center items-center w-full h-full rounded-md bg-[#2a2a2c]"
  >
    <!-- 视频可用：渲染 video；否则渲染头像或默认占位 -->
    <video
      v-if="participant.videoStream"
      :ref="videoRef"
      class="object-cover w-full h-full"
      autoplay
      playsinline
      :muted="participant.isLocal"
    ></video>
    <div v-else class="flex justify-center items-center w-full h-full">
      <UserAvatar
        :url="participant.avatar"
        :name="participant.nickname"
        :size="64"
        radius="50%"
        :clickable="false"
      />
    </div>

    <!-- 远端音频；通过 audio 元素播放，本端静音避免回声；扬声器关闭时整体静音 -->
    <audio
      v-if="participant.audioStream && !participant.isLocal"
      :ref="audioRef"
      autoplay
      :muted="!speakerEnabled"
    ></audio>

    <!-- 左下角名字胶囊 -->
    <div
      class="flex absolute bottom-3 left-3 gap-1.5 items-center py-[3px] pr-2.5 pl-[3px] text-13px text-white rounded-full bg-black/45 max-w-[calc(100%-60px)]"
    >
      <UserAvatar
        :url="participant.avatar"
        :name="participant.nickname"
        :size="22"
        radius="50%"
        :clickable="false"
      />
      <span class="truncate min-w-0">{{ participant.nickname }}</span>
    </div>

    <!-- 等待对方加入：三点动画 +「接入中」文案；位置在格子中心下方 60px -->
    <div
      v-if="participant.pending"
      class="flex absolute left-1/2 flex-col gap-1.5 items-center -translate-x-1/2 -translate-y-1/2 top-[calc(50%+60px)]"
    >
      <div class="flex gap-1.5">
        <span
          v-for="i in 3"
          :key="i"
          class="tile-dot w-1.5 h-1.5 rounded-full bg-white/60"
          :style="{ animationDelay: `${(i - 1) * 0.2}s` }"
        ></span>
      </div>
      <span class="text-xs text-white/70">接入中</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import UserAvatar from '../user/UserAvatar.vue'
import { useMediaStreamElement } from '../../composables/useMediaStreamElement'

export interface CallParticipantVM {
  userId: number
  nickname: string
  avatar?: string
  isLocal: boolean
  videoStream?: MediaStream | null
  audioStream?: MediaStream | null
  /** 等待加入；UI 显示三点动画 */
  pending?: boolean
}

const props = defineProps<{
  participant: CallParticipantVM
  /** 扬声器开关；为 false 时静音该格子的远端音频 */
  speakerEnabled: boolean
}>()

const videoRef = useMediaStreamElement<HTMLVideoElement>(() => props.participant.videoStream)
const audioRef = useMediaStreamElement<HTMLAudioElement>(() => props.participant.audioStream)
</script>

<style scoped>
/* 三点淡入淡出动画；@keyframes 必须 CSS 定义 */
.tile-dot {
  animation: tile-dot 1.4s infinite ease-in-out both;
}

@keyframes tile-dot {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }

  40% {
    opacity: 1;
  }
}
</style>
