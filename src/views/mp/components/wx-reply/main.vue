<!--
  - Copyright (C) 2018-2019
  - All rights reserved, Designed By www.joolun.com
  芋道源码：
  ① 移除多余的 rep 为前缀的变量，让 message 消息更简单
  ② 代码优化，补充注释，提升阅读性
  ③ 优化消息的临时缓存策略，发送消息时，只清理被发送消息的 tab，不会强制切回到 text 输入
  ④ 支持发送【视频】消息时，支持新建视频
-->
<template>
  <el-tabs type="border-card" v-model="currentTab">
    <!-- 类型 1：文本 -->
    <el-tab-pane :name="ReplyType.Text">
      <template #label>
        <el-row align="middle"><Icon icon="ep:document" /> 文本</el-row>
      </template>
      <TabText v-model="reply.content" />
    </el-tab-pane>

    <!-- 类型 2：图片 -->
    <el-tab-pane :name="ReplyType.Image">
      <template #label>
        <el-row align="middle"><Icon icon="ep:picture" class="mr-5px" /> 图片</el-row>
      </template>
      <TabImage v-model="reply" />
    </el-tab-pane>

    <!-- 类型 3：语音 -->
    <el-tab-pane :name="ReplyType.Voice">
      <template #label>
        <el-row align="middle"><Icon icon="ep:phone" /> 语音</el-row>
      </template>
      <TabVoice v-model="reply" />
    </el-tab-pane>

    <!-- 类型 4：视频 -->
    <el-tab-pane :name="ReplyType.Video">
      <template #label>
        <el-row align="middle"><Icon icon="ep:share" /> 视频</el-row>
      </template>
      <TabVideo v-model="reply" />
    </el-tab-pane>

    <!-- 类型 5：图文 -->
    <el-tab-pane :name="ReplyType.News">
      <template #label>
        <el-row align="middle"><Icon icon="ep:reading" /> 图文</el-row>
      </template>
      <TabNews v-model="reply" :news-type="newsType" />
    </el-tab-pane>

    <!-- 类型 6：音乐 -->
    <el-tab-pane :name="ReplyType.Music">
      <template #label>
        <el-row align="middle"><Icon icon="ep:service" />音乐</el-row>
      </template>
      <TabMusic v-model="reply" />
    </el-tab-pane>
  </el-tabs>
</template>

<script lang="ts" setup>
import { Reply, NewsType, ReplyType, createEmptyReply } from './components/types'
import TabText from './components/TabText.vue'
import TabImage from './components/TabImage.vue'
import TabVoice from './components/TabVoice.vue'
import TabVideo from './components/TabVideo.vue'
import TabNews from './components/TabNews.vue'
import TabMusic from './components/TabMusic.vue'

defineOptions({ name: 'WxReplySelect' })

interface Props {
  modelValue: Reply
  newsType?: NewsType
}
const props = withDefaults(defineProps<Props>(), {
  newsType: () => NewsType.Published
})
const emit = defineEmits<{
  (e: 'update:modelValue', v: Reply)
}>()

const reply = computed<Reply>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
// 作为多个标签保存各自Reply的缓存
const tabCache = new Map<ReplyType, Reply>()
// 采用独立的ref来保存当前tab，避免在watch标签变化，对reply进行赋值会产生了循环调用
const currentTab = ref<ReplyType>(props.modelValue.type || ReplyType.Text)

watch(
  currentTab,
  (newTab, oldTab) => {
    // 第一次进入：oldTab 为 undefined
    // 判断 newTab 是因为 Reply 为 Partial
    if (oldTab === undefined || newTab === undefined) {
      return
    }

    tabCache.set(oldTab, unref(reply))

    // 从缓存里面取出新tab内容，有则覆盖Reply，没有则创建空Reply
    const temp = tabCache.get(newTab)
    if (temp) {
      reply.value = temp
    } else {
      let newData = createEmptyReply(reply)
      newData.type = newTab
      reply.value = newData
    }
  },
  {
    immediate: true
  }
)

/** 清除除了`type`, `accountId`的字段 */
const clear = () => {
  reply.value = createEmptyReply(reply)
}

defineExpose({
  clear
})
</script>

<style lang="scss" scoped>
.select-item {
  width: 280px;
  padding: 10px;
  margin: 0 auto 10px;
  border: 1px solid #eaeaea;
}

.select-item2 {
  padding: 10px;
  margin: 0 auto 10px;
  border: 1px solid #eaeaea;
}

.ope-row {
  padding-top: 10px;
  text-align: center;
}

.input-margin-bottom {
  margin-bottom: 2%;
}

.item-name {
  overflow: hidden;
  font-size: 12px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.el-form-item__content {
  line-height: unset !important;
}

.col-select {
  width: 49.5%;
  height: 160px;
  padding: 50px 0;
  border: 1px solid rgb(234 234 234);
}

.col-select2 {
  height: 160px;
  padding: 50px 0;
  border: 1px solid rgb(234 234 234);
}

.col-add {
  float: right;
  width: 49.5%;
  height: 160px;
  padding: 50px 0;
  border: 1px solid rgb(234 234 234);
}

.avatar-uploader-icon {
  width: 100px !important;
  height: 100px !important;
  font-size: 28px;
  line-height: 100px !important;
  color: #8c939d;
  text-align: center;
  border: 1px solid #d9d9d9;
}

.material-img {
  width: 100%;
}

.thumb-div {
  display: inline-block;
  text-align: center;
}

.item-infos {
  width: 30%;
  margin: auto;
}
</style>
