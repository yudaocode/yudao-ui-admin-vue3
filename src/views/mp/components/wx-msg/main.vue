<!--
  - Copyright (C) 2018-2019
  - All rights reserved, Designed By www.joolun.com
  芋道源码：
  ① 移除暂时用不到的 websocket
  ② 代码优化，补充注释，提升阅读性
-->
<template>
  <ContentWrap>
    <div class="msg-div" :id="'msg-div' + nowStr">
      <!-- 加载更多 -->
      <div v-loading="loading"></div>
      <div v-if="!loading">
        <div class="el-table__empty-block" v-if="loadMore" @click="loadingMore"
          ><span class="el-table__empty-text">点击加载更多</span></div
        >
        <div class="el-table__empty-block" v-if="!loadMore"
          ><span class="el-table__empty-text">没有更多了</span></div
        >
      </div>
      <!-- 消息列表 -->
      <div class="execution" v-for="item in list" :key="item.id">
        <div class="avue-comment" :class="item.sendFrom === 2 ? 'avue-comment--reverse' : ''">
          <div class="avatar-div">
            <img
              :src="item.sendFrom === 1 ? user.avatar : mp.avatar"
              class="avue-comment__avatar"
            />
            <div class="avue-comment__author"
              >{{ item.sendFrom === 1 ? user.nickname : mp.nickname }}
            </div>
          </div>
          <div class="avue-comment__main">
            <div class="avue-comment__header">
              <div class="avue-comment__create_time">{{ formatDate(item.createTime) }}</div>
            </div>
            <div
              class="avue-comment__body"
              :style="item.sendFrom === 2 ? 'background: #6BED72;' : ''"
            >
              <!-- 【事件】区域 -->
              <div v-if="item.type === MsgType.Event && item.event === 'subscribe'">
                <el-tag type="success">关注</el-tag>
              </div>
              <div v-else-if="item.type === MsgType.Event && item.event === 'unsubscribe'">
                <el-tag type="danger">取消关注</el-tag>
              </div>
              <div v-else-if="item.type === MsgType.Event && item.event === 'CLICK'">
                <el-tag>点击菜单</el-tag>
                【{{ item.eventKey }}】
              </div>
              <div v-else-if="item.type === MsgType.Event && item.event === 'VIEW'">
                <el-tag>点击菜单链接</el-tag>
                【{{ item.eventKey }}】
              </div>
              <div v-else-if="item.type === MsgType.Event && item.event === 'scancode_waitmsg'">
                <el-tag>扫码结果</el-tag>
                【{{ item.eventKey }}】
              </div>
              <div v-else-if="item.type === MsgType.Event && item.event === 'scancode_push'">
                <el-tag>扫码结果</el-tag>
                【{{ item.eventKey }}】
              </div>
              <div v-else-if="item.type === MsgType.Event && item.event === 'pic_sysphoto'">
                <el-tag>系统拍照发图</el-tag>
              </div>
              <div v-else-if="item.type === MsgType.Event && item.event === 'pic_photo_or_album'">
                <el-tag>拍照或者相册</el-tag>
              </div>
              <div v-else-if="item.type === MsgType.Event && item.event === 'pic_weixin'">
                <el-tag>微信相册</el-tag>
              </div>
              <div v-else-if="item.type === MsgType.Event && item.event === 'location_select'">
                <el-tag>选择地理位置</el-tag>
              </div>
              <div v-else-if="item.type === MsgType.Event">
                <el-tag type="danger">未知事件类型</el-tag>
              </div>
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
    </div>
    <div class="msg-send" v-loading="sendLoading">
      <WxReplySelect ref="replySelectRef" :objData="objData" />
      <el-button type="success" class="send-but" @click="sendMsg">发送(S)</el-button>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts" name="WxMsg">
import WxReplySelect from '@/views/mp/components/wx-reply/main.vue'
import WxVideoPlayer from '@/views/mp/components/wx-video-play/main.vue'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play/main.vue'
import WxNews from '@/views/mp/components/wx-news/main.vue'
import WxLocation from '@/views/mp/components/wx-location/main.vue'
import WxMusic from '@/views/mp/components/wx-music/main.vue'
import { getMessagePage, sendMessage } from '@/api/mp/message'
import { getUser } from '@/api/mp/user'
import { formatDate } from '@/utils/formatTime'
import profile from '@/assets/imgs/profile.jpg'
import wechat from '@/assets/imgs/wechat.png'
import { MsgType } from './types'

const message = useMessage() // 消息弹窗

const props = defineProps({
  userId: {
    type: Number,
    required: true
  }
})

