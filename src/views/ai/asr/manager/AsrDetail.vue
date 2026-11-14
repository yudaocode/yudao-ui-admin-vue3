<!-- AI 语音识别管理：详情弹窗；只查看，不提供重新识别 -->
<template>
  <Dialog v-model="dialogVisible" title="识别详情" width="900px">
    <el-descriptions v-loading="loading" :column="2" :label-width="120" border>
      <el-descriptions-item label="编号">{{ detail.id }}</el-descriptions-item>
      <el-descriptions-item label="用户">{{ detail.userNickname || '-' }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <template v-if="detail.status !== undefined">
          {{ detail.status === AiAsrStatusEnum.SUCCESS ? '识别成功' : '识别失败' }}
        </template>
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="平台">
        <dict-tag v-if="detail.platform" :type="DICT_TYPE.AI_PLATFORM" :value="detail.platform" />
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="模型">
        {{ detail.modelName || detail.model || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="耗时">
        {{ formatAsrDuration(detail.duration) }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ detail.createTime ? formatDate(detail.createTime) : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ detail.updateTime ? formatDate(detail.updateTime) : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="文件名" :span="2">{{ detail.fileName || '-' }}</el-descriptions-item>
      <el-descriptions-item
        v-if="detail.status === AiAsrStatusEnum.FAIL"
        label="失败原因"
        :span="2"
      >
        <span class="text-[var(--el-color-danger)]">{{ detail.errorMessage || '-' }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="音频" :span="2">
        <audio v-if="detail.audioUrl" :src="detail.audioUrl" controls class="w-full"></audio>
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="识别原文" :span="2">
        <div
          v-if="detail.originalText"
          class="max-h-240px overflow-y-auto whitespace-pre-wrap leading-20px"
        >
          {{ detail.originalText }}
        </div>
        <span v-else>-</span>
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { AsrApi, AsrVO } from '@/api/ai/asr'
import { AiAsrStatusEnum } from '@/views/ai/utils/constants'

/** AI 语音识别管理：详情弹窗 */
defineOptions({ name: 'AiAsrDetail' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 加载中
const detail = ref<Partial<AsrVO>>({}) // 详情数据

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  detail.value = {}
  loading.value = true
  try {
    const data = await AsrApi.getAsr(id)
    // 打开期间被删除时，后端返回空
    if (!data) {
      message.warning('识别记录不存在或已删除')
      dialogVisible.value = false
      return
    }
    detail.value = data
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 识别耗时：毫秒转秒 */
const formatAsrDuration = (duration?: number) => {
  if (duration === undefined || duration === null) {
    return '-'
  }
  return `${(duration / 1000).toFixed(1)} 秒`
}
</script>
