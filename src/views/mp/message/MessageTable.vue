<template>
  <div>
    <el-table v-loading="props.loading" :data="props.list">
      <el-table-column
        label="发送时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="消息类型" align="center" prop="type" width="80" />
      <el-table-column label="发送方" align="center" prop="sendFrom" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.sendFrom === 1" type="success">粉丝</el-tag>
          <el-tag v-else type="info">公众号</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="用户标识" align="center" prop="openid" width="300" />
      <el-table-column label="内容" prop="content">
        <template #default="scope">
          <!-- 【事件】区域 -->
          <div v-if="scope.row.type === MsgType.Event && scope.row.event === 'subscribe'">
            <el-tag type="success">关注</el-tag>
          </div>
          <div v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'unsubscribe'">
            <el-tag type="danger">取消关注</el-tag>
          </div>
          <div v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'CLICK'">
            <el-tag>点击菜单</el-tag>
            【{{ scope.row.eventKey }}】
          </div>
          <div v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'VIEW'">
            <el-tag>点击菜单链接</el-tag>
            【{{ scope.row.eventKey }}】
          </div>
          <div
            v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'scancode_waitmsg'"
          >
            <el-tag>扫码结果</el-tag>
            【{{ scope.row.eventKey }}】
          </div>
          <div v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'scancode_push'">
            <el-tag>扫码结果</el-tag>
            【{{ scope.row.eventKey }}】
          </div>
          <div v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'pic_sysphoto'">
            <el-tag>系统拍照发图</el-tag>
          </div>
          <div
            v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'pic_photo_or_album'"
          >
            <el-tag>拍照或者相册</el-tag>
          </div>
          <div v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'pic_weixin'">
            <el-tag>微信相册</el-tag>
          </div>
          <div
            v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'location_select'"
          >
            <el-tag>选择地理位置</el-tag>
          </div>
          <div v-else-if="scope.row.type === MsgType.Event">
            <el-tag type="danger">未知事件类型</el-tag>
          </div>
          <!-- 【消息】区域 -->
          <div v-else-if="scope.row.type === MsgType.Text">{{ scope.row.content }}</div>
          <div v-else-if="scope.row.type === MsgType.Voice">
            <wx-voice-player :url="scope.row.mediaUrl" :content="scope.row.recognition" />
          </div>
          <div v-else-if="scope.row.type === MsgType.Image">
            <a target="_blank" :href="scope.row.mediaUrl">
              <img :src="scope.row.mediaUrl" style="width: 100px" />
            </a>
          </div>
          <div v-else-if="scope.row.type === MsgType.Video || scope.row.type === 'shortvideo'">
            <wx-video-player :url="scope.row.mediaUrl" style="margin-top: 10px" />
          </div>
          <div v-else-if="scope.row.type === MsgType.Link">
            <el-tag>链接</el-tag>
            ：
            <a :href="scope.row.url" target="_blank">{{ scope.row.title }}</a>
          </div>
          <div v-else-if="scope.row.type === MsgType.Location">
            <WxLocation
              :label="scope.row.label"
              :location-y="scope.row.locationY"
              :location-x="scope.row.locationX"
            />
          </div>
          <div v-else-if="scope.row.type === MsgType.Music">
            <WxMusic
              :title="scope.row.title"
              :description="scope.row.description"
              :thumb-media-url="scope.row.thumbMediaUrl"
              :music-url="scope.row.musicUrl"
              :hq-music-url="scope.row.hqMusicUrl"
            />
          </div>
          <div v-else-if="scope.row.type === MsgType.News">
            <WxNews :articles="scope.row.articles" />
          </div>
          <div v-else>
            <el-tag type="danger">未知消息类型</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="emit('send', scope.row.userId)"
            v-hasPermi="['mp:message:send']"
          >
            消息
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页组件 -->
  </div>
</template>

<script lang="ts" setup>
import WxVideoPlayer from '@/views/mp/components/wx-video-play'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play'
import WxLocation from '@/views/mp/components/wx-location'
import WxMusic from '@/views/mp/components/wx-music'
import WxNews from '@/views/mp/components/wx-news'
import { dateFormatter } from '@/utils/formatTime'
import { MsgType } from '@/views/mp/components/wx-msg/types'

const props = defineProps({
  list: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits<{ (e: 'send', v: number) }>()
</script>
