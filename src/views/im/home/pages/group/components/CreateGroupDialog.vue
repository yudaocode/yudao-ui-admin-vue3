<template>
  <!--
    新建群聊对话框
    - 顶部：群名称输入
    - 左：好友列表（带 checkbox）
    - 右：已勾选预览
    - 提交：先 createGroup 再 inviteGroupMember，最后让父页 reload
  -->
  <el-dialog
    v-model="visible"
    title="新建群聊"
    width="620px"
    :close-on-click-modal="false"
  >
    <div class="flex flex-col gap-3">
      <el-input
        v-model="groupName"
        placeholder="请输入群名称"
        maxlength="20"
        show-word-limit
      />

      <div class="flex gap-2.5">
        <div class="flex flex-col flex-1 overflow-hidden rounded border border-[var(--el-border-color)]">
          <el-input v-model="searchText" placeholder="搜索好友" size="small" clearable>
            <template #suffix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-scrollbar class="h-[400px]">
            <FriendItem
              v-for="f in shownFriends"
              :key="f.id"
              :friend="f"
              :menu="false"
              :active="false"
              @click="toggleCheck(f)"
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
          <el-icon><DArrowRight /></el-icon>
        </div>

        <div class="flex flex-col flex-1 overflow-hidden rounded border border-[var(--el-border-color)]">
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
import { Search, DArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import { createGroup } from '@/api/im/group'
import { inviteGroupMember } from '@/api/im/group/member'
import FriendItem, { type FriendLite } from '../../friend/components/FriendItem.vue'

defineOptions({ name: 'ImCreateGroupDialog' })

interface FriendCheckable extends FriendLite {
  isCheck?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** 全量好友（由调用方从 friendStore 传入） */
    friends?: FriendLite[]
  }>(),
  {
    friends: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** 创建成功，携带新群编号 */
  created: [groupId: number]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const groupName = ref('')
const searchText = ref('')
const submitting = ref(false)
/** 工作副本（带 isCheck 标记），与 prop 隔离 */
const workingFriends = ref<FriendCheckable[]>([])

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

const shownFriends = computed(() =>
  workingFriends.value.filter((f) => f.nickname.includes(searchText.value))
)

const checkedFriends = computed(() => workingFriends.value.filter((f) => f.isCheck))

function toggleCheck(f: FriendCheckable) {
  f.isCheck = !f.isCheck
}

async function handleOk() {
  const name = groupName.value.trim()
  if (!name) {
    ElMessage.warning('请输入群名称')
    return
  }
  const memberUserIds = checkedFriends.value.map((f) => f.id)
  if (memberUserIds.length === 0) {
    ElMessage.warning('请至少选择一位好友')
    return
  }
  submitting.value = true
  try {
    const group = await createGroup({ name })
    if (!group?.id) {
      throw new Error('创建群失败：未返回群编号')
    }
    await inviteGroupMember({ groupId: group.id, memberUserIds })
    ElMessage.success('群聊创建成功')
    emit('created', group.id)
    visible.value = false
  } catch (e: any) {
    console.error('[IM] 创建群失败', e)
    ElMessage.error(e?.message || '创建群失败')
  } finally {
    submitting.value = false
  }
}
</script>
