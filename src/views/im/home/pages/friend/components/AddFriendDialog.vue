<template>
  <!--
    添加好友对话框
    - 搜索用户（按用户名 / 昵称），列出结果
    - 点"添加"发送好友申请
    - TODO 好友模块后端 API 接入后替换 searchUsers / addFriend 的调用
  -->
  <el-dialog
    v-model="visible"
    title="添加好友"
    width="480px"
    :close-on-click-modal="false"
  >
    <el-input
      v-model="keyword"
      placeholder="输入用户名或昵称回车搜索（最多展示 20 条）"
      clearable
      @keyup.enter="handleSearch"
    >
      <template #suffix>
        <el-icon class="im-add-friend__search-icon" @click="handleSearch">
          <Search />
        </el-icon>
      </template>
    </el-input>

    <el-scrollbar class="im-add-friend__result">
      <div v-if="users.length === 0" class="im-add-friend__empty">
        {{ searched ? '没有搜到用户' : '输入关键字后回车开始搜索' }}
      </div>
      <div
        v-for="user in users"
        :key="user.id"
        v-show="String(user.id) !== currentUserId"
        class="im-add-friend__item"
      >
        <UserAvatar
          :id="user.id"
          :url="user.headImage"
          :name="user.nickName"
          :online="user.online"
          :size="42"
          :clickable="false"
        />
        <div class="im-add-friend__user-info">
          <div class="im-add-friend__nick">
            {{ user.nickName }}
            <span class="im-add-friend__tag" :class="{ 'is-online': user.online }">
              {{ user.online ? '[在线]' : '[离线]' }}
            </span>
          </div>
        </div>
        <el-button
          v-if="!isFriend(user.id)"
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
import { computed, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import { useUserStore } from '@/store/modules/user'
import UserAvatar from '../../../components/UserAvatar.vue'
import { useFriendStore } from '../../../store/friendStore'
import { getSimpleUserListByNickname, type ImUserSimpleRespVO } from '@/api/im/user'

defineOptions({ name: 'ImAddFriendDialog' })

interface UserCandidate {
  id: string | number
  nickName: string
  headImage?: string
  online?: boolean
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** 添加好友成功后抛出，页面层去刷新 friendStore */
  added: [friend: UserCandidate]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const userStore = useUserStore()
const friendStore = useFriendStore()
const currentUserId = computed(() => userStore.getUser?.id?.toString() || '')

const keyword = ref('')
const users = ref<UserCandidate[]>([])
const searched = ref(false)
const loading = ref(false)

async function handleSearch() {
  searched.value = true
  if (!keyword.value.trim()) {
    users.value = []
    return
  }
  loading.value = true
  try {
    const list = await getSimpleUserListByNickname(keyword.value.trim())
    users.value = (list || []).map(toCandidate)
  } catch (e) {
    console.error('[IM] 用户搜索失败', e)
    ElMessage.error('搜索失败')
    users.value = []
  } finally {
    loading.value = false
  }
}

async function handleAdd(user: UserCandidate) {
  try {
    await friendStore.addFriend(user.id, {
      nickName: user.nickName,
      headImage: user.headImage,
      online: user.online
    })
    ElMessage.success('已添加好友')
    emit('added', user)
  } catch (e: any) {
    console.error('[IM] 添加好友失败', e)
    ElMessage.error(e?.message || '添加好友失败')
  }
}

function isFriend(userId: string | number): boolean {
  return friendStore.isFriend(userId)
}

function toCandidate(vo: ImUserSimpleRespVO): UserCandidate {
  return {
    id: vo.id,
    nickName: vo.nickname,
    headImage: vo.avatar,
    online: vo.online
  }
}
</script>

<style scoped>
.im-add-friend__result {
  height: 400px;
  margin-top: 10px;
}

.im-add-friend__empty {
  padding: 40px 0;
  font-size: 13px;
  color: #c0c4cc;
  text-align: center;
}

.im-add-friend__item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 8px;
  border-bottom: 1px solid #f0f2f5;
}

.im-add-friend__user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.im-add-friend__nick {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.im-add-friend__user-name {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
}

.im-add-friend__tag {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}

.im-add-friend__tag.is-online {
  color: #67c23a;
}

.im-add-friend__search-icon {
  cursor: pointer;
}
</style>
