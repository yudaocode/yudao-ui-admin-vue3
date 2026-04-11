<template>
  <div>
    <!-- 上部分段设置部分 -->
    <div class="mb-20px">
      <div class="mb-20px flex justify-between items-center">
        <div class="text-16px font-bold flex items-center">
          分段设置
          <el-tooltip
            content="系统会自动将文档内容分割成多个段落，您可以根据需要调整分段方式和内容。"
            placement="top"
          >
            <Icon icon="ep:warning" class="ml-5px text-gray-400" />
          </el-tooltip>
        </div>
        <div>
          <el-button type="primary" plain size="small" @click="handleAutoSegment">
            预览分段
          </el-button>
        </div>
      </div>

      <div class="segment-settings mb-20px">
        <el-form label-width="120px">
          <el-form-item label="最大 Token 数">
            <el-input-number v-model="modelData.segmentMaxTokens" :min="1" :max="2048" />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 下部文件预览部分 -->
    <div class="mb-10px">
      <div class="text-16px font-bold mb-10px">分段预览</div>

      <!-- 文件选择器 -->
      <div class="file-selector mb-10px">
        <el-dropdown v-if="modelData.list && modelData.list.length > 0" trigger="click">
          <div class="flex items-center cursor-pointer">
            <Icon icon="ep:document" class="text-danger mr-5px" />
            <span>{{ currentFile?.name || '请选择文件' }}</span>
            <span v-if="currentFile?.segments" class="ml-5px text-gray-500 text-12px">
              ({{ currentFile.segments.length }}个分片)
            </span>
            <Icon icon="ep:arrow-down" class="ml-5px" />
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="(file, index) in modelData.list"
                :key="index"
                @click="selectFile(index)"
              >
                {{ file.name }}
                <span v-if="file.segments" class="ml-5px text-gray-500 text-12px">
                  ({{ file.segments.length }}个分片)
                </span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div v-else class="text-gray-400">暂无上传文件</div>
      </div>

      <!-- 文件内容预览 -->
      <div class="file-preview bg-gray-50 p-15px rounded-md max-h-600px overflow-y-auto">
        <div v-if="splitLoading" class="flex justify-center items-center py-20px">
          <Icon icon="ep:loading" class="is-loading" />
          <span class="ml-10px">正在加载分段内容...</span>
        </div>
        <template
          v-else-if="currentFile && currentFile.segments && currentFile.segments.length > 0"
        >
          <div v-for="(segment, index) in currentFile.segments" :key="index" class="mb-10px">
            <div class="text-gray-500 text-12px mb-5px">
              分片-{{ index + 1 }} · {{ segment.contentLength || 0 }} 字符数 ·
              {{ segment.tokens || 0 }} Token
            </div>
            <div class="bg-white p-10px rounded-md">{{ segment.content }}</div>
          </div>
        </template>
        <el-empty v-else description="暂无预览内容" />
      </div>
    </div>

    <!-- 添加底部按钮 -->
    <div class="mt-20px flex justify-between">
      <div>
        <el-button v-if="!modelData.id" @click="handlePrevStep">上一步</el-button>
      </div>
      <div>
        <el-button type="primary" :loading="submitLoading" @click="handleSave">
          保存并处理
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance, inject, onMounted, PropType, ref } from 'vue'
import { Icon } from '@/components/Icon'
import { KnowledgeSegmentApi } from '@/api/ai/knowledge/segment'
import { useMessage } from '@/hooks/web/useMessage'
import { KnowledgeDocumentApi } from '@/api/ai/knowledge/document'

const props = defineProps({
  modelValue: {
    type: Object as PropType<any>,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])
const message = useMessage() // 消息提示
const parent = inject('parent', null) // 获取父组件实例

const modelData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
}) // 表单数据

const splitLoading = ref(false) // 分段加载状态
const currentFile = ref<any>(null) // 当前选中的文件
const submitLoading = ref(false) // 提交按钮加载状态

/** 选择文件 */
const selectFile = async (index: number) => {
  currentFile.value = modelData.value.list[index]
  await splitContent(currentFile.value)
}

/** 获取文件分段内容 */
const splitContent = async (file: any) => {
  if (!file || !file.url) {
    message.warning('文件 URL 不存在')
    return
  }

  splitLoading.value = true
  try {
    // 调用后端分段接口，获取文档的分段内容、字符数和 Token 数
    file.segments = await KnowledgeSegmentApi.splitContent(
      file.url,
      modelData.value.segmentMaxTokens
    )
  } catch (error) {
    console.error('获取分段内容失败:', file, error)
  } finally {
    splitLoading.value = false
  }
}

/** 处理预览分段 */
const handleAutoSegment = async () => {
  // 如果没有选中文件，默认选中第一个
  if (!currentFile.value && modelData.value.list && modelData.value.list.length > 0) {
    currentFile.value = modelData.value.list[0]
  }
  // 如果没有选中文件，提示请先选择文件
  if (!currentFile.value) {
    message.warning('请先选择文件')
    return
  }

  // 获取分段内容
  await splitContent(currentFile.value)
}

/** 上一步按钮处理 */
const handlePrevStep = () => {
  const parentEl = parent || getCurrentInstance()?.parent
  if (parentEl && typeof parentEl.exposed?.goToPrevStep === 'function') {
    parentEl.exposed.goToPrevStep()
  }
}

/** 保存操作 */
const handleSave = async () => {
  // 保存前验证
  if (!currentFile?.value?.segments || currentFile.value.segments.length === 0) {
    message.warning('请先预览分段内容')
    return
  }

  // 设置按钮加载状态
  submitLoading.value = true
  try {
    if (modelData.value.id) {
      // 修改场景
      await KnowledgeDocumentApi.updateKnowledgeDocument({
        id: modelData.value.id,
        segmentMaxTokens: modelData.value.segmentMaxTokens
      })
    } else {
      // 新增场景
      const data = await KnowledgeDocumentApi.createKnowledgeDocumentList({
        knowledgeId: modelData.value.knowledgeId,
        segmentMaxTokens: modelData.value.segmentMaxTokens,
        list: modelData.value.list.map((item: any) => ({
          name: item.name,
          url: item.url
        }))
      })
      modelData.value.list.forEach((document: any, index: number) => {
        document.id = data[index]
      })
    }

    // 进入下一步
    const parentEl = parent || getCurrentInstance()?.parent
    if (parentEl && typeof parentEl.exposed?.goToNextStep === 'function') {
      parentEl.exposed.goToNextStep()
    }
  } catch (error: any) {
    console.error('保存失败:', modelData.value, error)
  } finally {
    // 关闭按钮加载状态
    submitLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  // 确保 segmentMaxTokens 存在
  if (!modelData.value.segmentMaxTokens) {
    modelData.value.segmentMaxTokens = 500
  }
  // 如果没有选中文件，默认选中第一个
  if (!currentFile.value && modelData.value.list && modelData.value.list.length > 0) {
    currentFile.value = modelData.value.list[0]
  }

  // 如果有选中的文件，获取分段内容
  if (currentFile.value) {
    await splitContent(currentFile.value)
  }
})
</script>
