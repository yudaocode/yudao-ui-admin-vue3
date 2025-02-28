<template>
  <div class="document-segment">
    <!-- 上部分段设置部分 -->
    <div class="mb-20px">
      <div class="mb-20px flex justify-between items-center">
        <div class="text-16px font-bold flex items-center">
          分段设置
          <el-tooltip
            content="系统会自动将文档内容分割成多个段落，您可以根据需要调整分段方式和内容。"
            placement="top"
          >
            <el-icon class="ml-5px text-gray-400"><Warning /></el-icon>
          </el-tooltip>
        </div>
        <div>
          <el-button type="primary" plain size="small" @click="handleAutoSegment">
            预览分段
          </el-button>
        </div>
      </div>

      <div class="segment-settings mb-20px">
        <el-form :model="segmentSettings" label-width="120px">
          <el-form-item label="最大 Token 数">
            <el-input-number v-model="modelData.segmentMaxTokens" :min="100" :max="2000" />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 下部文件预览部分 -->
    <div class="mb-10px">
      <div class="text-16px font-bold mb-10px">分段预览</div>

      <!-- 文件选择器 -->
      <div class="file-selector mb-10px">
        <el-dropdown v-if="uploadedFiles.length > 0" trigger="click">
          <div class="flex items-center cursor-pointer">
            <el-icon class="text-danger mr-5px"><Document /></el-icon>
            <span>{{ currentFile.name }}</span>
            <el-icon class="ml-5px"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="(file, index) in uploadedFiles"
                :key="index"
                @click="selectFile(index)"
              >
                {{ file.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div v-else class="text-gray-400">暂无上传文件</div>
      </div>

      <!-- 文件内容预览 -->
      <div class="file-preview bg-gray-50 p-15px rounded-md">
        <template v-if="currentFile">
          <div v-for="(chunk, index) in currentFile.chunks" :key="index" class="mb-10px">
            <div class="text-gray-500 text-12px mb-5px"
              >Chunk-{{ index + 1 }} · {{ chunk.characters }} characters</div
            >
            <div class="bg-white p-10px rounded-md">{{ chunk.content }}</div>
          </div>
        </template>
        <el-empty v-else description="暂无预览内容" />
      </div>
    </div>

    <!-- 添加底部按钮 -->
    <div class="mt-20px flex justify-between">
      <el-button @click="handlePrevStep">上一步</el-button>
      <el-button type="primary" @click="handleNextStep">保存并处理</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType, ref, computed, inject, onMounted, getCurrentInstance } from 'vue'
import { Document, ArrowDown, Warning } from '@element-plus/icons-vue' // TODO @芋艿：icon 的处理

const props = defineProps({
  modelValue: {
    type: Object as PropType<any>,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

// 获取父组件实例
const parent = inject('parent', null)

// 表单数据
const modelData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 分段设置
const segmentSettings = ref({})

// 模拟上传的文件数据
const uploadedFiles = ref([
  {
    name: '项目说明文档.pdf',
    type: 'pdf',
    chunks: [
      {
        characters: 120,
        content:
          '项目说明文档 - 智能知识库系统 本项目旨在构建一个智能知识库系统，能够对各类文档进行智能分析、分类和检索，提高企业知识管理效率。'
      },
      {
        characters: 180,
        content:
          '系统架构：前端采用Vue3+Element Plus构建用户界面，后端采用Spring Boot微服务架构，数据存储使用MySQL和Elasticsearch，文档解析使用Apache Tika，向量检索使用Milvus。'
      },
      {
        characters: 150,
        content:
          '核心功能：1. 文档上传与解析：支持多种格式文档上传，自动提取文本内容。2. 智能分段：根据语义自动将文档分割成合适的段落。3. 向量化存储：将文本转换为向量存储，支持语义检索。'
      },
      {
        characters: 160,
        content:
          '4. 智能检索：支持关键词和语义检索，快速找到相关内容。5. 知识图谱：自动构建领域知识图谱，展示知识间关联。6. 权限管理：细粒度的文档访问权限控制。7. 操作日志：记录用户操作，支持审计追踪。'
      },
      {
        characters: 130,
        content:
          '技术特点：1. 高性能：采用分布式架构，支持横向扩展。2. 高可用：关键组件冗余部署，确保系统稳定性。3. 安全性：数据传输加密，存储加密，多层次安全防护。'
      }
    ]
  },
  {
    name: '项目说明文档.pdf',
    type: 'pdf',
    chunks: []
  }
])

// 当前选中的文件
const currentFile = ref(uploadedFiles.value[0] || null)

// 选择文件
const selectFile = (index) => {
  currentFile.value = uploadedFiles.value[index]
}

// 自动分段
const handleAutoSegment = () => {
  // 根据文档类型和分段设置进行自动分段
  // 这里只是模拟实现，实际需要根据文档内容进行分析

  // 确保 segments 存在
  if (!modelData.value.segments) {
    modelData.value.segments = []
  }

  // 清空现有段落
  modelData.value.segments = []

  // 模拟生成段落
  if (modelData.value.documentType === 'text' && modelData.value.content) {
    // 文本类型，按Token数分割
    const content = modelData.value.content
    const maxChars = Math.floor(modelData.value.segmentMaxTokens / 2) // 简单估算：1个token约等于2个字符
    let remaining = content

    while (remaining.length > 0) {
      const segment = remaining.substring(0, maxChars)
      remaining = remaining.substring(maxChars)

      modelData.value.segments.push({
        content: segment,
        order: modelData.value.segments.length + 1
      })
    }
  } else {
    // 其他类型文档，模拟生成5个段落
    for (let i = 0; i < 5; i++) {
      modelData.value.segments.push({
        content: `这是第 ${i + 1} 个自动生成的段落，实际内容将根据文档解析结果填充。`,
        order: i + 1
      })
    }
  }
}

// 上一步按钮处理
const handlePrevStep = () => {
  // 获取父组件的goToPrevStep方法
  const parentEl = parent || getCurrentInstance()?.parent
  if (parentEl && typeof parentEl.exposed?.goToPrevStep === 'function') {
    parentEl.exposed.goToPrevStep()
  }
}

// 下一步按钮处理
const handleNextStep = () => {
  // 获取父组件的goToNextStep方法
  const parentEl = parent || getCurrentInstance()?.parent
  if (parentEl && typeof parentEl.exposed?.goToNextStep === 'function') {
    parentEl.exposed.goToNextStep()
  }
}

// 表单校验
const validate = () => {
  return new Promise((resolve, reject) => {
    // 确保 segments 存在
    if (!modelData.value.segments || modelData.value.segments.length === 0) {
      reject(new Error('请先进行预览分段'))
    } else {
      resolve(true)
    }
  })
}

// 对外暴露方法
defineExpose({
  validate
})

// 初始化
onMounted(() => {
  // 确保 segments 存在
  if (!modelData.value.segments) {
    modelData.value.segments = []
  }

  // 确保 segmentMaxTokens 存在
  if (!modelData.value.segmentMaxTokens) {
    modelData.value.segmentMaxTokens = 500
  }
})
</script>

<style lang="scss" scoped>
.document-segment {
  .segment-content {
    padding: 10px;
  }

  .file-preview {
    max-height: 600px;
    overflow-y: auto;
  }
}
</style>
