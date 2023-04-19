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
  <el-tabs type="border-card" v-model="objData.type" @tab-click="onTabClick">
    <!-- 类型 1：文本 -->
    <TabText v-model="objData.content" />
    <!-- 类型 2：图片 -->
    <TabImage v-model="objData" />
    <!-- 类型 3：语音 -->
    <TabVoice v-model="objData" />
    <!-- 类型 4：视频 -->
    <TabVideo v-model="objData" />
    <!-- 类型 5：图文 -->
    <TabNews v-model="objData" :news-type="newsType" />
    <!-- 类型 6：音乐 -->
    <TabMusic v-model="objData" />
  </el-tabs>
</template>

<script setup lang="ts" name="WxReplySelect">
import { ObjData, NewsType } from './components/types'
import TabText from './components/TabText.vue'
import TabImage from './components/TabImage.vue'
import TabVoice from './components/TabVoice.vue'
import TabVideo from './components/TabVideo.vue'
import TabNews from './components/TabNews.vue'
import TabMusic from './components/TabMusic.vue'

interface Props {
  objData: ObjData
  newsType?: NewsType
}
const props = withDefaults(defineProps<Props>(), {
  newsType: () => NewsType.Published
})

const objData = reactive(props.objData)
// TODO @Dhb52：Tab 切换的时候，应该表单还保留着；清除只有两个时机：1）发送成功后；2）关闭窗口后；我捉摸，是不是每个 TabXXX 组件，是个独立的 Form，然后有自己的对象，不粘在 objData 一起。这样最终就是 MusicMessageForm、ImageMessageForm
// const tempObj = new Map().set(objData.type, Object.assign({}, objData))

/** 切换消息类型的 tab */
const onTabClick = () => {
  clear()
}

/** 清除除了`type`的字段 */
const clear = () => {
  objData.content = ''
  objData.mediaId = ''
  objData.url = ''
  objData.title = ''
  objData.description = ''
  objData.articles = []
}

defineExpose({
  clear
})
</script>

<style lang="scss" scoped>
.select-item {
  width: 280px;
  padding: 10px;
  margin: 0 auto 10px auto;
  border: 1px solid #eaeaea;
}

.select-item2 {
  padding: 10px;
  margin: 0 auto 10px auto;
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
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.el-form-item__content {
  line-height: unset !important;
}

.col-select {
  border: 1px solid rgb(234, 234, 234);
  padding: 50px 0px;
  height: 160px;
  width: 49.5%;
}

.col-select2 {
  border: 1px solid rgb(234, 234, 234);
  padding: 50px 0px;
  height: 160px;
}

.col-add {
  border: 1px solid rgb(234, 234, 234);
  padding: 50px 0px;
  height: 160px;
  width: 49.5%;
  float: right;
}

.avatar-uploader-icon {
  border: 1px solid #d9d9d9;
  font-size: 28px;
  color: #8c939d;
  width: 100px !important;
  height: 100px !important;
  line-height: 100px !important;
  text-align: center;
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
