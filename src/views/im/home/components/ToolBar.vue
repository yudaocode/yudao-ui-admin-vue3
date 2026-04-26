<template>
  <!--
    ToolBar：IM 左侧工具栏
    布局：顶部头像 → 中间三 Tab（消息/好友/群聊）→ 底部设置
  -->
  <div
    class="flex flex-col items-center w-14 pt-4 pb-3 gap-2 flex-shrink-0 bg-[#2b2b2b]"
  >
    <!-- 顶部用户头像，点击跳个人中心；方块小圆角对齐 UserAvatar 风格 -->
    <div class="mb-2 cursor-pointer" @click="goProfile">
      <el-avatar
        :size="36"
        :src="avatar"
        shape="square"
        :style="{ borderRadius: '6px' }"
      >
        {{ nicknameShort }}
      </el-avatar>
    </div>

    <!-- 中间三 Tab -->
    <div class="flex flex-col items-center gap-2 flex-1 w-full">
      <el-tooltip
        v-for="item in tabs"
        :key="item.path"
        :content="item.label"
        placement="right"
      >
        <div
          class="flex items-center justify-center w-10 h-10 rounded-lg text-[#a0a0a0] cursor-pointer transition-all hover:text-white hover:bg-white/10"
          :class="{ 'bg-white/15 text-white': isActive(item.path) }"
          @click="goTab(item.path)"
        >
          <el-badge
            v-if="item.path === '/im/home/conversation' && totalUnread > 0"
            :value="totalUnread"
            :max="99"
            class="tool-bar__badge"
          >
            <Icon :icon="item.icon" :size="22" />
          </el-badge>
          <Icon v-else :icon="item.icon" :size="22" />
        </div>
      </el-tooltip>
    </div>

    <!-- 底部设置按钮：点击跳个人中心 -->
    <div class="flex flex-col items-center gap-2 w-full">
      <el-tooltip content="设置" placement="right">
        <div
          class="flex items-center justify-center w-10 h-10 rounded-lg text-[#a0a0a0] cursor-pointer transition-all hover:text-white hover:bg-white/10"
          @click="goProfile"
        >
          <el-icon :size="22"><Setting /></el-icon>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Setting } from '@element-plus/icons-vue'

import Icon from '@/components/Icon/src/Icon.vue'
import { useUserStore } from '@/store/modules/user'
import { useConversationStore } from '../store/conversationStore'

defineOptions({ name: 'ImToolBar' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const conversationStore = useConversationStore()

/** 消息 Tab 的红点：所有非免打扰会话的未读总和 */
const totalUnread = computed(() => conversationStore.getTotalUnread)

/**
 * 三个主 Tab 的配置，路径对应 /im/home/{conversation,friend,group}
 * icon 走通用 <Icon> 组件，支持 ep: / svg-icon: 前缀
 * 群聊用项目自带的 svg-icon:peoples（双人剪影）一眼区分单人 / 群体
 */
// TODO @AI：改成 name 更合适把？
// TODO @AI: 其他地方，是不是也能减少 path？主要 path 容易变！
const tabs = [
  { path: '/im/home/conversation', label: '消息', icon: 'ep:chat-dot-round' },
  { path: '/im/home/friend', label: '好友', icon: 'ep:user' },
  { path: '/im/home/group', label: '群聊', icon: 'svg-icon:peoples' } // TODO @AI：这个图标不是很好，看看怎么优化下；ep 里，有 group 概念的图标么？
]

/** 当前路由是否命中 Tab：完全匹配或 Tab 路径是当前路径前缀均算命中 */
const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/')

// TODO @AI：方法注释
const goTab = (path: string) => {
  if (route.path === path) {
    return
  }
  router.push(path)
}

// TODO @AI：改成 name 更合适把？
const goProfile = () => router.push('/user/profile')

const avatar = computed(() => userStore.getUser?.avatar || '')

/** 头像兜底：取昵称最后一个字符，避免空头像时的灰底过于突兀 */
const nicknameShort = computed(() => {
  const name = userStore.getUser?.nickname || ''
  return name ? name.slice(-1) : '我'
})
</script>

<style scoped>
/* el-badge 子组件内部类 UnoCSS 够不到，单独贴一条 :deep 覆盖 */
.tool-bar__badge :deep(.el-badge__content) {
  top: 4px;
  right: 8px;
  border: none;
}
</style>
