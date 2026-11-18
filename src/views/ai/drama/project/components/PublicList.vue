<!-- AI 短剧：公开广场，展示管理员公开的成片 -->
<template>
  <div>
    <div class="mb-14px flex flex-wrap items-center gap-8px">
      <el-input
        v-model="queryParams.keyword"
        placeholder="搜索名称、画风"
        clearable
        class="!w-200px"
        @keyup.enter="handleQuery"
        @clear="handleQuery"
      >
        <template #prefix><Icon icon="ep:search" /></template>
      </el-input>
      <el-select
        v-model="queryParams.aspectRatio"
        placeholder="全部画幅"
        clearable
        class="!w-130px"
        @change="handleQuery"
      >
        <el-option v-for="item in DRAMA_ASPECT_RATIOS" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select
        v-model="queryParams.durationType"
        placeholder="全部时长"
        clearable
        class="!w-130px"
        @change="handleQuery"
      >
        <el-option
          v-for="item in DRAMA_DURATION_TYPES"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <div v-loading="loading" class="min-h-200px">
      <el-empty v-if="!loading && list.length === 0" description="暂无公开的短剧" />
      <div class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-16px">
        <el-card
          v-for="item in list"
          :key="item.id"
          shadow="hover"
          :body-style="{ padding: '0' }"
          class="cursor-pointer"
          @click="detailRef.open(item.id)"
        >
          <div class="relative aspect-[3/4] overflow-hidden bg-black">
            <video
              :src="item.composeFileUrl"
              preload="metadata"
              muted
              class="h-full w-full object-contain"
            ></video>
            <span
              class="absolute bottom-6px right-6px rounded-4px bg-black/60 px-6px text-12px text-white"
            >
              {{ formatDramaDuration(item.composeDuration) }}
            </span>
          </div>
          <div class="p-10px">
            <div class="truncate font-500">{{ item.name }}</div>
            <div
              class="mt-4px flex justify-between text-12px text-[var(--el-text-color-secondary)]"
            >
              <span class="truncate">{{ item.userNickname || '-' }}</span>
              <span v-if="item.aspectRatio">{{ item.aspectRatio }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    <div class="mt-16px flex justify-end">
      <el-pagination
        v-model:current-page="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[12, 24, 48]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="getList"
        @current-change="getList"
      />
    </div>

    <PublicDetail ref="detailRef" />
  </div>
</template>

<script setup lang="ts">
import { DramaProjectApi, DramaPublicVO } from '@/api/ai/drama/project'
import {
  DRAMA_ASPECT_RATIOS,
  DRAMA_DURATION_TYPES,
  formatDramaDuration
} from '@/views/ai/utils/drama'
import PublicDetail from './PublicDetail.vue'

/** AI 短剧：公开广场 */
defineOptions({ name: 'AiDramaPublicList' })

const loading = ref(false) // 列表的加载中
const list = ref<DramaPublicVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 12,
  keyword: undefined as string | undefined,
  aspectRatio: undefined as string | undefined,
  durationType: undefined as number | undefined
})
const detailRef = ref() // 详情弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DramaProjectApi.getProjectPublicPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
defineExpose({ getList })

/** 搜索：回到第一页 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}
</script>
