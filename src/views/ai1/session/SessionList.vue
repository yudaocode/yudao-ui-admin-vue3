<!-- AI1 会话列表 -->
<template>
  <el-aside
    width="260px"
    class="h-full flex flex-col overflow-hidden border-r border-r-[var(--el-border-color-light)] border-r-solid bg-[var(--el-bg-color-page)]"
  >
    <!-- Agent 选择 -->
    <div class="border-b border-b-[var(--el-border-color-lighter)] border-b-solid p-12px">
      <el-select
        :model-value="agentId"
        placeholder="请选择 Agent"
        filterable
        :loading="agentLoading"
        class="!w-1/1"
        @change="(value: number) => emit('agent-change', value)"
      >
        <el-option v-for="item in agentList" :key="item.id" :label="item.name" :value="item.id!">
          <div class="flex items-center justify-between gap-8px">
            <span class="truncate">{{ item.name }}</span>
            <span class="text-12px text-[var(--el-text-color-secondary)] truncate">
              {{ item.modelName }}
            </span>
          </div>
        </el-option>
      </el-select>
      <div
        v-if="agent"
        class="mt-10px border border-[var(--el-border-color-lighter)] border-solid rounded-8px bg-[var(--el-bg-color)] px-12px py-10px text-13px"
      >
        <div class="flex items-center justify-between gap-8px">
          <span class="font-bold truncate">{{ agent.name }}</span>
          <el-tag v-if="agent.modelName" size="small" type="info" class="max-w-120px">
            <span class="truncate">{{ agent.modelName }}</span>
          </el-tag>
        </div>
        <div
          v-if="agent.introduction"
          class="line-clamp-3 mt-6px text-12px leading-[1.6] text-[var(--el-text-color-secondary)]"
          :title="agent.introduction"
        >
          {{ agent.introduction }}
        </div>
      </div>
      <el-button
        type="primary"
        plain
        class="!w-1/1 mt-10px"
        :disabled="!agentId"
        @click="emit('create')"
      >
        <Icon icon="ep:plus" class="mr-5px" /> 新会话
      </el-button>
    </div>

    <!-- 会话列表 -->
    <div class="px-16px pt-12px pb-4px text-12px text-[var(--el-text-color-secondary)]">
      我的会话
    </div>
    <div v-loading="loading" class="min-h-0 flex-1 overflow-y-auto px-8px pb-8px pt-4px">
      <div
        v-for="item in sessionList"
        :key="item.id"
        class="group mb-4px flex cursor-pointer items-center gap-8px rounded-6px px-12px py-10px"
        :class="
          item.id === activeId
            ? 'bg-[var(--el-color-primary-light-9)] text-[var(--el-color-primary)]'
            : 'text-[var(--el-text-color-regular)] hover:bg-[var(--el-fill-color-light)]'
        "
        @click="emit('select', item)"
      >
        <!-- 编辑标题 -->
        <el-input
          v-if="editingId === item.id"
          :ref="setTitleInputRef"
          v-model="editingTitle"
          size="small"
          maxlength="50"
          class="flex-1"
          @click.stop
          @keyup.enter="saveTitle(item)"
          @keyup.esc="cancelEditTitle"
          @blur="saveTitle(item)"
        />
        <template v-else>
          <span class="flex-1 truncate text-13px" :title="item.title">{{ item.title }}</span>
          <Icon
            icon="ep:edit-pen"
            class="invisible flex-shrink-0 cursor-pointer group-hover:visible hover:text-[var(--el-color-primary)]"
            @click.stop="startEditTitle(item)"
          />
          <Icon
            icon="ep:delete"
            class="invisible flex-shrink-0 cursor-pointer group-hover:visible hover:text-[var(--el-color-primary)]"
            @click.stop="emit('delete', item)"
          />
        </template>
      </div>
      <el-empty
        v-if="!loading && sessionList.length === 0"
        description="暂无会话"
        :image-size="60"
      />
    </div>

    <!-- 底部：全屏切换 -->
    <div
      class="flex items-center justify-end border-t border-t-[var(--el-border-color-lighter)] border-t-solid px-16px py-10px"
    >
      <Icon
        :icon="fullscreen ? 'zmdi:fullscreen-exit' : 'zmdi:fullscreen'"
        :size="18"
        class="cursor-pointer text-[var(--el-text-color-secondary)] hover:text-[var(--el-color-primary)]"
        :title="fullscreen ? '退出全屏' : '全屏'"
        @click="emit('toggle-fullscreen')"
      />
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import type { Agent } from '@/api/ai1/agent'
import type { Session } from '@/api/ai1/session'

defineOptions({ name: 'Ai1SessionList' })

defineProps<{
  agentList: Agent[] // Agent 列表
  agentLoading: boolean // Agent 列表加载中
  agentId?: number // 当前选中的 Agent 编号
  agent?: Agent // 当前选中的 Agent
  sessionList: Session[] // 会话列表
  loading: boolean // 会话列表加载中
  activeId?: number // 当前选中的会话编号
  fullscreen: boolean // 是否全屏
}>()

const emit = defineEmits<{
  'agent-change': [agentId: number] // 切换 Agent
  create: [] // 新会话
  select: [session: Session] // 选中会话
  rename: [session: Session, title: string] // 修改会话标题
  delete: [session: Session] // 删除会话
  'toggle-fullscreen': [] // 切换全屏
}>()

// ==================== 标题编辑 ====================

const editingId = ref<number>() // 正在编辑标题的会话编号
const editingTitle = ref('') // 编辑中的标题
const titleInputRef = ref() // 标题输入框 Ref

/** 记录标题输入框 */
const setTitleInputRef = (el: any) => {
  titleInputRef.value = el
}

/** 编辑标题 */
const startEditTitle = async (session: Session) => {
  editingId.value = session.id
  editingTitle.value = session.title
  await nextTick()
  titleInputRef.value?.focus()
}

/** 保存标题 */
const saveTitle = (session: Session) => {
  if (editingId.value !== session.id) {
    return
  }
  const title = editingTitle.value.trim()
  cancelEditTitle()
  if (!title || title === session.title) {
    return
  }
  emit('rename', session, title)
}

/** 取消标题编辑 */
const cancelEditTitle = () => {
  editingId.value = undefined
  editingTitle.value = ''
}
</script>
