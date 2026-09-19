<template>
  <!-- 公告详情 -->
  <Dialog v-model="dialogVisible" title="公告详情" width="780px">
    <el-descriptions v-loading="loading" :column="1" border class="announcement-detail">
      <el-descriptions-item label="公告标题">{{ announcement?.title }}</el-descriptions-item>
      <el-descriptions-item label="发布人">
        {{ announcement?.publisherUserName }}
      </el-descriptions-item>
      <el-descriptions-item label="发布时间">
        {{ formatDate(announcement?.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="所属部门">
        {{ announcement?.publisherDeptName }}
      </el-descriptions-item>
      <el-descriptions-item label="公告类型">
        <dict-tag :type="DICT_TYPE.OA_ANNOUNCEMENT_TYPE" :value="announcement?.type ?? ''" />
      </el-descriptions-item>
      <el-descriptions-item label="优先级">
        <dict-tag
          v-if="announcement"
          :type="DICT_TYPE.OA_PRIORITY"
          :value="announcement.priority"
        />
      </el-descriptions-item>
      <el-descriptions-item label="公告内容">
        <div class="min-h-120px" v-dompurify-html="announcement?.content || ''"></div>
      </el-descriptions-item>
      <el-descriptions-item label="相关链接">
        <el-link v-if="announcement?.url" :href="announcement.url" target="_blank" type="primary">
          打开链接
        </el-link>
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import * as AnnouncementApi from '@/api/oa/announcement'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'OaAnnouncementDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 详情的加载中
const announcement = ref<AnnouncementApi.OaAnnouncementVO>() // 公告详情

const emit = defineEmits<{ read: [id: number] }>() // 定义 read 事件，用于同步列表阅读状态

/** 打开公告详情 */
async function open(id: number, markAsRead = false) {
  dialogVisible.value = true
  announcement.value = undefined
  loading.value = true
  try {
    // 查询公告详情
    const data: AnnouncementApi.OaAnnouncementVO = await AnnouncementApi.getAnnouncement(id)
    announcement.value = data
    // 接收人阅读未读公告时，同步阅读状态
    if (markAsRead && !data.readStatus) {
      await AnnouncementApi.updateAnnouncementReadStatus(id)
      data.readStatus = true
      emit('read', id)
    }
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>

<style scoped lang="scss">
.announcement-detail {
  :deep(.el-descriptions__table) {
    table-layout: fixed;
  }

  :deep(.el-descriptions__label) {
    width: 100px;
    white-space: nowrap;
  }

  :deep(.el-descriptions__content) {
    overflow-wrap: anywhere;
  }
}
</style>
