<template>
  <!--
    ToolBar：IM 左侧工具栏
    布局：顶部头像 → 中间三 Tab（消息/好友/群聊）→ 底部设置
  -->
  <div
    class="flex flex-col items-center w-14 pt-4 pb-3 gap-2 flex-shrink-0 select-none bg-[#2b2b2b]"
  >
    <!-- 顶部用户头像，点击跳个人中心；走 UserAvatar 统一首字 / 哈希配色规则 -->
    <div class="mb-2 cursor-pointer" @click="goProfile">
      <UserAvatar
        :url="userStore.getUser?.avatar"
        :name="userStore.getUser?.nickname"
        :size="36"
        :clickable="false"
      />
    </div>

    <!-- 中间三 Tab -->
    <div class="flex flex-col items-center gap-2 flex-1 w-full">
      <div
        v-for="item in tabs"
        :key="item.name"
        class="flex items-center justify-center w-10 h-10 rounded-lg text-[#a0a0a0] cursor-pointer transition-all hover:text-white hover:bg-white/10"
        :class="{ 'bg-white/15 text-white': isActive(item.name) }"
        @click="goTab(item.name)"
      >
        <el-badge
          v-if="item.name === 'ImHomeConversation' && totalUnread > 0"
          :value="totalUnread"
          :max="99"
          class="tool-bar__badge"
        >
          <Icon :icon="item.icon" :size="22" />
        </el-badge>
        <el-badge
          v-else-if="item.name === 'ImHomeContact' && unhandledRequestCount > 0"
          :value="unhandledRequestCount"
          :max="99"
          class="tool-bar__badge"
        >
          <Icon :icon="item.icon" :size="22" />
        </el-badge>
        <Icon v-else :icon="item.icon" :size="22" />
      </div>
    </div>

    <!-- 底部设置按钮：点击跳个人中心 -->
    <div class="flex flex-col items-center gap-2 w-full">
      <div
        class="flex items-center justify-center w-10 h-10 rounded-lg text-[#a0a0a0] cursor-pointer transition-all hover:text-white hover:bg-white/10"
        @click="goProfile"
      >
        <Icon icon="ant-design:setting-outlined" :size="22" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '@/components/Icon/src/Icon.vue'
import { useUserStore } from '@/store/modules/user'
import { useConversationStore } from '../store/conversationStore'
import { useFriendStore } from '../store/friendStore'
import { useImUiStore } from '../store/uiStore'
import UserAvatar from './user/UserAvatar.vue'

defineOptions({ name: 'ImToolBar' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const uiStore = useImUiStore()

const totalUnread = computed(() => conversationStore.getTotalUnreadCount) // 消息 Tab 的红点：所有非免打扰会话的未读总和
const unhandledRequestCount = computed(() => friendStore.getUnhandledRequestCount) // 通讯录 Tab 的红点：未处理好友申请数（接收方=我）

const tabs = [
  { name: 'ImHomeConversation', icon: 'ep:chat-round' },
  { name: 'ImHomeContact', icon: 'mingcute:contacts-line' }
] // 两个主 Tab；用路由 name 而非 path，避免前缀 / 嵌套调整后失效

/** 当前路由是否命中 Tab：直接比对 route.name */
const isActive = (name: string) => route.name === name

/** 切换 Tab：当前已选中时，消息 Tab 触发"滚动到下一个未读"（对齐微信 PC），其它 Tab 无动作 */
const goTab = (name: string) => {
  if (route.name === name) {
    if (name === 'ImHomeConversation') {
      uiStore.requestNextUnreadJump()
    }
    return
  }
  router.push({ name })
}

/** 跳转个人中心（路由 name=Profile） */
const goProfile = () => router.push({ name: 'Profile' })
</script>

<style scoped>
/* :deep 穿透 el-badge 子组件内部 .el-badge__content；右上角红点位置 + 去掉描边 */
.tool-bar__badge :deep(.el-badge__content) {
  top: 4px;
  right: 8px;
  border: none;
}
</style>
