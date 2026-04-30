<template>
  <!--
    邀请好友入群对话框
    - 左：好友列表（带 checkbox）
    - 右：已勾选预览
    - 已在群内的好友标记为 disabled
    - TODO 接入 /im/group/invite；TODO 这个是不是已经接入了？
  -->
  <el-dialog v-model="visible" title="邀请好友" width="620px" :close-on-click-modal="false">
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
          <!-- TODO @ai: friend? -->
          <FriendItem
            v-for="f in shownFriends"
            :key="f.id"
            :friend="f"
            :menu="false"
            :active="false"
            @click="handleToggleCheck(f)"
          >
            <!-- TODO @AI：checked？ -->
            <el-checkbox
              :model-value="f.isCheck"
              :disabled="f.disabled"
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
          已勾选 {{ checkCount }} 位好友
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

    <template #footer>
      <el-button @click="visible = false">取 消</el-button>
      <el-button type="primary" @click="handleOk">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import { CommonStatusEnum } from '@/utils/constants'
import FriendItem from '../friend/FriendItem.vue'
import type { FriendLite } from '../../types'
import type { GroupMemberLite } from './GroupMember.vue'

defineOptions({ name: 'ImGroupMemberAddDialog' })

interface FriendCheckable extends FriendLite {
  isCheck?: boolean
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    groupId?: number
    members?: GroupMemberLite[] // 本群现有成员，用来判断好友是否已在群里
    friends?: FriendLite[] // 全量好友（由调用方从 friendStore 传入）
  }>(),
  {
    members: () => [],
    friends: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  reload: [friendIds: number[]] // 邀请完成，携带被邀请的好友 id 列表
}>()

const message = useMessage()

/** 弹窗显隐：把父侧 v-model 转双向计算 */
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const searchText = ref('')
/** 本地工作副本（带 isCheck / disabled 标记）；和 props.friends 区分以避免直接改 prop */
const workingFriends = ref<FriendCheckable[]>([])

watch(
  visible,
  (v) => {
    if (!v) {
      return
    }
    workingFriends.value = props.friends
      .filter((friend) => !friend.deleted)
      .map((friend) => {
        const inGroup = props.members.some(
          (member) => member.status !== CommonStatusEnum.DISABLE && member.userId === friend.id
        )
        return {
          ...friend,
          disabled: inGroup,
          isCheck: inGroup
        }
      })
  },
  { immediate: true }
)

/** 左侧展示的好友：按搜索关键字过滤 workingFriends */
const shownFriends = computed(() =>
  workingFriends.value.filter((f) => f.nickname.includes(searchText.value))
)

/** 本次将被邀请的好友：勾选 + 非已在群成员（disabled 不计入） */
const checkedFriends = computed(() => workingFriends.value.filter((f) => f.isCheck && !f.disabled))

/** 已勾选数量：右侧标题展示 */
const checkCount = computed(() => checkedFriends.value.length)

/** 行点击：切换勾选态，已在群（disabled）的不响应 */
function handleToggleCheck(f: FriendCheckable) {
  if (!f.disabled) {
    f.isCheck = !f.isCheck
  }
}

// TODO @AI：这里接入下？
/**
 * 邀请入群：占位实现——抛 reload 让父侧关弹窗 / 刷新
 *
 * TODO 接入 /im/group/invite
 */
async function handleOk() {
  const ids = checkedFriends.value.map((f) => f.id)
  if (ids.length === 0) {
    message.warning('请选择至少一个好友')
    return
  }
  message.info('邀请入群接口待接入，当前为占位实现')
  emit('reload', ids)
  visible.value = false
}
</script>
