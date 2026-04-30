<template>
  <!--
    用户名片自包含组件（浮层 / 行内通用）
    - 由 UserInfoCard（浮层）和 contact/index.vue（行内）共用：UserInfoCard 把它放进 teleport 浮层，contact 直接 mount 到右栏
    - 关系态由 relation prop 决定（friend / stranger / self / readonly），对应右上 "..." 菜单 + 底部动作区两块都内化在本组件
    - 备注 / 删除联系人 / 加为好友等 store 操作都在本组件内闭环，父级仅监听 chat / deleted / saved 等通知做导航 / 关浮层 / 同步副本
  -->
  <div>
    <!-- 顶部：头像（左） + 名字 + 性别图标 + 昵称 / 部门（右） + 右上 "..." 菜单（仅 friend 态） -->
    <div class="flex gap-3 items-start">
      <UserAvatar
        :id="full?.id"
        :url="full?.avatar"
        :name="full?.nickname"
        :size="56"
        :clickable="false"
        previewable
        :preview-z-index="previewZIndex"
      />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <span
            class="text-lg font-semibold leading-snug truncate text-[var(--el-text-color-primary)]"
          >
            {{ headerName }}
          </span>
          <!-- 性别小图标：男蓝、女粉，未知 / 0 不展示，对齐微信留白做法 -->
          <Icon
            v-if="genderIcon"
            :icon="genderIcon"
            :size="16"
            :color="genderColor"
            class="flex-shrink-0"
          />
        </div>
        <div class="mt-2 space-y-1 text-13px text-[var(--el-text-color-secondary)]">
          <!-- 仅当备注已设时展示昵称副行；未设置时主标题就是 nickname，避免重复 -->
          <div v-if="displayName" class="truncate">昵称：{{ full?.nickname }}</div>
          <div class="truncate">部门：{{ deptText }}</div>
        </div>
      </div>
      <!-- 右上 "..." 菜单：仅 friend 态展示，菜单项目前只有"删除联系人"（其它 WeChat 选项业务上未支持） -->
      <div v-if="relation === 'friend'" class="flex-shrink-0">
        <el-dropdown
          trigger="click"
          placement="bottom-end"
          popper-class="im-user-info__more-menu"
        >
          <div
            class="flex items-center justify-center w-7 h-7 rounded cursor-pointer hover:bg-[var(--el-fill-color-light)]"
          >
            <Icon
              icon="ep:more-filled"
              :size="18"
              class="text-[var(--el-text-color-secondary)]"
            />
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleDeleteFriend">
                <span class="text-[var(--el-color-danger)]">删除联系人</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 备注行：仅 friend 态展示，未编辑时整行可点；编辑态用 el-input 行内替换 value 列 -->
    <template v-if="relation === 'friend'">
      <div class="my-4 h-px bg-[var(--el-border-color-lighter)]"></div>
      <div
        class="flex gap-5 items-center px-1.5 py-1.5 text-sm"
        :class="
          !editingRemark
            ? 'group cursor-pointer rounded transition-colors hover:bg-[var(--el-fill-color-lighter)]'
            : ''
        "
        @click="onRowClick"
      >
        <span class="flex-shrink-0 w-14 text-[var(--el-text-color-secondary)]">备注</span>
        <el-input
          v-if="editingRemark"
          ref="remarkInputRef"
          v-model="remarkInput"
          size="small"
          maxlength="20"
          placeholder="添加备注"
          class="flex-1"
          @click.stop
          @blur="saveRemark"
          @keyup.enter="saveRemark"
          @keyup.esc="cancelEditRemark"
        />
        <template v-else>
          <span
            class="flex-1 min-w-0 truncate"
            :class="
              displayName
                ? 'text-[var(--el-text-color-primary)]'
                : 'text-[var(--el-text-color-placeholder)]'
            "
          >
            {{ displayName || '添加备注' }}
          </span>
          <!-- 默认 opacity:0 占位避免 hover 时其它列位移；仅父行 hover 时浮现 -->
          <Icon
            icon="ant-design:edit-outlined"
            :size="14"
            class="flex-shrink-0 text-[var(--el-text-color-secondary)] opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </template>
      </div>
    </template>

    <!-- 动作区：好友 = 3 图标；陌生人 = 加为好友按钮；自己 = disabled；readonly 不渲染 -->
    <template v-if="relation !== 'readonly'">
      <div class="my-4 h-px bg-[var(--el-border-color-lighter)]"></div>
      <div v-if="relation === 'friend'" class="flex justify-around">
        <!-- 三连图标按钮：图上字下、主色作为可点暗示，hover 降不透明度做反馈 -->
        <div
          class="flex flex-col gap-1.5 items-center cursor-pointer text-13px text-[var(--el-color-primary)] transition-opacity hover:opacity-75"
          @click="handleChat"
        >
          <Icon icon="ant-design:message-outlined" :size="22" />
          <span>发消息</span>
        </div>
        <div
          class="flex flex-col gap-1.5 items-center cursor-pointer text-13px text-[var(--el-color-primary)] transition-opacity hover:opacity-75"
          @click="onComingSoon('语音聊天')"
        >
          <Icon icon="ant-design:phone-outlined" :size="22" />
          <span>语音聊天</span>
        </div>
        <div
          class="flex flex-col gap-1.5 items-center cursor-pointer text-13px text-[var(--el-color-primary)] transition-opacity hover:opacity-75"
          @click="onComingSoon('视频聊天')"
        >
          <Icon icon="ant-design:video-camera-outlined" :size="22" />
          <span>视频聊天</span>
        </div>
      </div>
      <div v-else-if="relation === 'self'" class="flex justify-center">
        <el-button type="primary" disabled>不能和自己聊天</el-button>
      </div>
      <div v-else class="flex justify-center">
        <el-button type="primary" @click="handleAddFriend">加为好友</el-button>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import type { InputInstance } from 'element-plus'