const nowStr = ref(new Date().getTime()) // 当前的时间戳，用于每次消息加载后，回到原位置；具体见 :id="'msg-div' + nowStr" 处
const loading = ref(false) // 消息列表是否正在加载中
const loadMore = ref(true) // 是否可以加载更多
const list = ref<any[]>([]) // 消息列表
const queryParams = reactive({
  pageNo: 1, // 当前页数
  pageSize: 14, // 每页显示多少条
  accountId: undefined
})

interface User {
  nickname: string
  avatar: string
  accountId: number
}
// 由于微信不再提供昵称，直接使用“用户”展示
const user: User = reactive({
  nickname: '用户',
  avatar: profile,
  accountId: 0 // 公众号账号编号
})

interface Mp {
  nickname: string
  avatar: string
}
const mp: Mp = reactive({
  nickname: '公众号',
  avatar: wechat
})

// ========= 消息发送 =========
const sendLoading = ref(false) // 发送消息是否加载中
interface ObjData {
  type: MsgType
  accountId: number | null
  articles: any[]
}

// 微信发送消息
const objData: ObjData = reactive({
  type: MsgType.Text,
  accountId: null,
  articles: []
})

const replySelectRef = ref<InstanceType<typeof WxReplySelect> | null>(null)

/** 完成加载 */
onMounted(async () => {
  const data = await getUser(props.userId)
  user.nickname = data.nickname?.length > 0 ? data.nickname : user.nickname
  user.avatar = user.avatar?.length > 0 ? data.avatar : user.avatar
  user.accountId = data.accountId
  queryParams.accountId = data.accountId
  objData.accountId = data.accountId

  refreshChange()
})

// 执行发送
const sendMsg = async () => {
  if (!objData) {
    return
  }
  // 公众号限制：客服消息，公众号只允许发送一条
  if (objData.type === MsgType.News && objData.articles.length > 1) {
    objData.articles = [objData.articles[0]]
    message.success('图文消息条数限制在 1 条以内，已默认发送第一条')
  }

  const data = await sendMessage(Object.assign({ userId: props.userId }, { ...objData }))
  sendLoading.value = false

  list.value = [...list.value, ...[data]]
  scrollToBottom()

  // 发送后清空数据
  replySelectRef.value?.clear()
}

const loadingMore = () => {
  queryParams.pageNo++
  getPage(queryParams, null)
}

const getPage = async (page, params) => {
  loading.value = true
  let dataTemp = await getMessagePage(
    Object.assign(
      {
        pageNo: page.pageNo,
        pageSize: page.pageSize,
        userId: props.userId,
        accountId: page.accountId
      },
      params
    )
  )

  const msgDiv = document.getElementById('msg-div' + nowStr.value)
  let scrollHeight = 0
  if (msgDiv) {
    scrollHeight = msgDiv.scrollHeight
  }
  // 处理数据
  const data = dataTemp.list.reverse()
  list.value = [...data, ...list.value]
  loading.value = false
  if (data.length < queryParams.pageSize || data.length === 0) {
    loadMore.value = false
  }
  queryParams.pageNo = page.pageNo
  queryParams.pageSize = page.pageSize
  // 滚动到原来的位置
  if (queryParams.pageNo === 1) {
    // 定位到消息底部
    scrollToBottom()
  } else if (data.length !== 0) {
    // 定位滚动条
    await nextTick(() => {
      if (scrollHeight !== 0) {
        let div = document.getElementById('msg-div' + nowStr.value)
        if (div && msgDiv) {
          msgDiv.scrollTop = div.scrollHeight - scrollHeight - 100
        }
      }
    })
  }
}

const refreshChange = () => {
  getPage(queryParams, null)
}

/** 定位到消息底部 */
const scrollToBottom = () => {
  nextTick(() => {
    let div = document.getElementById('msg-div' + nowStr.value)
    if (div) {
      div.scrollTop = div.scrollHeight
    }
  })
}
</script>

<style lang="scss" scoped>
/* 因为 joolun 实现依赖 avue 组件，该页面使用了 comment.scss、card.scc  */
@import './comment.scss';
@import './card.scss';

.msg-main {
  margin-top: -30px;
  padding: 10px;
}

.msg-div {
  height: 50vh;
  overflow: auto;
  background-color: #eaeaea;
  margin-left: 10px;
  margin-right: 10px;
}

.msg-send {
  padding: 10px;
}

.avatar-div {
  text-align: center;
  width: 80px;
}

.send-but {
  float: right;
  margin-top: 8px;
  margin-bottom: 8px;
}
</style>
