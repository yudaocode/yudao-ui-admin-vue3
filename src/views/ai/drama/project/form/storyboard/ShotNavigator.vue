<!-- AI 短剧：镜头导航，按原文场次分组；点击直接切换镜头 -->
<template>
  <div class="flex flex-col gap-8px">
    <el-select v-model="sceneFilter" placeholder="全部场次" clearable size="small">
      <el-option v-for="group in groups" :key="group.key" :label="group.label" :value="group.key" />
    </el-select>
    <div class="text-12px text-[var(--el-text-color-secondary)]">
      视频已完成 {{ successCount }} / {{ storyboards.length }}
    </div>
    <div v-for="group in visibleGroups" :key="group.key">
      <div class="mb-4px flex items-center text-12px text-[var(--el-text-color-secondary)]">
        <span class="flex-1 truncate">{{ group.label }}</span>
        <span>{{ group.items.length }} 镜</span>
      </div>
      <div
        v-for="item in group.items"
        :key="item.id"
        class="mb-4px cursor-pointer border border-solid rounded-4px px-8px py-6px"
        :class="
          item.id === modelValue
            ? 'border-[var(--el-color-primary)] bg-[var(--el-color-primary-light-9)]'
            : 'border-[var(--el-border-color-lighter)] hover:border-[var(--el-color-primary-light-5)]'
        "
        @click="emit('update:modelValue', item.id)"
      >
        <div class="flex items-center gap-6px text-13px">
          <span class="font-500">镜 {{ item.sceneNo }}</span>
          <span class="flex-1 truncate">{{ item.title || '未命名镜头' }}</span>
        </div>
        <div
          class="mt-2px flex items-center gap-6px text-12px text-[var(--el-text-color-secondary)]"
        >
          <span>{{ item.duration ? `${item.duration} 秒` : '-' }}</span>
          <div class="flex-1"></div>
          <dict-tag
            v-if="item.videoStatus"
            :type="DICT_TYPE.AI_DRAMA_STATUS"
            :value="item.videoStatus"
          />
          <span v-else>未生成</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DramaLocationVO } from '@/api/ai/drama/asset'
import { DramaStoryboardVO } from '@/api/ai/drama/storyboard'
import { DICT_TYPE } from '@/utils/dict'
import { AiDramaStatusEnum } from '@/views/ai/utils/constants'

/** AI 短剧：镜头导航 */
defineOptions({ name: 'AiDramaShotNavigator' })

const props = defineProps<{
  modelValue?: number // 选中的镜头编号
  storyboards: DramaStoryboardVO[]
  locations: DramaLocationVO[]
}>()
const emit = defineEmits<{ 'update:modelValue': [id: number] }>()

const sceneFilter = ref<string>()

const successCount = computed(
  () =>
    props.storyboards.filter(
      (item) => item.videoStatus === AiDramaStatusEnum.SUCCESS && item.videoUrl
    ).length
)

/**
 * 按原文场次分组：取规划时记录的场次（连续性设置的 sceneNumber），按镜头顺序连续归组；
 * 没有场次的镜头（手动新增、旧数据）归入「未分场」
 */
const groups = computed(() => {
  const result: { key: string; label: string; items: DramaStoryboardVO[] }[] = []
  props.storyboards.forEach((item) => {
    const sceneNumber = item.continuity?.sceneNumber
    const key = sceneNumber ? `scene-${sceneNumber}` : 'none'
    let group = result.find((group) => group.key === key)
    if (!group) {
      const location = props.locations.find((location) => location.id === item.locationId)
      const label = sceneNumber
        ? `场 ${sceneNumber}${location ? ` · ${location.name}` : ''}`
        : '未分场'
      group = { key, label, items: [] }
      result.push(group)
    }
    group.items.push(item)
  })
  return result
})
const visibleGroups = computed(() =>
  sceneFilter.value ? groups.value.filter((group) => group.key === sceneFilter.value) : groups.value
)
</script>