import Icon from '@/components/Icon/src/Icon.vue'
import { useMessage } from '@/hooks/web/useMessage'

import UserAvatar from './UserAvatar.vue'
import { getSimpleUser } from '@/api/system/user'
import { useFriendStore } from '../../store/friendStore'
import type { User } from '../../types'

defineOptions({ name: 'ImUserInfo' })

/**
 * 关系态：决定备注行 / 右上 "..." 菜单 / 底部动作区的内容
 * - friend: 备注（可编辑）+ "..." 删除菜单 + 3 图标动作
 * - stranger: 单按钮"加为好友"
 * - self: 单按钮"不能和自己聊天" disabled
 * - readonly: 不渲染备注 / 菜单 / 动作区，仅展示头部信息
 */
export type UserInfoRelation = 'friend' | 'stranger' | 'self' | 'readonly'

const props = withDefaults(
  defineProps<{
    /** 起手用户：至少要有 id；性别 / 部门由组件按 id 懒拉合并补齐 */
    user: User | null
    relation?: UserInfoRelation
    /** 备注：仅 relation=friend 时有效；空串 → 显示"添加备注"占位 */
    displayName?: string
    /** UserAvatar 预览层 z-index；放在高 z-index 浮层（如 UserInfoCard）里需手动抬高 */
    previewZIndex?: number
  }>(),
  {
    relation: 'readonly',
    previewZIndex: 2000
  }
)

const emit = defineEmits<{
  /** 备注落库成功后通知父级，用于同步父级持有的本地 FriendLite / Friend 副本（如 contact 页的 selection） */
  saved: [value: string]
  /** 用户点"发消息"：导航 / 关浮层等场景相关动作由父级承担（比如 UserInfoCard 要 close） */
  chat: [user: User]
  /** 删除联系人成功后通知父级（confirm + 调 store 都在本组件内做完）：父级关浮层 / 清选中等 */
  deleted: [user: User]
}>()

const message = useMessage()
const friendStore = useFriendStore()

/** 起手 user + getSimpleUser 合并后的完整对象（性别 / 部门补齐用） */
const full = ref<User | null>(props.user)

/** 主标题：备注优先（好友场景），其次原昵称 */
const headerName = computed(() => props.displayName || full.value?.nickname || '')

const deptText = computed(() => full.value?.deptName || '-')

/** 性别图标：男 1 / 女 2，0 / null / undefined 一律不展示 */
const genderIcon = computed(() => {
  // TODO @AI: 有没更好看的图标。
  const sex = full.value?.sex
  if (sex === 1) {
    return 'mdi:human-male'
  }
  if (sex === 2) {
    return 'mdi:human-female'
  }
  return ''
})

