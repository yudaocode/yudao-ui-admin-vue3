<script setup lang="ts">
// 直接引用组件文件，避免与 VideoPlayer/index.ts 形成循环导入
import VideoPlayer from '@/components/VideoPlayer/src/VideoPlayer.vue'
import { ElOverlay } from 'element-plus'
import { ref, nextTick } from 'vue'
import { Icon } from '@/components/Icon'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  url: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: ''
  }
})

// 关闭后通知创建方卸载组件并移除容器，自身不直接操作 DOM
const emit = defineEmits<{
  close: []
}>()

const visible = ref(props.show)

// 幂等：背景、内层容器、关闭按钮可能先后触发，只处理第一次
const close = async () => {
  if (!visible.value) return
  visible.value = false
  await nextTick()
  emit('close')
}
</script>
<template>
  <ElOverlay v-show="visible" @click="close">
    <div class="w-full h-full flex justify-center items-center relative" @click="close">
      <div
        role="button"
        tabindex="0"
        title="关闭"
        aria-label="关闭"
        class="w-44px h-44px color-[#fff] bg-[var(--el-text-color-regular)] rounded-full border-[#fff] flex justify-center items-center cursor-pointer absolute top-40px right-40px"
        @click.stop="close"
        @keydown.enter.prevent="close"
        @keydown.space.prevent="close"
      >
        <Icon icon="ep:close" :size="24" />
      </div>
      <!-- 点击视频区域（播放、进度条等）不关闭弹层 -->
      <div @click.stop>
        <VideoPlayer :url="url" :poster="poster" />
      </div>
    </div>
  </ElOverlay>
</template>
