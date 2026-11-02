<template>
  <Dialog v-model="dialogVisible" :max-height="600" :scroll="true" title="请求日志详情" width="860">
    <el-descriptions v-loading="detailLoading" :column="2" border>
      <el-descriptions-item label="日志编号" min-width="120">
        {{ detailData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="状态" min-width="120">
        <dict-tag :type="DICT_TYPE.AI_REQUEST_LOG_STATUS" :value="detailData.status" />
      </el-descriptions-item>
      <el-descriptions-item label="请求编号" :span="2">
        <span class="break-all font-mono">{{ detailData.requestId }}</span>
        <el-button
          v-if="detailData.requestId"
          link
          type="primary"
          class="ml-8px"
          @click="copyRequestId(detailData.requestId)"
        >
          <Icon icon="ep:copy-document" class="mr-3px" /> 复制
        </el-button>
      </el-descriptions-item>
      <el-descriptions-item label="业务类型">
        <dict-tag :type="DICT_TYPE.AI_REQUEST_LOG_BIZ_TYPE" :value="detailData.bizType" />
      </el-descriptions-item>
      <el-descriptions-item label="业务编号">
        {{ detailData.bizId }}
      </el-descriptions-item>
      <el-descriptions-item label="用户编号" :span="2">
        {{ detailData.userId }}
      </el-descriptions-item>
      <el-descriptions-item label="模型平台">
        <dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="detailData.platform" />
      </el-descriptions-item>
      <el-descriptions-item label="模型编号">
        {{ detailData.modelId }}
      </el-descriptions-item>
      <el-descriptions-item label="模型标识" :span="2">
        {{ detailData.model }}
      </el-descriptions-item>
      <el-descriptions-item label="请求时间" :span="2">
        {{ formatDate(detailData.beginTime) }} ~ {{ formatDate(detailData.endTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="请求耗时" :span="2">
        {{ detailData.duration }} ms
      </el-descriptions-item>
      <el-descriptions-item v-if="detailData.errorMessage" label="错误信息" :span="2">
        <span class="whitespace-pre-wrap break-all text-[var(--el-color-danger)]">
          {{ detailData.errorMessage }}
        </span>
      </el-descriptions-item>
      <el-descriptions-item label="输入 Token">
        {{ formatTokenCount(detailData.inputTokens) }}
      </el-descriptions-item>
      <el-descriptions-item label="输出 Token">
        {{ formatTokenCount(detailData.outputTokens) }}
      </el-descriptions-item>
      <el-descriptions-item label="合计 Token" :span="2">
        {{ formatTokenCount(detailData.totalTokens) }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间" :span="2">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-collapse class="mt-12px">
      <el-collapse-item name="responseMetadata">
        <template #title>
          <span>响应元数据</span>
          <span v-if="!metadataText" class="ml-8px text-[var(--el-text-color-secondary)]">
            （未取得）
          </span>
        </template>
        <pre
          v-if="metadataText"
          v-text="metadataText"
          class="m-0 max-h-360px overflow-auto whitespace-pre rounded-4px bg-[var(--el-fill-color-light)] p-12px font-mono text-12px leading-normal"
        ></pre>
        <el-empty v-else :image-size="60" description="未取得响应元数据" />
      </el-collapse-item>
    </el-collapse>
  </Dialog>
</template>

<script lang="ts" setup>
import { useClipboard } from '@vueuse/core'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { RequestLogApi, RequestLogVO } from '@/api/ai/requestlog'
import { formatTokenCount } from '@/views/ai/utils/format'

defineOptions({ name: 'AiRequestLogDetail' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 详情的加载中
const detailData = ref({} as RequestLogVO) // 详情数据

/** 格式化的响应元数据 */
const metadataText = computed(() => {
  const metadata = detailData.value.responseMetadata
  return metadata ? JSON.stringify(metadata, null, 2) : ''
})

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  detailData.value = {} as RequestLogVO
  detailLoading.value = true
  try {
    detailData.value = await RequestLogApi.getRequestLog(id)
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 复制请求编号 */
const { copy } = useClipboard({ legacy: true }) // 初始化 copy 到粘贴板
const copyRequestId = async (requestId: string) => {
  await copy(requestId)
  message.success('复制成功')
}
</script>
