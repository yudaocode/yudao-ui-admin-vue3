<template>
  <!-- 笔记详情 -->
  <Dialog v-model="dialogVisible" title="笔记详情" width="800px" :loading="loading">
    <el-descriptions v-if="note" :column="1" border class="note-detail">
      <el-descriptions-item label="笔记标题">{{ note.title }}</el-descriptions-item>
      <el-descriptions-item label="创建人">{{ note.creatorUserName }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(note.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="笔记目录">{{ note.categoryName }}</el-descriptions-item>
      <el-descriptions-item label="笔记类型">
        <dict-tag :type="DICT_TYPE.OA_NOTE_TYPE" :value="note.type" />
      </el-descriptions-item>
      <el-descriptions-item label="优先级">
        <dict-tag :type="DICT_TYPE.OA_PRIORITY" :value="note.priority" />
      </el-descriptions-item>
      <el-descriptions-item label="共享给">
        {{ note.receiverUserNames?.join('、') }}
      </el-descriptions-item>
      <el-descriptions-item label="笔记内容">
        <div v-dompurify-html="note.content || ''" class="min-h-120px"></div>
      </el-descriptions-item>
      <el-descriptions-item label="附件">
        <el-link
          v-for="(url, index) in note.fileUrls"
          :key="url"
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          type="primary"
          class="mr-10px"
        >
          附件 {{ index + 1 }}
        </el-link>
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as NoteApi from '@/api/oa/note'

defineOptions({ name: 'OaNoteDetail' })

const dialogVisible = ref(false) // 弹窗是否显示
const loading = ref(false) // 详情加载中
const note = ref<NoteApi.OaNoteVO>() // 笔记详情

/** 打开笔记详情 */
async function open(id: number) {
  dialogVisible.value = true
  note.value = undefined
  loading.value = true
  try {
    // 查询详情，由后端校验当前用户是否有权访问
    note.value = await NoteApi.getNote(id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>

<style scoped lang="scss">
.note-detail {
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
