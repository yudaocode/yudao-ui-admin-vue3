<template>
  <!--
    群成员单行（对应 boxim chat/ChatGroupMember.vue）
    跨子域复用：@候选 (MentionPicker) / 已读列表 (MessageReadStatus) / 群成员宫格 (ChatGroupSide)
  -->
  <div
    class="im-chat-group-member"
    :class="{ 'is-active': active }"
    :style="{ height: height + 'px' }"
  >
    <UserAvatar
      :size="avatarSize"
      :name="member.showNickName"
      :url="member.headImage"
      :clickable="clickable"
      :id="member.userId"
    />
    <div class="im-chat-group-member__name" :style="{ lineHeight: height + 'px' }">
      {{ member.showNickName }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import UserAvatar from '../../../components/UserAvatar.vue'

defineOptions({ name: 'ImChatGroupMember' })

/** 群成员结构（跨多处使用，放这里做窄接口；独立于 types/index.ts） */
export interface GroupMemberLite {
  /** 用户 id，特殊值 -1 表示「全体成员」 */
  userId: number | string
  /** 展示昵称：优先群备注，再群昵称，再用户昵称 */
  showNickName: string
  /** 头像 URL */
  headImage?: string
  /** 是否已退群 */
  quit?: boolean
}

const props = withDefaults(
  defineProps<{
    member: GroupMemberLite
    /** 行高（px），影响头像大小 */
    height?: number
    /** 选中态（@候选键盘高亮等） */
    active?: boolean
    /** 头像点击是否弹 UserInfoCard；@候选场景通常禁用（避免嵌套交互） */
    clickable?: boolean
  }>(),
  {
    height: 50,
    active: false,
    clickable: false
  }
)

const avatarSize = computed(() => Math.ceil(props.height * 0.75))
</script>

<style scoped>
.im-chat-group-member {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 5px;
  box-sizing: border-box;
  white-space: nowrap;
}

.im-chat-group-member.is-active {
  background-color: #e1eaf7;
}

.im-chat-group-member__name {
  flex: 1;
  height: 100%;
  padding-left: 10px;
  overflow: hidden;
  font-size: 14px;
  text-align: left;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
