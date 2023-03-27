<!--
  - Copyright (C) 2018-2019
  - All rights reserved, Designed By www.joolun.com
  【微信消息 - 视频】
  芋道源码：
  ① bug 修复：
    1）joolun 的做法：使用 mediaId 从微信公众号，下载对应的 mp4 素材，从而播放内容；
      存在的问题：mediaId 有效期是 3 天，超过时间后无法播放
    2）重构后的做法：后端接收到微信公众号的视频消息后，将视频消息的 media_id 的文件内容保存到文件服务器中，这样前端可以直接使用 URL 播放。
  ② 体验优化：弹窗关闭后，自动暂停视频的播放
-->
<template>
  <div>
    <!-- 提示 -->
    <div @click="playVideo()">
      <el-icon>
        <VideoPlay />
      </el-icon>
      <p>点击播放视频</p>
    </div>

    <!-- 弹窗播放 -->
    <el-dialog
      title="视频播放"
      v-model:visible="dialogVideo"
      width="40%"
      append-to-body
      @close="closeDialog"
    >
      <video-player
        v-if="playerOptions.sources[0].src"
        class="video-player vjs-custom-skin"
        ref="videoPlayerRef"
        :playsinline="true"
        :options="playerOptions"
        @play="onPlayerPlay($event)"
        @pause="onPlayerPause($event)"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="WxVideoPlayer">
// 引入 videoPlayer 相关组件。教程：https://juejin.cn/post/6923056942281654285
import { videoPlayer } from 'vue-video-player'
import 'video.js/dist/video-js.css'
import 'vue-video-player/src/custom-theme.css'
import { VideoPlay } from '@element-plus/icons-vue'

const props = defineProps({
  url: {
    // 视频地址，例如说：https://www.iocoder.cn/xxx.mp4
    type: String,
    required: true
  }
})
const videoPlayerRef = ref()
const dialogVideo = ref(false)
const playerOptions = reactive({
  playbackRates: [0.5, 1.0, 1.5, 2.0], // 播放速度
  autoplay: false, // 如果 true,浏览器准备好时开始回放。
  muted: false, // 默认情况下将会消除任何音频。
  loop: false, // 导致视频一结束就重新开始。
  preload: 'auto', // 建议浏览器在 <video> 加载元素后是否应该开始下载视频数据。auto 浏览器选择最佳行为,立即开始加载视频（如果浏览器支持）
  language: 'zh-CN',
  aspectRatio: '16:9', // 将播放器置于流畅模式，并在计算播放器的动态大小时使用该值。值应该代表一个比例 - 用冒号分隔的两个数字（例如"16:9"或"4:3"）
  fluid: true, // 当true时，Video.js player 将拥有流体大小。换句话说，它将按比例缩放以适应其容器。
  sources: [
    {
      type: 'video/mp4',
      src: '' // 你的视频地址（必填）【重要】
    }
  ],
  poster: '', // 你的封面地址
  width: document.documentElement.clientWidth,
  notSupportedMessage: '此视频暂无法播放，请稍后再试', //允许覆盖 Video.js 无法播放媒体源时显示的默认信息。
  controlBar: {
    timeDivider: true,
    durationDisplay: true,
    remainingTimeDisplay: false,
    fullscreenToggle: true //全屏按钮
  }
})

const playVideo = () => {
  dialogVideo.value = true
  playerOptions.sources[0].src = props.url
}
const closeDialog = () => {
  // 暂停播放
  // videoPlayerRef.player.pause()
}
//   onPlayerPlay(player) {},
//   // // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
//   onPlayerPause(player) {}

// methods: {
//   playVideo() {
//     this.dialogVideo = true
//     // 设置地址
//     this.playerOptions.sources[0]['src'] = this.url
//   },
//   closeDialog() {
//     // 暂停播放
//     this.$refs.videoPlayer.player.pause()
//   },
//
//   //todo player组件引入可能有问题
//
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
//   onPlayerPlay(player) {},
//   // // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
//   onPlayerPause(player) {}
// }
</script>
