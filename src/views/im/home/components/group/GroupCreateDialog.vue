<template>
  <!--
    新建群聊对话框
    - 顶部：群名称输入
    - 左：好友列表（带 checkbox）
    - 右：已勾选预览
    - 提交：先 createGroup 再 inviteGroupMember，最后让父页 reload
  -->
  <el-dialog v-model="visible" title="新建群聊" width="620px" :close-on-click-modal="false">
    <div class="flex flex-col gap-3">
      <el-input v-model="groupName" placeholder="请输入群名称" maxlength="20" show-word-limit />

      <div class="flex gap-2.5">
        <div
          class="flex flex-col flex-1 overflow-hidden rounded border border-[var(--el-border-color)]"
        >
          <el-input v-model="searchText" placeholder="搜索好友" size="small" clearable>
            <template #suffix>
              <Icon icon="ant-design:search-outlined" />
            </template>
          </el-input>
          <el-scrollbar class="h-[400px]">
            <FriendItem
              v-for="f in shownFriends"
              :key="f.id"
              :friend="f"
              :menu="false"
              :active="false"
              @click="handleToggleCheck(f)"
            >
              <el-checkbox
                :model-value="f.isCheck"
                @click.stop
                @change="(v) => (f.isCheck = !!v)"
              />
            </FriendItem>
          </el-scrollbar>
        </div>

        <div class="flex items-center text-lg text-[#409eff]">
          <Icon icon="ant-design:double-right-outlined" />
        </div>

        <div
          class="flex flex-col flex-1 overflow-hidden rounded border border-[var(--el-border-color)]"
        >
          <div
            class="h-10 pl-2.5 leading-10 text-13px text-[var(--el-text-color-secondary)] border-b border-[var(--el-border-color-lighter)]"
          >
            已勾选 {{ checkedFriends.length }} 位好友
          </div>
          <el-scrollbar class="h-[400px]">
            <FriendItem
              v-for="f in checkedFriends"
              :key="f.id"
              :friend="f"
              :menu="false"
              :active="false"
            />
          </el-scrollbar>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleOk">创 建</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { createGroup } from '@/api/im/group'
import { inviteGroupMember } from '@/api/im/group/member'
import { useGroupStore } from '../../store/groupStore'
import FriendItem from '../friend/FriendItem.vue'
import type { FriendLite } from '../../types'

defineOptions({ name: 'ImGroupCreateDialog' })

interface FriendCheckable extends FriendLite {
  isCheck?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    friends?: FriendLite[] // 全量好友（由调用方从 friendStore 传入）
  }>(),
  {
    friends: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [groupId: number] // 创建成功，携带新群编号
}>()

const message = useMessage()
const groupStore = useGroupStore()

/** 弹窗显隐：把父侧 v-model 转双向计算 */
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const groupName = ref('')
const searchText = ref('')
const submitting = ref(false)
// TODO @AI：checked 改成这个变量；
const workingFriends = ref<FriendCheckable[]>([]) // 工作副本（带 isCheck 标记），与 prop 隔离

watch(
  visible,
  (v) => {
    if (!v) {
      return
    }
    groupName.value = ''
    searchText.value = ''
    workingFriends.value = props.friends
      .filter((f) => !f.deleted)
      .map((f) => ({ ...f, isCheck: false }))
  },
  { immediate: true }
)

/** 左侧展示的好友：按搜索关键字过滤 workingFriends */
const shownFriends = computed(() =>
  workingFriends.value.filter((f) => f.nickname.includes(searchText.value))
)

/** 已勾选的好友：右侧预览 + 提交时取 memberUserIds */
const checkedFriends = computed(() => workingFriends.value.filter((f) => f.isCheck))

/** 行点击：切换勾选态，让点击整行与点 checkbox 等价 */
function handleToggleCheck(f: FriendCheckable) {
  f.isCheck = !f.isCheck
}

/** 创建群聊：建群 → 拉人 → upsert groupStore，最后 emit('created') 让父页跳转新会话 */
async function handleOk() {
  const name = groupName.value.trim()
  if (!name) {
    message.warning('请输入群名称')
    return
  }
  const memberUserIds = checkedFriends.value.map((f) => f.id)
  if (memberUserIds.length === 0) {
    message.warning('请至少选择一位好友')
    return
  }
  submitting.value = true
  try {
    // 1.1 新建群聊
    const group = await createGroup({ name })
    if (!group?.id) {
      throw new Error('创建群失败：未返回群编号')
    }
    // 1.2 拉好友入群
    await inviteGroupMember({ groupId: group.id, memberUserIds })
    // 2.1 直接 upsert 进 groupStore，省一次 fetchGroups——服务端返回 VO 已经够建会话了
    groupStore.upsertGroup({
      id: group.id,
      name: group.name,
      avatar: group.avatar,
      notice: group.notice,
      ownerUserId: group.ownerUserId
    })
    // 2.2 提示成功 + emit 让父页跳转新会话 + 关弹窗
    message.success('群聊创建成功')
    emit('created', group.id)
    visible.value = false
  } finally {
    submitting.value = false
  }
}
</script>
