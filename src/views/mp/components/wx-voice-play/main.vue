<!--
  - Copyright (C) 2018-2019
  - All rights reserved, Designed By www.joolun.com
  【微信消息 - 语音】
   芋道源码：
  ① bug 修复：
    1）joolun 的做法：使用 mediaId 从微信公众号，下载对应的 mp4 素材，从而播放内容；
      存在的问题：mediaId 有效期是 3 天，超过时间后无法播放
    2）重构后的做法：后端接收到微信公众号的视频消息后，将视频消息的 media_id 的文件内容保存到文件服务器中，这样前端可以直接使用 URL 播放。
  ② 代码优化：将 props 中的 reply 调成为 data 中对应的属性，并补充相关注释
-->
<template>
  <div class="wx-voice-div" @click="playVoice">
    <el-icon>
      <Icon v-if="playing !== true" icon="ep:video-play" :size="32" />
      <Icon v-else icon="ep:video-pause" :size="32" />
      <span class="amr-duration" v-if="duration">{{ duration }} 秒</span>
    </el-icon>
    <div v-if="content">
      <el-tag type="success" size="small">语音识别</el-tag>
      {{ content }}
    </div>
  </div>
</template>

<script lang="ts" setup>
// 因为微信语音是 amr 格式，所以需要用到 amr 解码器：https://www.npmjs.com/package/benz-amr-recorder
import BenzAMRRecorder from 'benz-amr-recorder'

defineOptions({ name: 'WxVoicePlayer' })

const props = defineProps({
  url: {
    type: String, // 语音地址，例如说：https://www.iocoder.cn/xxx.amr
    required: true
  },
  content: {
    type: String, // 语音文本
    required: false
  }
})

const amr = ref()
const playing = ref(false)
const duration = ref()

/** 处理点击，播放或暂停 */
const playVoice = () => {
  // 情况一：未初始化，则创建 BenzAMRRecorder
  if (amr.value === undefined) {
    amrInit()
    return
  }
  // 情况二：已经初始化，则根据情况播放或暂时
  if (amr.value.isPlaying()) {
    amrStop()
  } else {
    amrPlay()
  }
}

/** 音频初始化 */
const amrInit = () => {
  amr.value = new BenzAMRRecorder()
  // 设置播放
  amr.value.initWithUrl(props.url).then(function () {
    amrPlay()
    duration.value = amr.value.getDuration()
  })
  // 监听暂停
  amr.value.onEnded(function () {
    playing.value = false
  })
}

/** 音频播放 */
const amrPlay = () => {
  playing.value = true
  amr.value.play()
}

/** 音频暂停 */
const amrStop = () => {
  playing.value = false
  amr.value.stop()
}
// TODO 芋艿：下面样式有点问题
</script>
<style lang="scss" scoped>
.wx-voice-div {
  display: flex;
  width: 120px;
  height: 50px;
  padding: 5px;
  background-color: #eaeaea;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
}

.amr-duration {
  margin-left: 5px;
  font-size: 11px;
}
</style>
