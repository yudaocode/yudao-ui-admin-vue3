<template>
  <div>
    <!-- 分类导航 -->
    <div
      class="mb-12px flex items-center justify-between gap-8px border-b border-[var(--el-border-color-lighter)] pb-12px font-semibold"
    >
      <span>分类</span>
      <el-button type="primary" link @click="emit('manage')">管理分类</el-button>
    </div>
    <el-menu
      class="!border-r-0"
      :default-active="String(categoryId ?? 'all')"
      aria-label="笔记分类"
      @select="handleCategorySelect"
    >
      <el-menu-item
        class="my-4px !h-40px rounded !px-12px !leading-40px [&.is-active]:bg-[var(--el-color-primary-light-9)] [&.is-active]:font-semibold"
        index="all"
      >
        最近
      </el-menu-item>
      <el-menu-item
        class="my-4px !h-40px rounded !px-12px !leading-40px [&.is-active]:bg-[var(--el-color-primary-light-9)] [&.is-active]:font-semibold"
        v-for="category in categories"
        :key="category.id"
        :index="String(category.id)"
      >
        <span class="truncate" :title="category.name">{{ category.name }}</span>
      </el-menu-item>
    </el-menu>

    <!-- 类型导航，与分类组合筛选 -->
    <el-divider class="!my-16px" />
    <div class="mb-12px font-semibold">类型</div>
    <el-menu
      class="!border-r-0"
      :default-active="String(type ?? 'all')"
      aria-label="笔记类型"
      @select="handleTypeSelect"
    >
      <el-menu-item
        class="my-4px !h-40px rounded !px-12px !leading-40px [&.is-active]:bg-[var(--el-color-primary-light-9)] [&.is-active]:font-semibold"
        index="all"
      >
        全部类型
      </el-menu-item>
      <el-menu-item
        class="my-4px !h-40px rounded !px-12px !leading-40px [&.is-active]:bg-[var(--el-color-primary-light-9)] [&.is-active]:font-semibold"
        v-for="dict in getIntDictOptions(DICT_TYPE.OA_NOTE_TYPE)"
        :key="dict.value"
        :index="String(dict.value)"
      >
        {{ dict.label }}
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import type { OaNoteCategoryVO } from '@/api/oa/note/category'

defineOptions({ name: 'OaNoteSidebar' })

defineProps<{
  categories: OaNoteCategoryVO[] // 本人的分类列表
  categoryId?: number // 当前分类编号
  type?: number // 当前笔记类型
}>()

const emit = defineEmits<{
  categorySelect: [index: string]
  typeSelect: [index: string]
  manage: []
}>() // 筛选和管理操作交由列表页处理

/** 切换分类 */
function handleCategorySelect(index: string) {
  emit('categorySelect', index)
}

/** 切换类型 */
function handleTypeSelect(index: string) {
  emit('typeSelect', index)
}
</script>
