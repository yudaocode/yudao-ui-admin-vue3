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
          <Msg :item="item" />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import Msg from './Msg.vue'
import { formatDate } from '@/utils/formatTime'
import { User } from '../types'
import avatarWechat from '@/assets/imgs/wechat.png'

defineOptions({ name: 'MsgList' })

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
@import url('../comment.scss');
@import url('../card.scss');

.avatar-div {
  width: 80px;
  text-align: center;
}
</style>
