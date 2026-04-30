<template>
  <!--
    ToolBar：IM 左侧工具栏
    布局：顶部头像 → 中间三 Tab（消息/好友/群聊）→ 底部设置
  -->
  <div class="flex flex-col items-center w-14 pt-4 pb-3 gap-2 flex-shrink-0 bg-[#2b2b2b]">
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
      <el-tooltip v-for="item in tabs" :key="item.name" :content="item.label" placement="right">
        <div
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
          <Icon icon="ant-design:setting-outlined" :size="22" />
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '@/components/Icon/src/Icon.vue'
import { useUserStore } from '@/store/modules/user'
import { useConversationStore } from '../store/conversationStore'
import UserAvatar from './user/UserAvatar.vue'

defineOptions({ name: 'ImToolBar' })

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const conversationStore = useConversationStore()

/** 消息 Tab 的红点：所有非免打扰会话的未读总和 */
const totalUnread = computed(() => conversationStore.getTotalUnread)

/**
 * 两个主 Tab 的配置，name 对应路由 ImHomeConversation/Contact
 * 用 name 而非 path：path 后期容易变（前缀调整、嵌套加层），name 更稳定
 * icon 走通用 <Icon> 组件，支持 iconify 全部前缀（ep: / ant-design: / svg-icon: 等）
 * 通讯录用 ant-design:contacts-outlined：与消息图标一眼区分；好友 + 群聊在通讯录内分组展示
 */
const tabs = [
  { name: 'ImHomeConversation', label: '消息', icon: 'ep:chat-dot-round' },
  { name: 'ImHomeContact', label: '通讯录', icon: 'ant-design:contacts-outlined' }
]

/** 当前路由是否命中 Tab：直接比对 route.name */
const isActive = (name: string) => route.name === name

/** 切换 Tab：当前 Tab 已选中时跳过，避免无意义的导航 */
const goTab = (name: string) => {
  if (route.name === name) {
    return
  }
  router.push({ name })
}

/** 跳转个人中心（路由 name=Profile） */
const goProfile = () => router.push({ name: 'Profile' })
</script>

<style scoped>
/* el-badge 子组件内部类 UnoCSS 够不到，单独贴一条 :deep 覆盖 */
.tool-bar__badge :deep(.el-badge__content) {
  top: 4px;
  right: 8px;
  border: none;
}
</style>
