<template>
  <el-form ref="formRef" :model="modelData" :rules="rules" label-width="120px" class="mt-20px">
    <el-form-item label="文档名称" prop="name" class="mb-20px">
      <el-input v-model="modelData.name" clearable placeholder="请输入文档名称" />
    </el-form-item>
    <el-form-item label="知识库" prop="knowledgeBaseId" class="mb-20px">
      <el-select
        class="!w-full"
        v-model="modelData.knowledgeBaseId"
        clearable
        placeholder="请选择知识库"
      >
        <el-option
          v-for="base in knowledgeBaseList"
          :key="base.id"
          :label="base.name"
          :value="base.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="文档类型" prop="documentType" class="mb-20px">
      <el-select
        class="!w-full"
        v-model="modelData.documentType"
        clearable
        placeholder="请选择文档类型"
      >
        <el-option label="PDF文档" value="pdf" />
        <el-option label="Word文档" value="word" />
        <el-option label="文本文件" value="text" />
        <el-option label="网页链接" value="url" />
      </el-select>
    </el-form-item>
    <el-form-item
      label="文档内容"
      prop="content"
      class="mb-20px"
      v-if="modelData.documentType === 'text'"
    >
      <el-input
        v-model="modelData.content"
        type="textarea"
        :rows="6"
        placeholder="请输入文档内容"
      />
    </el-form-item>
    <el-form-item
      label="网页链接"
      prop="url"
      class="mb-20px"
      v-if="modelData.documentType === 'url'"
    >
      <el-input v-model="modelData.url" clearable placeholder="请输入网页链接" />
    </el-form-item>
    <el-form-item
      label="上传文件"
      prop="file"
      class="mb-20px"
      v-if="['pdf', 'word'].includes(modelData.documentType)"
    >
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text"> 拖拽文件到此处，或 <em>点击上传</em> </div>
        <template #tip>
          <div class="el-upload__tip">
            {{ modelData.documentType === 'pdf' ? 'PDF文件' : 'Word文件(.docx, .doc)' }}
          </div>
        </template>
      </el-upload>
    </el-form-item>

    <!-- 添加下一步按钮 -->
    <el-form-item>
      <div class="flex justify-end">
        <el-button type="primary" @click="handleNextStep">下一步</el-button>
      </div>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Object as PropType<any>,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

// 表单引用
const formRef = ref()

// 获取父组件实例
const parent = inject('parent', null)

// 表单数据
const modelData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 知识库列表
interface KnowledgeBase {
  id: number
  name: string
}

const knowledgeBaseList = ref<KnowledgeBase[]>([])

// 表单校验规则
const rules = {
  name: [{ required: true, message: '请输入文档名称', trigger: 'blur' }],
  knowledgeBaseId: [{ required: true, message: '请选择知识库', trigger: 'change' }],
  documentType: [{ required: true, message: '请选择文档类型', trigger: 'change' }],
  content: [
    {
      required: true,
      message: '请输入文档内容',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (modelData.value.documentType === 'text' && !value) {
          callback(new Error('请输入文档内容'))
        } else {
          callback()
        }
      }
    }
  ],
  url: [
    {
      required: true,
      message: '请输入网页链接',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (modelData.value.documentType === 'url' && !value) {
          callback(new Error('请输入网页链接'))
        } else {
          callback()
        }
      }
    }
  ],
  file: [
    {
      required: true,
      message: '请上传文件',
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (['pdf', 'word'].includes(modelData.value.documentType) && !modelData.value.file) {
          callback(new Error('请上传文件'))
        } else {
          callback()
        }
      }
    }
  ]
}

// 文件上传处理
const handleFileChange = (file) => {
  modelData.value.file = file.raw
}

// 下一步按钮处理
const handleNextStep = () => {
  // 获取父组件的goToNextStep方法
  const parentEl = parent || getCurrentInstance()?.parent
  if (parentEl && typeof parentEl.exposed?.goToNextStep === 'function') {
    parentEl.exposed.goToNextStep()
  }
}

// 初始化数据
const initData = async () => {
  // 获取知识库列表
  // knowledgeBaseList.value = await KnowledgeBaseApi.getKnowledgeBaseList()

  // 模拟数据
  knowledgeBaseList.value = [
    { id: 1, name: '产品知识库' },
    { id: 2, name: '技术文档库' },
    { id: 3, name: '客户服务知识库' }
  ]
}

// 表单校验
const validate = () => {
  return new Promise((resolve, reject) => {
    formRef.value?.validate((valid) => {
      if (valid) {
        resolve(true)
      } else {
        reject(new Error('请完善表单信息'))
      }
    })
  })
}

// 对外暴露方法
defineExpose({
  validate
})

// 初始化
onMounted(() => {
  initData()
})
</script>

<style lang="scss" scoped>
.upload-demo {
  width: 100%;
}
</style>
