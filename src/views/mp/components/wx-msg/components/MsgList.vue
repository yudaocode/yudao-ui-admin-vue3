<template>
  <div class="execution" v-for="item in props.list" :key="item.id">
    <div
      class="avue-comment"
      :class="{ 'avue-comment--reverse': item.sendFrom === SendFrom.MpBot }"
    >
      <div class="avatar-div">
        <img :src="getAvatar(item.sendFrom)" class="avue-comment__avatar" />
        <div class="avue-comment__author">
          {{ getNickname(item.sendFrom) }}
        </div>
      </div>
      <div class="avue-comment__main">
        <div class="avue-comment__header">
          <div class="avue-comment__create_time">{{ formatDate(item.createTime) }}</div>
        </div>
        <div
          class="avue-comment__body"
          :style="item.sendFrom === SendFrom.MpBot ? 'background: #6BED72;' : ''"
        >
          <!-- 【事件】区域 TODO 芋艿：是不是把拆个 Message 出来，里面包括 MsgEvent + 各种其它消息，分开有点不够整体 -->
          <MsgEvent v-if="item.type === MsgType.Event" :item="item" />
          <!-- 【消息】区域 -->
          <div v-else-if="item.type === MsgType.Text">{{ item.content }}</div>
          <div v-else-if="item.type === MsgType.Voice">
            <WxVoicePlayer :url="item.mediaUrl" :content="item.recognition" />
          </div>
          <div v-else-if="item.type === MsgType.Image">
            <a target="_blank" :href="item.mediaUrl">
              <img :src="item.mediaUrl" style="width: 100px" />
            </a>
          </div>
          <div
            v-else-if="item.type === MsgType.Video || item.type === 'shortvideo'"
            style="text-align: center"
          >
            <WxVideoPlayer :url="item.mediaUrl" />
          </div>
          <div v-else-if="item.type === MsgType.Link" class="avue-card__detail">
            <el-link type="success" :underline="false" target="_blank" :href="item.url">
              <div class="avue-card__title"><i class="el-icon-link"></i>{{ item.title }}</div>
            </el-link>
            <div class="avue-card__info" style="height: unset">{{ item.description }}</div>
          </div>
          <!-- TODO 芋艿：待完善 -->
          <div v-else-if="item.type === MsgType.Location">
            <WxLocation
              :label="item.label"
              :location-y="item.locationY"
              :location-x="item.locationX"
            />
          </div>
          <div v-else-if="item.type === MsgType.News" style="width: 300px">
            <!-- TODO 芋艿：待测试；详情页也存在类似的情况 -->
            <WxNews :articles="item.articles" />
          </div>
          <div v-else-if="item.type === MsgType.Music">
            <WxMusic
              :title="item.title"
              :description="item.description"
              :thumb-media-url="item.thumbMediaUrl"
              :music-url="item.musicUrl"
              :hq-music-url="item.hqMusicUrl"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts" name="MsgList">
import WxVideoPlayer from '@/views/mp/components/wx-video-play'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play'
import WxNews from '@/views/mp/components/wx-news'
import WxLocation from '@/views/mp/components/wx-location'
import WxMusic from '@/views/mp/components/wx-music'
import MsgEvent from './MsgEvent.vue'
import { formatDate } from '@/utils/formatTime'
import { MsgType, User } from '../types'
import avatarWechat from '@/assets/imgs/wechat.png'

const props = defineProps<{
  list: any[]
  accountId: number
  user: User
}>()

enum SendFrom {
  User = 1,
  MpBot = 2
}

const getAvatar = (sendFrom: SendFrom) =>
  sendFrom === SendFrom.User ? props.user.avatar : avatarWechat

const getNickname = (sendFrom: SendFrom) =>
  sendFrom === SendFrom.User ? props.user.nickname : '公众号'
</script>

<style lang="scss" scoped>
/* 因为 joolun 实现依赖 avue 组件，该页面使用了 comment.scss、card.scc  */
@import '../comment.scss';
@import '../card.scss';

.avatar-div {
  text-align: center;
  width: 80px;
}
</style>