const genderColor = computed(() => {
  const sex = full.value?.sex
  if (sex === 1) {
    return '#5b97f5'
  }
  if (sex === 2) {
    return '#f56c92'
  }
  return ''
})

/** 备注内联编辑：editingRemark 控制输入态；user 切换时由下面的 watch 复位避免脏态泄漏 */
const editingRemark = ref(false)
const remarkInput = ref('')
const remarkInputRef = ref<InputInstance | null>(null)

/**
 * user.id 变化的统一处理：
 * 1. 起手用 prop 兜底首屏（full = props.user），再 getSimpleUser 命中后合并替换
 * 2. 顺便复位备注编辑态，避免上一个用户的脏输入泄漏到下一个
 * 3. 竞态用 id 比对丢弃陈旧响应
 */
watch(
  () => props.user?.id,
  async (id) => {
    full.value = props.user
    editingRemark.value = false
    if (!id) {
      return
    }
    try {
      const data = (await getSimpleUser(id)) as User
      if (props.user?.id !== id) {
        return
      }
      full.value = { ...props.user, ...data }
    } catch (e) {
      // TODO @AI：最好把 id 打印进去
      console.warn('[IM] 获取用户详情失败', e)
    }
  },
  { immediate: true }
)

// TODO @AI：目前项目里，更多使用 handleXXX 为主；可能要统一跟进下；
// TODO @AI：是不是通过 await 做；
// TODO @AI：注释一下；
function onRowClick() {
  if (editingRemark.value) {
    return
  }
  remarkInput.value = props.displayName || ''
  editingRemark.value = true
  void nextTick(() => {
    remarkInputRef.value?.focus()
    remarkInputRef.value?.select()
  })
}

/**
 * 保存备注：
 * 1. 重入保护——blur + Enter 同时触发只走一次（编辑态先复位）
 * 2. 无变化跳过后端调用 + 不抛 saved，避免父级误同步
 * 3. 落库成功 / 失败都在组件内自闭：成功抛 saved 让父级同步本地副本，失败留编辑态外的展示值不动
 */
async function saveRemark() {
  if (!editingRemark.value) {
    return
  }
  const userId = props.user?.id
  if (!userId) {
    editingRemark.value = false
    return
  }
  const next = remarkInput.value.trim()
  editingRemark.value = false
  if (next === (props.displayName || '')) {
    return
  }
  await friendStore.setDisplayName(userId, next)
  message.success('已更新备注')
  emit('saved', next)
}

function cancelEditRemark() {
  editingRemark.value = false
}

/** 发消息：导航 / 关浮层这些"业务侧"动作交给父级，本组件只负责通知 */
function handleChat() {
  if (!props.user) {
    return
  }
  emit('chat', props.user)
}

/** 加为好友：成功后 friendStore 反应到 isFriend，父级的 relation 自然翻 friend，本组件随之换装到 3 图标 */
async function handleAddFriend() {
  if (!props.user?.id) {
    return
  }
  await friendStore.addFriend(props.user.id, {
    nickname: props.user.nickname,
    avatar: props.user.avatar
  })
  message.success('已添加好友')
}

/** 删除联系人：confirm → friendStore.deleteFriend（内部级联清会话）→ 通知父级关浮层 / 清选中 */
async function handleDeleteFriend() {
  if (!props.user?.id) {
    return
  }
  const target = props.user
  // 二次确认（用户点取消时 message.confirm 抛 reject，吃掉直接 return）
  try {
    await message.confirm(`确定删除好友「${target.nickname || ''}」吗？`, '删除联系人')
  } catch {
    return
  }
  await friendStore.deleteFriend(target.id)
  message.success('已删除好友')
  emit('deleted', target)
}

/** 占位提示：语音 / 视频聊天能力尚未接入，先以"开发中"友好提示 */
function onComingSoon(featureName: string) {
  message.info(`${featureName} 功能开发中`)
}
</script>

<!--
TODO @AI：这个是不是注释到 style 里？
  非 scoped：el-dropdown 的下拉菜单走 teleport 到 body，scoped 选不到。
  UserInfoCard 浮层用 z-9998，要把这块抬到更高（默认 --el-popper-z-index ~2050 会被遮罩压住）。
-->
<style>
.im-user-info__more-menu {
  z-index: 10000 !important;
}
</style>
