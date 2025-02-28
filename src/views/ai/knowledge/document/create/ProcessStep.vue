<template>
  <div class="process-complete">
    <div class="mb-20px">
      <el-alert
        title="处理说明"
        type="info"
        description="系统将对文档进行处理，包括文本提取、向量化等操作，处理完成后文档将被添加到知识库中。"
        show-icon
        :closable="false"
      />
    </div>

    <div class="mb-20px">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span class="text-16px font-bold">文档信息</span>
          </div>
        </template>
        <div class="document-info">
          <div class="info-item">
            <span class="label">文档名称：</span>
            <span class="value">{{ modelData.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">知识库：</span>
            <span class="value">{{ getKnowledgeBaseName(modelData.knowledgeBaseId) }}</span>
          </div>
          <div class="info-item">
            <span class="label">文档类型：</span>
            <span class="value">{{ getDocumentTypeName(modelData.documentType) }}</span>
          </div>
          <div class="info-item">
            <span class="label">段落数量：</span>
            <span class="value">{{ modelData.segments.length }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <div class="mb-20px">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span class="text-16px font-bold">处理选项</span>
          </div>
        </template>
        <div class="process-options">
          <el-form :model="processOptions" label-width="120px">
            <el-form-item label="处理模式">
              <el-radio-group v-model="processOptions.mode">
                <el-radio :label="1">标准处理</el-radio>
                <el-radio :label="2">高级处理</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="向量模型" v-if="processOptions.mode === 2">
              <el-select v-model="processOptions.vectorModel" placeholder="请选择向量模型">
                <el-option label="文本嵌入模型-基础版" value="text-embedding-basic" />
                <el-option label="文本嵌入模型-高级版" value="text-embedding-advanced" />
                <el-option label="多模态嵌入模型" value="multimodal-embedding" />
              </el-select>
            </el-form-item>
            <el-form-item label="处理优先级" v-if="processOptions.mode === 2">
              <el-select v-model="processOptions.priority" placeholder="请选择处理优先级">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>

    <div class="mb-20px">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span class="text-16px font-bold">处理状态</span>
          </div>
        </template>
        <div class="process-status">
          <div v-if="!isProcessing && !isProcessed">
            <el-empty description="尚未开始处理" />
            <div class="flex justify-center mt-20px">
              <el-button type="primary" @click="handleStartProcess">开始处理</el-button>
            </div>
          </div>
          <div v-else-if="isProcessing">
            <div class="flex flex-col items-center">
              <el-progress type="circle" :percentage="processPercentage" />
              <div class="mt-10px">{{ processStatus }}</div>
            </div>
          </div>
          <div v-else>
            <div class="flex items-center justify-center">
              <el-result icon="success" title="处理完成" sub-title="文档已成功处理并添加到知识库中">
                <template #extra>
                  <el-button type="primary" @click="handleViewDocument">查看文档</el-button>
                </template>
              </el-result>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object as PropType<any>,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

// 表单数据
const modelData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 处理选项
const processOptions = ref({
  mode: 1, // 1: 标准处理, 2: 高级处理
  vectorModel: 'text-embedding-basic',
  priority: 'medium'
})

// 处理状态
const isProcessing = ref(false)
const isProcessed = ref(false)
const processPercentage = ref(0)
const processStatus = ref('正在准备处理...')

// 知识库列表（模拟数据）
const knowledgeBaseList = [
  { id: 1, name: '产品知识库' },
  { id: 2, name: '技术文档库' },
  { id: 3, name: '客户服务知识库' }
]

// 获取知识库名称
const getKnowledgeBaseName = (id) => {
  const base = knowledgeBaseList.find((item) => item.id === id)
  return base ? base.name : '未知知识库'
}

// 获取文档类型名称
const getDocumentTypeName = (type) => {
  const typeMap = {
    pdf: 'PDF文档',
    word: 'Word文档',
    text: '文本文件',
    url: '网页链接'
  }
  return typeMap[type] || '未知类型'
}

// 开始处理
const handleStartProcess = () => {
  isProcessing.value = true
  processPercentage.value = 0
  processStatus.value = '正在准备处理...'

  // 模拟处理过程
  const timer = setInterval(() => {
    processPercentage.value += 10

    if (processPercentage.value < 30) {
      processStatus.value = '正在提取文本内容...'
    } else if (processPercentage.value < 60) {
      processStatus.value = '正在进行向量化处理...'
    } else if (processPercentage.value < 90) {
      processStatus.value = '正在写入知识库...'
    } else {
      processStatus.value = '处理完成，正在整理结果...'
    }

    if (processPercentage.value >= 100) {
      clearInterval(timer)
      isProcessing.value = false
      isProcessed.value = true
      modelData.value.status = 2 // 已完成
    }
  }, 500)
}

// 查看文档
const handleViewDocument = () => {
  // 跳转到文档详情页
  console.log('查看文档:', modelData.value.id)
}

// 表单校验
const validate = () => {
  return new Promise((resolve, reject) => {
    if (modelData.value.status === 2) {
      resolve(true)
    } else {
      reject(new Error('请先完成文档处理'))
    }
  })
}

// 对外暴露方法
defineExpose({
  validate
})
</script>

<style lang="scss" scoped>
.process-complete {
  .document-info {
    .info-item {
      margin-bottom: 10px;
      display: flex;

      .label {
        width: 100px;
        color: #606266;
      }

      .value {
        font-weight: bold;
      }
    }
  }
}
</style>
