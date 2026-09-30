<template>
  <ContentWrap v-if="storage">
    <div class="mb-12px text-14px font-bold">云盘概览</div>
    <div class="grid grid-cols-2 gap-24px lg:grid-cols-4">
      <div>
        <div class="mb-4px text-12px text-gray-500">我的文件</div>
        <div class="text-20px font-bold leading-28px">{{ storage.fileCount }}</div>
      </div>
      <div>
        <div class="mb-4px text-12px text-gray-500">我共享的</div>
        <div class="text-20px font-bold leading-28px">{{ storage.sharedCount }}</div>
      </div>
      <div>
        <div class="mb-4px text-12px text-gray-500">共享给我的</div>
        <div class="text-20px font-bold leading-28px">{{ storage.receivedCount }}</div>
      </div>
      <div>
        <div class="mb-4px text-12px text-gray-500">存储空间</div>
        <div class="flex h-28px flex-col justify-center gap-4px">
          <div class="text-12px leading-16px">
            {{ formatFileSize(storage.usedSize) }} / {{ formatFileSize(storage.totalSize) }}
          </div>
          <el-progress
            :percentage="Math.min(100, (storage.usedSize / storage.totalSize) * 100)"
            :show-text="false"
            :stroke-width="4"
          />
        </div>
      </div>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import * as NodeApi from '@/api/oa/file/node'
import { formatFileSize } from '@/utils/file'

defineOptions({ name: 'OaFileStorage' })

const storage = ref<NodeApi.OaFileStorageVO>() // 云盘容量与共享统计

/** 查询云盘概览 */
async function getStorage() {
  storage.value = await NodeApi.getFileStorage()
}
defineExpose({ getStorage }) // 文件发生变化时，由列表刷新概览

/** 初始化 */
onMounted(() => {
  getStorage()
})
</script>
