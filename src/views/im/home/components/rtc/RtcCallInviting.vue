<template>
  <!-- 主叫等待对方接听的悬浮窗；1v1 私聊 320×540；群通话切大窗 720×560 -->
  <div
    class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.35)] z-[1000] flex flex-col text-white bg-gradient-to-b from-[#2a2a2c] to-[#1a1a1c]"
    :class="isGroup ? 'w-[720px] h-[560px]' : 'w-[320px] h-[540px]'"
  >
    <div class="flex relative flex-1 justify-center items-center">
      <!-- 视频呼叫：自己摄像头预览铺底，对方头像悬浮顶部 -->
      <video
        v-if="isVideo && localStream"
        :ref="localVideoRef"
        class="absolute inset-0 object-cover w-full h-full scale-x-[-1]"
        autoplay
        muted
        playsinline
      ></video>
      <div
        class="flex relative z-[1] flex-col gap-4 items-center"
        :class="{ 'self-start mt-16': isVideo }"
      >
        <UserAvatar
          :url="peerAvatar"
          :name="peerNickname"
          :size="96"
          radius="8px"
          :clickable="false"
        />
        <div class="text-[17px] font-medium">{{ peerNickname || '对方' }}</div>
        <div class="text-13px text-white/60">等待对方接受邀请……</div>
      </div>
    </div>

    <!-- 底部操作区：麦克风 / 取消 / (摄像头 | 扬声器) -->
    <div class="flex flex-shrink-0 gap-4 justify-around items-center pt-4 px-5 pb-5">
      <div
        class="flex flex-col gap-2 items-center cursor-pointer select-none"
        @click="$emit('toggle-mic')"
      >
        <!-- ant-design 系列里 mic 有 audio-muted-outlined 变体；speaker / camera 没有 muted 变体，off 态借 tabler:*-off 表达斜线 -->
        <span
          class="flex justify-center items-center w-12 h-12 rounded-full"
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
        class="flex flex-col gap-2 items-center cursor-pointer select-none"
        @click="$emit('cancel')"
      >
        <span
          class="flex justify-center items-center w-12 h-12 text-white rounded-full bg-[#f04a4a]"
        >
          <Icon icon="ant-design:phone-outlined" :size="22" class="rotate-[135deg]" />
        </span>
        <span class="text-xs text-white/70 whitespace-nowrap">取消</span>
      </div>
      <div
        v-if="isVideo"
        class="flex flex-col gap-2 items-center cursor-pointer select-none"
        @click="$emit('toggle-camera')"
      >
        <span
          class="flex justify-center items-center w-12 h-12 rounded-full"
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
      <div
        v-else
        class="flex flex-col gap-2 items-center cursor-pointer select-none"
        @click="$emit('toggle-speaker')"
      >
        <span
          class="flex justify-center items-center w-12 h-12 rounded-full"
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
    </div>
  </div>
</template>

<script lang="ts" setup>
import Icon from '@/components/Icon/src/Icon.vue'
import UserAvatar from '../user/UserAvatar.vue'
import { useMediaStreamElement } from '../../composables/useMediaStreamElement'

const props = defineProps<{
  peerNickname?: string
  peerAvatar?: string
  isGroup?: boolean
  isVideo: boolean
  micEnabled: boolean
  cameraEnabled: boolean
  speakerEnabled: boolean
  localStream?: MediaStream | null // 本地视频流；视频呼叫预览铺底
}>()

defineEmits<{
  cancel: []
  'toggle-mic': []
  'toggle-camera': []
  'toggle-speaker': []
}>()

const localVideoRef = useMediaStreamElement<HTMLVideoElement>(() => props.localStream)
</script>
