<template>
  <!--
    @ 成员选择浮层
    - 父组件通过 v-model:visible 控制显隐，searchText 过滤
    - 父组件通过 ref 调 moveUp / moveDown / pickActive 实现键盘上下 + Enter 选中
    - @select 发射被选中的成员
  -->
  <el-scrollbar
    v-show="visible && showMembers.length > 0"
    ref="scrollRef"
    class="fixed z-100 w-50 h-75 rounded-md bg-[var(--el-bg-color)] shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
    :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
  >
    <ChatGroupMember
      v-for="(m, idx) in showMembers"
      :key="m.userId"
      :member="m"
      :height="40"
      :active="activeIdx === idx"
      :clickable="false"
      @click.stop="handleSelect(m)"
    />
  </el-scrollbar>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from 'vue'
import { ElScrollbar } from 'element-plus'

import { useUserStore } from '@/store/modules/user'
import ChatGroupMember, { type GroupMemberLite } from '../ChatGroupMember.vue'

defineOptions({ name: 'ImMentionPicker' })

const props = withDefaults(
  defineProps<{
    visible: boolean // 是否显示
    pos: { x: number; y: number } // 浮层位置（一般贴在 @ 符号上方）
    members: GroupMemberLite[] // 当前群的成员列表
    searchText?: string // @ 后输入的过滤文本
    ownerId?: number // 群主 id，判断是否能展示"全体成员"
  }>(),
  {
    searchText: '',
    pos: () => ({ x: 0, y: 0 })
  }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  select: [member: GroupMemberLite]
}>()

const userStore = useUserStore()
const scrollRef = useTemplateRef<InstanceType<typeof ElScrollbar>>('scrollRef')
const activeIdx = ref(0)

/** 当前登录用户 id（群成员过滤掉自己） */
const selfUserId = computed(() => Number(userStore.getUser?.id) || 0)

/** 是否群主（只有群主能 @ 全体成员） */
const isOwner = computed(() => {
  return props.ownerId != null && props.ownerId === selfUserId.value
})

/** 过滤后的显示列表（最多 100 条） */
const showMembers = computed<GroupMemberLite[]>(() => {
  const result: GroupMemberLite[] = []
  const keyword = props.searchText
  // 群主 + 关键字是"全体成员"前缀时，插入虚拟"全体成员"条目
  const allTag = '全体成员'
  if (isOwner.value && allTag.startsWith(keyword)) {
    result.push({ userId: -1, showNickName: allTag })
  }
  for (const m of props.members) {
    if (result.length > 100) {
      break
    }
    if (m.userId === selfUserId.value) {
      continue
    }
    if (m.quit) {
      continue
    }
    if (m.showNickName && m.showNickName.startsWith(keyword)) {
      result.push(m)
    }
  }
  return result
})

watch(showMembers, (list) => {
  activeIdx.value = list.length > 0 ? 0 : -1
  scrollToTop()
})

watch(
  () => props.visible,
  (v) => {
    if (v) {
      activeIdx.value = showMembers.value.length > 0 ? 0 : -1
      scrollToTop()
    }
  }
)

function scrollToTop() {
  const wrap = scrollRef.value?.$el?.querySelector('.el-scrollbar__wrap') as HTMLElement | null
  if (wrap) {
    wrap.scrollTop = 0
  }
}

function scrollToActive() {
  const wrap = scrollRef.value?.$el?.querySelector('.el-scrollbar__wrap') as HTMLElement | null
  if (!wrap) {
    return
  }
  const itemH = 40
  const activeTop = activeIdx.value * itemH
  if (activeTop + itemH > wrap.scrollTop + wrap.clientHeight) {
    wrap.scrollTop = activeTop + itemH - wrap.clientHeight
  } else if (activeTop < wrap.scrollTop) {
    wrap.scrollTop = activeTop
  }
}

function handleSelect(m: GroupMemberLite) {
  emit('select', m)
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

