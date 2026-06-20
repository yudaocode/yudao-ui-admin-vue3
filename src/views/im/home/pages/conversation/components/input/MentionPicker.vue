<template>
  <!--
    @ 成员选择浮层（对齐微信 PC：所有人在顶 + 群成员分组 + 底部三角指针）
    - 父组件通过 v-model:visible 控制显隐，searchText 过滤
    - 父组件通过 ref 调 moveUp / moveDown / pickActive 实现键盘上下 + Enter 选中
    - @select 发射被选中的成员
  -->
  <div
    v-show="visible && showMembers.length > 0"
    class="message-input__mention-picker !fixed z-100 w-50 rounded-md bg-[var(--el-bg-color)] shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
    :style="{
      left: position.x + 'px',
      top: position.top != null ? position.top + 'px' : 'auto',
      bottom: position.bottom != null ? position.bottom + 'px' : 'auto'
    }"
  >
    <el-scrollbar ref="scrollRef" max-height="300px">
      <!-- 所有人：虚拟项，仅群主可选；蓝色方块 + 群体图标，跟下面的成员头像区分 -->
      <div
        v-if="allItem"
        class="flex items-center gap-2.5 px-[5px] h-10 cursor-pointer transition-colors hover:bg-[var(--el-fill-color)]"
        :class="{ 'bg-[#e1eaf7] dark:bg-[var(--el-color-primary-light-9)]': activeIdx === 0 }"
        @click.stop="handleSelect(allItem)"
      >
        <div
          class="flex items-center justify-center w-[30px] h-[30px] rounded text-white bg-[var(--el-color-primary)] flex-shrink-0"
        >
          <Icon icon="ep:user-filled" :size="18" />
        </div>
        <span class="overflow-hidden text-sm truncate text-[var(--el-text-color-regular)]">
          {{ allItem.showName }}
        </span>
      </div>

      <!-- 群成员 section header：只有"所有人 + 真成员"两边都在时才出现，避免单一来源时显得多余 -->
      <div
        v-if="allItem && memberItems.length > 0"
        class="px-2 pt-2 pb-1 text-12px text-[var(--el-text-color-secondary)]"
      >
        群成员
      </div>

      <!-- 真成员行 -->
      <GroupMember
        v-for="(member, idx) in memberItems"
        :key="member.userId"
        :member="member"
        :height="40"
        :active="activeIdx === (allItem ? idx + 1 : idx)"
        :clickable="false"
        @click.stop="handleSelect(member)"
      />
    </el-scrollbar>

    <!-- 三角指针：picker 在 @ 下方（position.top 锚定）→ 箭头朝上贴顶；picker 在 @ 上方（position.bottom 锚定）→ 箭头朝下贴底 -->
    <div
      class="absolute left-4 w-3 h-3 rotate-45 bg-[var(--el-bg-color)]"
      :class="position.top != null ? '-top-1.5' : '-bottom-1.5'"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from 'vue'
import { ElScrollbar } from 'element-plus'

import Icon from '@/components/Icon/src/Icon.vue'
import { getCurrentUserId } from '@/utils/auth'
import { CommonStatusEnum } from '@/utils/constants'
import { IM_AT_ALL_NICKNAME, IM_AT_ALL_USER_ID } from '@/views/im/utils/constants'
import GroupMember, { type GroupMemberLite } from '../../../../components/group/GroupMember.vue'

defineOptions({ name: 'ImMentionPicker' })

const props = withDefaults(
  defineProps<{
    visible: boolean // 是否显示
    // 浮层位置：x 横坐标 + top / bottom 二选一（bottom 锚定时 picker 下沿贴 @ 上方）
    position?: { x: number; top?: number; bottom?: number }
    members: GroupMemberLite[] // 当前群的成员列表
    searchText?: string // @ 后输入的过滤文本
    canAtAll?: boolean // 当前用户是否能 @ 全员（群主 / 管理员），父组件按角色算好传入
  }>(),
  {
    searchText: '',
    position: () => ({ x: 0, bottom: 0 })
  }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  select: [member: GroupMemberLite]
}>()

const scrollRef = useTemplateRef<InstanceType<typeof ElScrollbar>>('scrollRef')
const activeIdx = ref(0)

