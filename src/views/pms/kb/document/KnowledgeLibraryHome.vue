<template>
  <!-- 知识库主页 -->
  <div class="mb-24px flex items-start justify-between gap-24px max-[900px]:flex-col">
    <div class="min-w-0 flex-1">
      <div class="truncate text-20px font-600">{{ library?.name }}</div>
      <div
        class="mt-10px max-w-720px rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-lighter)] px-16px py-12px text-14px text-[var(--el-text-color-secondary)] leading-[1.6]"
      >
        {{ library?.description || '暂无简介' }}
      </div>
    </div>
    <el-button class="!ml-auto shrink-0" type="primary" @click="emit('search')">
      <Icon icon="ep:search" />搜索文档
    </el-button>
    <!-- 知识库操作只在主页展示 -->
    <el-dropdown @command="handleMoreCommand">
      <el-button>更多</el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="collect">
            {{ library?.favoriteStatus ? '取消关注' : '关注' }}
          </el-dropdown-item>
          <el-dropdown-item
            v-if="writeStatus && library?.adminStatus"
            v-hasPermi="['pms:kb:library:update']"
            command="member"
          >
            成员管理
          </el-dropdown-item>
          <el-dropdown-item v-if="library?.exitStatus" command="exit" divided>
            退出知识库
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
  <el-tabs v-model="activeTab" class="mb-12px" @tab-change="handleTabChange">
    <el-tab-pane label="全部文档" name="all" />
    <el-tab-pane label="我关注的" name="favorite" />
  </el-tabs>
  <div v-loading="favoriteLoading">
    <el-table
      v-if="displayNodes.length"
      :data="displayNodes"
      :show-header="false"
      class="knowledge-content-table"
      @row-click="emit('node-click', $event)"
    >
      <el-table-column min-width="240">
        <template #default="scope">
          <div class="flex cursor-pointer items-center gap-8px">
            <Icon :icon="getKnowledgeTreeNodeIcon(scope.row)" />
            <span>{{ scope.row.label }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column align="right" width="100">
        <template #default="scope">
          <span class="text-12px text-[var(--el-text-color-secondary)]">
            {{ getKnowledgeTreeNodeTypeName(scope.row) }}
          </span>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else :description="activeTab === 'favorite' ? '暂无关注内容' : '暂无目录或文档'" />
  </div>
</template>

<script lang="ts" setup>
import type { PmsKnowledgeLibraryVO } from '@/api/pms/kb/library'
import type { PmsKnowledgeInteractionItemVO } from '@/api/pms/kb/interaction/favorite'
import { PmsKnowledgeObjectType } from '@/views/pms/kb/utils/constants'
import {
  getKnowledgeTreeNodeIcon,
  getKnowledgeTreeNodeTypeName,
  type KnowledgeTreeNode
} from './types'

defineOptions({ name: 'PmsKnowledgeLibraryHome' })

const props = defineProps<{
  library?: PmsKnowledgeLibraryVO
  treeData: KnowledgeTreeNode[]
  favoriteItems: PmsKnowledgeInteractionItemVO[]
  favoriteLoading: boolean
  writeStatus: boolean
}>() // 组件参数
const emit = defineEmits<{
  (event: 'collect'): void
  (event: 'exit'): void
  (event: 'member'): void
  (event: 'search'): void
  (event: 'node-click', node: KnowledgeTreeNode): void
  (event: 'tab-change', tab: 'all' | 'favorite'): void
}>() // 组件事件
const activeTab = ref<'all' | 'favorite'>('all') // 当前内容页签
const displayNodes = computed<KnowledgeTreeNode[]>(() => {
  if (activeTab.value === 'all') return props.treeData
  return props.favoriteItems
    .filter(
      (item) =>
        item.type === PmsKnowledgeObjectType.FOLDER ||
        item.type === PmsKnowledgeObjectType.DOCUMENT ||
        item.type === PmsKnowledgeObjectType.FILE
    )
    .map((item) => ({
      key: `${item.type === PmsKnowledgeObjectType.FOLDER ? 'folder' : 'document'}-${item.entityId}`,
      entityId: item.entityId,
      kind: item.type === PmsKnowledgeObjectType.FOLDER ? 'folder' : 'document',
      label: item.name,
      type: item.type,
      children: []
    }))
}) // 当前页签展示内容

/** 处理更多操作 */
function handleMoreCommand(command: 'collect' | 'member' | 'exit') {
  if (command === 'collect') {
    emit('collect')
  } else if (command === 'member') {
    emit('member')
  } else {
    emit('exit')
  }
}

/** 切换内容页签 */
function handleTabChange(tab: string | number) {
  emit('tab-change', tab === 'favorite' ? 'favorite' : 'all')
}
</script>

<style lang="scss" scoped>
:deep(.knowledge-content-table .el-table__row) {
  height: 48px;
  font-size: 14px;
  cursor: pointer;
}
</style>
