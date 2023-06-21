<template>
  <el-table :data="props.list" stripe border v-loading="props.loading" style="margin-top: 10px">
    <el-table-column label="编号" align="center" prop="mediaId" />
    <el-table-column label="文件名" align="center" prop="name" />
    <el-table-column label="语音" align="center">
      <template #default="scope">
        <WxVoicePlayer v-if="scope.row.url" :url="scope.row.url" />
      </template>
    </el-table-column>
    <el-table-column
      label="上传时间"
      align="center"
      prop="createTime"
      :formatter="dateFormatter"
      width="180"
    >
      <template #default="scope">
        <span>{{ scope.row.createTime }}</span>
      </template>
    </el-table-column>
    <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
      <template #default="scope">
        <el-button type="primary" link @click="emit('delete', scope.row.id)">
          <Icon icon="ep:download" />下载
        </el-button>
        <el-button
          type="primary"
          link
          @click="emit('delete', scope.row.id)"
          v-hasPermi="['mp:material:delete']"
        >
          <Icon icon="ep:delete" />删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import WxVoicePlayer from '@/views/mp/components/wx-voice-play'
import { dateFormatter } from '@/utils/formatTime'

const props = defineProps<{
  list: any[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'delete', v: number)
}>()
</script>
