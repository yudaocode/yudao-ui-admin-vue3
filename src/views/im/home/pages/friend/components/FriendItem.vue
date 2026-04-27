<template>
  <!--
    好友单行项（对应 boxim friend/FriendItem.vue）
    - 头像 + 昵称 + 在线标识
    - 选中态 active
    - 右键菜单（发消息 / 删除好友）由全局 ContextMenu 承接
  -->
  <div
    class="im-friend-item"
    :class="{ 'is-active': active }"
    @click="$emit('click', friend)"
    @contextmenu.prevent="handleContextMenu"
  >
    <UserAvatar
      :id="friend.id"
      :url="friend.headImage"
      :name="friend.nickName"
      :online="friend.online"
      :size="42"
      :clickable="false"
    />
    <div class="im-friend-item__info">
      <div class="im-friend-item__name">{{ friend.nickName }}</div>
      <div class="im-friend-item__online">
        <span v-if="friend.onlineWeb" class="im-friend-item__dot" title="Web 在线">💻</span>
        <span v-if="friend.onlineApp" class="im-friend-item__dot" title="App 在线">📱</span>
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { useImUiStore } from '../../../store/uiStore'
import UserAvatar from '../../../components/UserAvatar.vue'

defineOptions({ name: 'ImFriendItem' })

export interface FriendLite {
  id: string | number
  nickName: string
  headImage?: string
  online?: boolean
  onlineWeb?: boolean
  onlineApp?: boolean
  deleted?: boolean
}

const props = withDefaults(
  defineProps<{
    friend: FriendLite
    active?: boolean
    /** 是否启用右键菜单；在选择器弹窗里一般关闭 */
    menu?: boolean
  }>(),
  {
    active: false,
    menu: true
  }
)

const emit = defineEmits<{
  click: [friend: FriendLite]
  chat: [friend: FriendLite]
  delete: [friend: FriendLite]
}>()

const uiStore = useImUiStore()

function handleContextMenu(e: MouseEvent) {
  if (!props.menu) return
  uiStore.openContextMenu(
    { x: e.clientX, y: e.clientY },
    [
      { key: 'chat', name: '发送消息' },
      { key: 'delete', name: '删除好友' }
    ],
    (item) => {
      if (item.key === 'chat') emit('chat', props.friend)
      else if (item.key === 'delete') emit('delete', props.friend)
    }
  )
}
</script>

<style scoped>
.im-friend-item {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
  height: 50px;
  margin: 0 3px;
  padding: 5px 8px;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 10px;
  transition: background-color 0.15s;
}

.im-friend-item:hover {
  background-color: #f5f7fa;
}

.im-friend-item.is-active {
  background-color: #e1eaf7;
}

.im-friend-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.im-friend-item__name {
  overflow: hidden;
  font-size: 14px;
  color: #303133;
  text-overflow: ellipsis;
}

.im-friend-item__online {
  display: flex;
  gap: 4px;
  font-size: 12px;
}
</style>