/** 当前登录用户 id（成员列表过滤掉自己） */
const selfUserId = computed(() => getCurrentUserId())

/**
 * 虚拟"所有人"项：群主 / 管理员（canAtAll=true）+ 关键字命中"所有人"前缀时存在
 *
 * MessageInput 走 token data-id 收集 atUserIds，不依赖文案字符串；
 * 这里的 userId / 文案都从 im/utils/constants 取，避免散落
 */
const allItem = computed<GroupMemberLite | null>(() => {
  if (!props.canAtAll) {
    return null
  }
  if (!IM_AT_ALL_NICKNAME.startsWith(props.searchText)) {
    return null
  }
  // @所有人 是个伪成员，nickname 给 IM_AT_ALL_NICKNAME 让头像 :name 行为对齐普通成员
  return {
    userId: IM_AT_ALL_USER_ID,
    showName: IM_AT_ALL_NICKNAME,
    nickname: IM_AT_ALL_NICKNAME
  }
})

/** 真成员：过滤自己 / 退群 / 不匹配关键字；不截断数量，浮层 max-height + el-scrollbar 撑滚动 */
const memberItems = computed<GroupMemberLite[]>(() =>
  props.members.filter(
    (member) =>
      member.userId !== selfUserId.value &&
      member.status !== CommonStatusEnum.DISABLE &&
      !!member.showName &&
      member.showName.startsWith(props.searchText)
  )
)

/** 键盘导航与 pickActive 走的扁平列表，allItem 在前、memberItems 在后 */
const showMembers = computed<GroupMemberLite[]>(() => {
  return allItem.value ? [allItem.value, ...memberItems.value] : memberItems.value
})

/** 候选列表变化（用户输入关键词在过滤）→ 重置高亮到首项 + 滚回顶 */
watch(showMembers, (list) => {
  activeIdx.value = list.length > 0 ? 0 : -1
  scrollToTop()
})

/** 浮层重新打开 → 重置高亮 + 滚回顶（避免上次的中间状态残留） */
watch(
  () => props.visible,
  (v) => {
    if (v) {
      activeIdx.value = showMembers.value.length > 0 ? 0 : -1
      scrollToTop()
    }
  }
)

/** el-scrollbar 没暴露 scrollTo，直接拿内部 wrap 调 scrollTop */
function scrollToTop() {
  const scrollWrap = scrollRef.value?.$el?.querySelector(
    '.el-scrollbar__wrap'
  ) as HTMLElement | null
  if (scrollWrap) {
    scrollWrap.scrollTop = 0
  }
}

/** 键盘上下导航时把高亮项滚到可视区：超出底边下推、超出顶边上拉，否则不动 */
function scrollToActive() {
  const scrollWrap = scrollRef.value?.$el?.querySelector(
    '.el-scrollbar__wrap'
  ) as HTMLElement | null
  if (!scrollWrap) {
    return
  }
  const itemHeight = 40
  const activeOffsetTop = activeIdx.value * itemHeight
  if (activeOffsetTop + itemHeight > scrollWrap.scrollTop + scrollWrap.clientHeight) {
    scrollWrap.scrollTop = activeOffsetTop + itemHeight - scrollWrap.clientHeight
  } else if (activeOffsetTop < scrollWrap.scrollTop) {
    scrollWrap.scrollTop = activeOffsetTop
  }
}

/** 选中一项：emit 给 MessageInput 落 token，同时关掉浮层 */
function handleSelect(member: GroupMemberLite) {
  emit('select', member)
  emit('update:visible', false)
}

// 暴露给父组件的键盘导航方法
defineExpose({
  moveUp() {
    if (activeIdx.value > 0) {
      activeIdx.value--
      scrollToActive()
    }
  },
  moveDown() {
    if (activeIdx.value < showMembers.value.length - 1) {
      activeIdx.value++
      scrollToActive()
    }
  },
  pickActive() {
    if (activeIdx.value >= 0 && showMembers.value[activeIdx.value]) {
      handleSelect(showMembers.value[activeIdx.value])
    }
  },
  hasCandidates: () => showMembers.value.length > 0
})
</script>
