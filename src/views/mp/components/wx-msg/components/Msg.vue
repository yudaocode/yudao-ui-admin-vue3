<template>
  <div>
    <MsgEvent v-if="item.type === MsgType.Event" :item="item" />

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

    <div v-else-if="item.type === MsgType.Location">
      <WxLocation :label="item.label" :location-y="item.locationY" :location-x="item.locationX" />
    </div>

    <div v-else-if="item.type === MsgType.News" style="width: 300px">
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
</template>

<script lang="ts" setup>
import WxVideoPlayer from '@/views/mp/components/wx-video-play'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play'
import WxNews from '@/views/mp/components/wx-news'
import WxLocation from '@/views/mp/components/wx-location'
import WxMusic from '@/views/mp/components/wx-music'
import MsgEvent from './MsgEvent.vue'
import { MsgType } from '../types'

defineOptions({ name: 'Msg' })

const props = defineProps<{
  item: any
}>()

const item = ref<any>(props.item)
</script>

<style scoped></style>
