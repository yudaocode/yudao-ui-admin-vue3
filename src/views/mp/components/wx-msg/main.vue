<!--
  - Copyright (C) 2018-2019
  - All rights reserved, Designed By www.joolun.com
  芋道源码：
  ① 移除暂时用不到的 websocket
  ② 代码优化，补充注释，提升阅读性
-->
<template>
  <ContentWrap>
    <div class="msg-div" ref="msgDivRef">
      <!-- 加载更多 -->
      <div v-loading="loading"></div>
      <div v-if="!loading">
        <div class="el-table__empty-block" v-if="hasMore" @click="loadMore"
          ><span class="el-table__empty-text">点击加载更多</span></div
        >
        <div class="el-table__empty-block" v-if="!hasMore"
          ><span class="el-table__empty-text">没有更多了</span></div
        >
      </div>

      <!-- 消息列表 -->
      <MsgList :list="list" :account-id="accountId" :user="user" />
    </div>

    <div class="msg-send" v-loading="sendLoading">
      <WxReplySelect ref="replySelectRef" v-model="reply" />
      <el-button type="success" class="send-but" @click="sendMsg">发送(S)</el-button>
    </div>
  </ContentWrap>
</template>

<script lang="ts" setup>
import WxReplySelect, { Reply, ReplyType } from '@/views/mp/components/wx-reply'
import MsgList from './components/MsgList.vue'
import { getMessagePage, sendMessage } from '@/api/mp/message'
import { getUser } from '@/api/mp/user'
import profile from '@/assets/imgs/profile.jpg'
import { User } from './types'

defineOptions({ name: 'WxMsg' })

const message = useMessage() // 消息弹窗

const props = defineProps({
  userId: {
    type: Number,
    required: true
  }
})

const accountId = ref(-1) // 公众号ID，需要通过userId初始化
const loading = ref(false) // 消息列表是否正在加载中
const hasMore = ref(true) // 是否可以加载更多
const list = ref<any[]>([]) // 消息列表
const queryParams = reactive({
  pageNo: 1, // 当前页数
  pageSize: 14, // 每页显示多少条
  accountId: accountId
})

// 由于微信不再提供昵称，直接使用“用户”展示
const user: User = reactive({
  nickname: '用户',
  avatar: profile,
  accountId: accountId // 公众号账号编号
})

// ========= 消息发送 =========
const sendLoading = ref(false) // 发送消息是否加载中
// 微信发送消息
const reply = ref<Reply>({
  type: ReplyType.Text,
  accountId: -1,
  articles: []
})

const replySelectRef = ref<InstanceType<typeof WxReplySelect> | null>(null) // WxReplySelect组件ref，用于消息发送成功后清除内容
const msgDivRef = ref<HTMLDivElement | null>(null) // 消息显示窗口ref，用于滚动到底部

/** 完成加载 */
onMounted(async () => {
  const data = await getUser(props.userId)
  user.nickname = data.nickname?.length > 0 ? data.nickname : user.nickname
  user.avatar = user.avatar?.length > 0 ? data.avatar : user.avatar
  accountId.value = data.accountId
  reply.value.accountId = data.accountId

  refreshChange()
})

// 执行发送
const sendMsg = async () => {
  if (!unref(reply)) {
    return
  }
  // 公众号限制：客服消息，公众号只允许发送一条
  if (
    reply.value.type === ReplyType.News &&
    reply.value.articles &&
    reply.value.articles.length > 1
  ) {
    reply.value.articles = [reply.value.articles[0]]
    message.success('图文消息条数限制在 1 条以内，已默认发送第一条')
  }

  const data = await sendMessage({ userId: props.userId, ...reply.value })
  sendLoading.value = false

  list.value = [...list.value, ...[data]]
  await scrollToBottom()

  // 发送后清空数据
  replySelectRef.value?.clear()
}

const loadMore = () => {
  queryParams.pageNo++
  getPage(queryParams, null)
}

const getPage = async (page: any, params: any = null) => {
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

  const scrollHeight = msgDivRef.value?.scrollHeight ?? 0
  // 处理数据
  const data = dataTemp.list.reverse()
  list.value = [...data, ...list.value]
  loading.value = false
  if (data.length < queryParams.pageSize || data.length === 0) {
    hasMore.value = false
  }
  queryParams.pageNo = page.pageNo
  queryParams.pageSize = page.pageSize
  // 滚动到原来的位置
  if (queryParams.pageNo === 1) {
    // 定位到消息底部
    await scrollToBottom()
  } else if (data.length !== 0) {
    // 定位滚动条
    await nextTick()
    if (scrollHeight !== 0) {
      if (msgDivRef.value) {
        msgDivRef.value.scrollTop = msgDivRef.value.scrollHeight - scrollHeight - 100
      }
    }
  }
}

const refreshChange = () => {
  getPage(queryParams)
}

/** 定位到消息底部 */
const scrollToBottom = async () => {
  await nextTick()
  if (msgDivRef.value) {
    msgDivRef.value.scrollTop = msgDivRef.value.scrollHeight
  }
}
</script>

<style lang="scss" scoped>
.msg-div {
  height: 50vh;
  margin-right: 10px;
  margin-left: 10px;
  overflow: auto;
  background-color: #eaeaea;
}

.msg-send {
  padding: 10px;
}

.send-but {
  float: right;
  margin-top: 8px;
  margin-bottom: 8px;
}
</style>
