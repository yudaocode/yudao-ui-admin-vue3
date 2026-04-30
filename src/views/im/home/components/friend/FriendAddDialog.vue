<template>
  <!--
    添加好友对话框
    - 按昵称搜索用户列表（最多 20 条）
    - 点 "添加" 直接发好友申请，friendStore 落地后按钮自动切到 "已添加"
  -->
  <el-dialog v-model="visible" title="添加好友" width="480px" :close-on-click-modal="false">
    <el-input
      v-model="keyword"
      placeholder="输入昵称回车搜索（最多展示 20 条）"
      clearable
      @keyup.enter="handleSearch"
    >
      <template #suffix>
        <Icon icon="ant-design:search-outlined" class="cursor-pointer" @click="handleSearch" />
      </template>
    </el-input>

    <el-scrollbar v-loading="loading" class="h-[400px] mt-2.5">
      <div
        v-if="users.length === 0"
        class="py-10 text-13px text-center text-[var(--el-text-color-disabled)]"
      >
        {{ searched ? '没有搜到用户' : '输入关键字后回车开始搜索' }}
      </div>
      <div
        v-for="user in users"
        :key="user.id"
        v-show="user.id !== currentUserId"
        class="flex gap-3 items-center px-2 py-2.5 border-b border-[var(--el-border-color-lighter)]"
      >
        <UserAvatar
          :id="user.id"
          :url="user.avatar"
          :name="user.nickname"
          :size="42"
          :clickable="false"
        />
        <div class="flex-1 min-w-0 overflow-hidden">
          <!-- 昵称 + 性别图标 -->
          <div
            class="flex items-center gap-1 text-sm font-semibold text-[var(--el-text-color-primary)]"
          >
            <span class="truncate">{{ user.nickname }}</span>
            <Icon
              v-if="getGenderIcon(user.sex)"
              :icon="getGenderIcon(user.sex)"
              :size="14"
              :color="getGenderColor(user.sex)"
              class="flex-shrink-0"
            />
          </div>
          <!-- 部门 -->
          <div
            v-if="user.deptName"
            class="mt-0.5 text-xs truncate text-[var(--el-text-color-secondary)]"
          >
            {{ user.deptName }}
          </div>
        </div>
        <!-- 添加操作 -->
        <el-button
          v-if="!friendStore.isFriend(user.id)"
          type="primary"
          size="small"
          @click="handleAdd(user)"
        >
          添加
        </el-button>
        <el-button v-else size="small" disabled>已添加</el-button>
      </div>
    </el-scrollbar>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import UserAvatar from '../user/UserAvatar.vue'
import { useFriendStore } from '../../store/friendStore'
import { getCurrentUserId } from '../../../utils/storage'
import { getGenderColor, getGenderIcon } from '../../../utils/user'
import { getSimpleUserListByNickname, type UserVO } from '@/api/system/user'

defineOptions({ name: 'ImFriendAddDialog' })

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

/** 弹窗显隐：把父侧 v-model 转双向计算 */
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const friendStore = useFriendStore()
const message = useMessage()

const currentUserId = getCurrentUserId() // 当前登录用户编号
const keyword = ref('')
const users = ref<UserVO[]>([])
const searched = ref(false)
const loading = ref(false)

// 每次重新打开都把搜索态清空，避免上次的关键字 / 结果泄漏到下次
watch(visible, (open) => {
  if (open) {
    keyword.value = ''
    users.value = []
    searched.value = false
  }
})

/** 按昵称搜索用户：空关键字直接清空结果 */
async function handleSearch() {
  searched.value = true
  if (!keyword.value.trim()) {
    users.value = []
    return
  }
  loading.value = true
  try {
    users.value = (await getSimpleUserListByNickname(keyword.value.trim())) || []
  } finally {
    loading.value = false
  }
}

/** 发起好友申请：成功后 friendStore 已落地，按钮自动切到 "已添加" */
async function handleAdd(user: UserVO) {
  await friendStore.addFriend(user.id, {
    nickname: user.nickname,
    avatar: user.avatar
  })
  message.success('已添加好友')
}
</script>
