<!-- AI 视频：作品列表 -->
<template>
  <div v-loading="loading" class="min-h-200px">
    <el-empty
      v-if="!loading && !list.length"
      :description="square ? '暂无公开作品' : '暂无作品，在左侧开始创作吧'"
    />
    <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-12px">
      <div
        v-for="item in list"
        :key="item.id"
        class="overflow-hidden border border-[var(--el-border-color-lighter)] rounded-8px border-solid bg-[var(--el-bg-color)]"
      >
        <!-- 视频 / 状态 -->
        <div class="relative aspect-video bg-[var(--el-fill-color-darker)]">
          <!-- TODO DONE @AI：这种折行，看看是不是去掉？/video>（保留：ESLint 的 vue/html-self-closing 要求 video 等普通 HTML 元素不能自闭合，属性多行时 Prettier 会把 ></video> 放在最后一行） -->
          <video
            v-if="item.status === AiVideoStatusEnum.SUCCESS && item.videoUrl"
            :src="item.videoUrl"
            :poster="item.coverUrl"
            controls
            preload="metadata"
            class="h-full w-full object-contain"
          ></video>
          <div
            v-else-if="isAiVideoRunning(item.status)"
            class="absolute inset-0 flex flex-col items-center justify-center gap-6px text-[var(--el-text-color-secondary)]"
          >
            <Icon icon="ep:loading" :size="24" class="is-loading text-[var(--el-color-primary)]" />
            <dict-tag :type="DICT_TYPE.AI_VIDEO_STATUS" :value="item.status" />
          </div>
          <div
            v-else
            class="absolute inset-0 flex flex-col items-center justify-center gap-6px px-12px text-center"
          >
            <Icon icon="ep:warning-filled" :size="24" class="text-[var(--el-color-danger)]" />
            <div
              class="line-clamp-3 text-12px text-[var(--el-color-danger)]"
              :title="item.errorMessage"
            >
              {{ item.errorMessage || '生成失败' }}
            </div>
          </div>
        </div>
        <!-- 信息 -->
        <div class="p-10px">
          <div class="mb-6px flex items-center gap-6px">
            <dict-tag :type="DICT_TYPE.AI_VIDEO_TYPE" :value="item.type" />
            <span
              class="truncate text-12px text-[var(--el-text-color-secondary)]"
              :title="item.model"
            >
              {{ item.model }}
            </span>
          </div>
          <div class="line-clamp-2 min-h-36px text-13px leading-18px" :title="item.prompt">
            {{ item.prompt || '（无提示词）' }}
          </div>
          <div
            class="mt-6px flex items-center justify-between text-12px text-[var(--el-text-color-secondary)]"
          >
            <span>{{ square ? item.userNickname || '-' : formatDate(item.createTime) }}</span>
            <span v-if="item.duration">{{ item.duration }} 秒</span>
          </div>
          <div class="mt-8px flex items-center justify-between">
            <div class="flex items-center gap-4px">
              <el-button link type="primary" @click="emit('detail', item)">详情</el-button>
              <el-button link type="primary" @click="emit('same', item)">做同款</el-button>
              <el-button
                v-if="!square"
                link
                type="danger"
                :disabled="isAiVideoRunning(item.status)"
                @click="emit('delete', item)"
              >
                删除
              </el-button>
            </div>
            <el-tag v-if="!square && item.publicStatus" type="success" size="small">已公开</el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { VideoVO } from '@/api/ai/video'
import { AiVideoStatusEnum, isAiVideoRunning } from '@/views/ai/utils/constants'

/** AI 视频：作品列表 */
defineOptions({ name: 'AiVideoList' })

withDefaults(
  defineProps<{
    list: VideoVO[]
    loading?: boolean
    square?: boolean // 是否公开作品：不展示删除、公开标记
  }>(),
  { loading: false, square: false }
)
const emit = defineEmits<{
  detail: [item: VideoVO]
  same: [item: VideoVO]
  delete: [item: VideoVO]
}>()
</script>
