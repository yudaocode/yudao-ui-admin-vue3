<!-- 联网搜索结果组件 -->
<template>
  <!-- 联网搜索结果列表 -->
  <div
    v-if="webSearchPages && webSearchPages.length > 0"
    class="mt-10px p-10px rounded-8px bg-[#f5f5f5]"
  >
    <!-- 标题栏：可点击展开/收起 -->
    <div
      class="text-14px text-[#666] mb-8px flex items-center justify-between cursor-pointer hover:text-[#409eff]"
      @click="toggleExpanded"
    >
      <div class="flex items-center">
        <Icon icon="ep:search" class="mr-5px" />
        联网搜索结果 ({{ webSearchPages.length }} 条)
      </div>
      <Icon
        :icon="isExpanded ? 'ep:arrow-up' : 'ep:arrow-down'"
        class="text-12px transition-transform duration-200"
      />
    </div>

    <!-- 可展开的搜索结果列表 -->
    <div v-show="isExpanded" class="flex flex-col gap-8px transition-all duration-200 ease-in-out">
      <div
        v-for="(result, index) in webSearchPages"
        :key="index"
        class="p-10px bg-white rounded-6px cursor-pointer transition-all hover:bg-[#e6f4ff]"
        @click="handleClick(result)"
      >
        <div class="flex items-start gap-8px">
          <!-- 网站图标 -->
          <div class="flex-shrink-0 w-16px h-16px mt-2px">
            <img
              v-if="result.icon"
              :src="result.icon"
              :alt="result.name"
              class="w-full h-full object-contain rounded-2px"
              @error="handleImageError"
            />
            <Icon v-else icon="ep:link" class="w-full h-full text-[#666]" />
          </div>

          <!-- 内容区域 -->
          <div class="flex-1 min-w-0">
            <!-- 标题和来源 -->
            <div class="flex items-center gap-4px mb-4px">
              <span class="text-12px text-[#999] truncate">{{ result.name }}</span>
            </div>

            <!-- 主标题 -->
            <div class="text-14px text-[#1a73e8] font-medium mb-4px line-clamp-2 leading-[1.4]">
              {{ result.title }}
            </div>

            <!-- 描述 -->
            <div class="text-13px text-[#666] line-clamp-2 leading-[1.4] mb-4px">
              {{ result.snippet }}
            </div>

            <!-- URL -->
            <div class="text-12px text-[#006621] truncate">
              {{ result.url }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 联网搜索详情弹窗 -->
  <el-popover
    v-model:visible="dialogVisible"
    :width="600"
    trigger="click"
    placement="top-start"
    :offset="55"
    popper-class="web-search-popover"
  >
    <template #reference>
      <div ref="resultRef"></div>
    </template>
    <template #default>
      <div v-if="selectedResult">
        <!-- 标题区域 -->
        <div class="flex items-start gap-8px mb-12px">
          <div class="flex-shrink-0 w-20px h-20px mt-2px">
            <img
              v-if="selectedResult.icon"
              :src="selectedResult.icon"
              :alt="selectedResult.name"
              class="w-full h-full object-contain rounded-2px"
              @error="handleImageError"
            />
            <Icon v-else icon="ep:link" class="w-full h-full text-[#666]" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-16px font-bold text-[#333] mb-4px line-clamp-2">
              {{ selectedResult.title }}
            </div>
            <div class="text-12px text-[#999] mb-4px">{{ selectedResult.name }}</div>
            <div class="text-12px text-[#006621] break-all">{{ selectedResult.url }}</div>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="max-h-[60vh] overflow-y-auto">
          <!-- 简短描述 -->
          <div class="mb-12px">
            <div class="text-14px font-medium text-[#333] mb-6px">简短描述</div>
            <div class="text-14px leading-[1.6] text-[#666] bg-[#f8f9fa] p-10px rounded-6px">
              {{ selectedResult.snippet }}
            </div>
          </div>

          <!-- 内容摘要 -->
          <div v-if="selectedResult.summary">
            <div class="text-14px font-medium text-[#333] mb-6px">内容摘要</div>
            <div
              class="text-14px leading-[1.6] text-[#333] bg-[#f8f9fa] p-10px rounded-6px whitespace-pre-wrap"
            >
              {{ selectedResult.summary }}
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-8px mt-12px pt-12px border-t border-[#eee]">
          <el-button size="small" @click="dialogVisible = false">关闭</el-button>
          <el-button type="primary" size="small" @click="openUrl(selectedResult.url)">
            访问原文
          </el-button>
        </div>
      </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
defineProps<{
  webSearchPages: {
    name: string // 名称
    icon: string // 图标
    title: string // 标题
    url: string // URL
    snippet: string // 内容的简短描述
    summary: string // 内容的文本摘要
  }[]
}>()

const isExpanded = ref(false) // 是否展开搜索结果
const selectedResult = ref<{
  name: string
  icon: string
  title: string
  url: string
  snippet: string
  summary: string
} | null>(null) // 选中的搜索结果
const dialogVisible = ref(false) // 详情弹窗
const resultRef = ref<HTMLElement>() // 详情弹窗 Ref

/** 切换展开/收起状态 */
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

/** 点击搜索结果处理 */
const handleClick = (result: any) => {
  selectedResult.value = result
  dialogVisible.value = true
}

/** 处理图片加载错误 */
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

/** 打开URL */
const openUrl = (url: string) => {
  window.open(url, '_blank')
}
</script>

<style scoped>
.web-search-popover {
  max-width: 600px;
}
</style>
