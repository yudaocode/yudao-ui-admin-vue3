<template>
  <div class="document-segment">
    <div class="mb-20px">
      <el-alert
        title="文档分段说明"
        type="info"
        description="系统会自动将文档内容分割成多个段落，您可以根据需要调整分段方式和内容。"
        show-icon
        :closable="false"
      />
    </div>

    <div class="mb-20px flex justify-between items-center">
      <div class="text-16px font-bold">分段设置</div>
      <div>
        <el-button type="primary" @click="handleAutoSegment">自动分段</el-button>
        <el-button @click="handleAddSegment">添加段落</el-button>
      </div>
    </div>

    <div class="segment-settings mb-20px">
      <el-form :model="segmentSettings" label-width="120px">
        <el-form-item label="分段方式">
          <el-radio-group v-model="segmentSettings.type">
            <el-radio :label="1">按段落分割</el-radio>
            <el-radio :label="2">按字数分割</el-radio>
            <el-radio :label="3">按标题分割</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="最大字数" v-if="segmentSettings.type === 2">
          <el-input-number v-model="segmentSettings.maxChars" :min="100" :max="5000" />
        </el-form-item>
      </el-form>
    </div>

    <div class="segment-list">
      <div class="text-16px font-bold mb-10px">段落列表 ({{ modelData.segments.length }})</div>

      <el-empty v-if="modelData.segments.length === 0" description="暂无段落数据" />

      <div v-else>
        <el-collapse v-model="activeSegments">
          <el-collapse-item
            v-for="(segment, index) in modelData.segments"
            :key="index"
            :title="`段落 ${index + 1}`"
            :name="index"
          >
            <div class="segment-content">
              <el-input
                v-model="segment.content"
                type="textarea"
                :rows="5"
                placeholder="段落内容"
              />
              <div class="mt-10px flex justify-end">
                <el-button type="danger" size="small" @click="handleDeleteSegment(index)">
                  删除段落
                </el-button>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
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
import { PropType } from 'vue'

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
const segmentSettings = ref({
  type: 1, // 1: 按段落, 2: 按字数, 3: 按标题
  maxChars: 1000
})

// 当前展开的段落
const activeSegments = ref([0])

// 自动分段
const handleAutoSegment = () => {
  // 根据文档类型和分段设置进行自动分段
  // 这里只是模拟实现，实际需要根据文档内容进行分析

  // 清空现有段落
  modelData.value.segments = []

  // 模拟生成段落
  if (modelData.value.documentType === 'text' && modelData.value.content) {
    // 文本类型，直接按段落或字数分割
    const content = modelData.value.content

    if (segmentSettings.value.type === 1) {
      // 按段落分割
      const paragraphs = content.split(/\n\s*\n/)
      paragraphs.forEach((paragraph) => {
        if (paragraph.trim()) {
          modelData.value.segments.push({
            content: paragraph.trim(),
            order: modelData.value.segments.length + 1
          })
        }
      })
    } else if (segmentSettings.value.type === 2) {
      // 按字数分割
      const maxChars = segmentSettings.value.maxChars
      let remaining = content

      while (remaining.length > 0) {
        const segment = remaining.substring(0, maxChars)
        remaining = remaining.substring(maxChars)

        modelData.value.segments.push({
          content: segment,
          order: modelData.value.segments.length + 1
        })
      }
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

  // 默认展开第一个段落
  activeSegments.value = [0]
}

// 添加段落
const handleAddSegment = () => {
  modelData.value.segments.push({
    content: '',
    order: modelData.value.segments.length + 1
  })

  // 展开新添加的段落
  activeSegments.value = [modelData.value.segments.length - 1]
}

// 删除段落
const handleDeleteSegment = (index) => {
  modelData.value.segments.splice(index, 1)

  // 更新段落顺序
  modelData.value.segments.forEach((segment, idx) => {
    segment.order = idx + 1
  })
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
    if (modelData.value.segments.length === 0) {
      reject(new Error('请至少添加一个段落'))
    } else {
      // 检查是否有空段落
      const emptySegment = modelData.value.segments.find((segment) => !segment.content.trim())
      if (emptySegment) {
        reject(new Error('存在空段落，请填写内容或删除'))
      } else {
        resolve(true)
      }
    }
  })
}

// 对外暴露方法
defineExpose({
  validate
})

// 初始化
onMounted(() => {
  // 如果已有段落数据，默认展开第一个
  if (modelData.value.segments && modelData.value.segments.length > 0) {
    activeSegments.value = [0]
  }
})
</script>

<style lang="scss" scoped>
.document-segment {
  .segment-content {
    padding: 10px;
  }
}
</style>
