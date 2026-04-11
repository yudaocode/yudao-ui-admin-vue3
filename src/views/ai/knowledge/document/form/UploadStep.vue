<template>
  <el-form ref="formRef" :model="modelData" label-width="0" class="mt-20px">
    <el-form-item class="mb-20px">
      <div class="w-full">
        <div
          class="w-full border-2 border-dashed border-[#dcdfe6] rounded-md p-20px text-center hover:border-[#409eff]"
        >
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            drag
            :action="uploadUrl"
            :auto-upload="true"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :before-upload="beforeUpload"
            :http-request="httpRequest"
            :file-list="fileList"
            :multiple="true"
            :show-file-list="false"
            :accept="acceptedFileTypes"
          >
            <div class="flex flex-col items-center justify-center py-20px">
              <Icon icon="ep:upload-filled" class="text-[48px] text-[#c0c4cc] mb-10px" />
              <div class="el-upload__text text-[16px] text-[#606266]">
                拖拽文件至此，或者
                <em class="text-[#409eff] not-italic cursor-pointer">选择文件</em>
              </div>
              <div class="el-upload__tip mt-10px text-[#909399] text-[12px]">
                已支持 {{ supportedFileTypes.join('、') }}，每个文件不超过 {{ maxFileSize }} MB。
              </div>
            </div>
          </el-upload>
        </div>

        <div
          v-if="modelData.list && modelData.list.length > 0"
          class="mt-15px grid grid-cols-1 gap-2"
        >
          <div
            v-for="(file, index) in modelData.list"
            :key="index"
            class="flex justify-between items-center py-4px px-12px border-l-4 border-l-[#409eff] rounded-sm shadow-sm hover:bg-[#ecf5ff] transition-all duration-300"
          >
            <div class="flex items-center">
              <Icon icon="ep:document" class="mr-8px text-[#409eff]" />
              <span class="text-[13px] text-[#303133] break-all">{{ file.name }}</span>
            </div>
            <el-button type="danger" link @click="removeFile(index)" class="ml-2">
              <Icon icon="ep:delete" />
            </el-button>
          </div>
        </div>
      </div>
    </el-form-item>

    <!-- 添加下一步按钮 -->
    <el-form-item>
      <div class="flex justify-end w-full">
        <el-button type="primary" @click="handleNextStep" :disabled="!isAllUploaded">
          下一步
        </el-button>
      </div>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { PropType, ref, computed, inject, getCurrentInstance, onMounted } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import { useUpload } from '@/components/UploadFile/src/useUpload'
import { generateAcceptedFileTypes } from '@/utils'
import { Icon } from '@/components/Icon'

const props = defineProps({
  modelValue: {
    type: Object as PropType<any>,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const formRef = ref() // 表单引用
const uploadRef = ref() // 上传组件引用
const parent = inject('parent', null) // 获取父组件实例
const { uploadUrl, httpRequest } = useUpload() // 使用上传组件的钩子
const message = useMessage() // 消息弹窗
const fileList = ref([]) // 文件列表
const uploadingCount = ref(0) // 上传中的文件数量

// 支持的文件类型和大小限制
const supportedFileTypes = [
  'TXT',
  'MARKDOWN',
  'MDX',
  'PDF',
  'HTML',
  'XLSX',
  'XLS',
  'DOC',
  'DOCX',
  'CSV',
  'EML',
  'MSG',
  'PPTX',
  'XML',
  'EPUB',
  'PPT',
  'MD',
  'HTM'
]
const allowedExtensions = supportedFileTypes.map((ext) => ext.toLowerCase()) // 小写的扩展名列表
const maxFileSize = 15 // 最大文件大小(MB)

// 构建 accept 属性值，用于限制文件选择对话框中可见的文件类型
const acceptedFileTypes = computed(() => generateAcceptedFileTypes(supportedFileTypes))

/** 表单数据 */
const modelData = computed({
  get: () => {
    return props.modelValue
  },
  set: (val) => emit('update:modelValue', val)
})

/** 确保 list 属性存在 */
const ensureListExists = () => {
  if (!props.modelValue.list) {
    emit('update:modelValue', {
      ...props.modelValue,
      list: []
    })
  }
}

/** 是否所有文件都已上传完成 */
const isAllUploaded = computed(() => {
  return modelData.value.list && modelData.value.list.length > 0 && uploadingCount.value === 0
})

/**
 * 上传前检查文件类型和大小
 *
 * @param file 待上传的文件
 * @returns 是否允许上传
 */
const beforeUpload = (file) => {
  // 1.1 检查文件扩展名
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1)
  if (!allowedExtensions.includes(fileExtension)) {
    message.error('不支持的文件类型！')
    return false
  }
  // 1.2 检查文件大小
  if (!(file.size / 1024 / 1024 < maxFileSize)) {
    message.error(`文件大小不能超过 ${maxFileSize} MB！`)
    return false
  }

  // 2. 增加上传中的文件计数
  uploadingCount.value++
  return true
}

/**
 * 文件上传成功处理
 *
 * @param response 上传响应
 * @param file 上传的文件
 */
const handleUploadSuccess = (response, file) => {
  // 添加到文件列表
  if (response && response.data) {
    ensureListExists()
    emit('update:modelValue', {
      ...props.modelValue,
      list: [
        ...props.modelValue.list,
        {
          name: file.name,
          url: response.data
        }
      ]
    })
  } else {
    message.error(`文件 ${file.name} 上传失败`)
  }

  // 减少上传中的文件计数
  uploadingCount.value = Math.max(0, uploadingCount.value - 1)
}

/**
 * 文件上传失败处理
 *
 * @param error 错误信息
 * @param file 上传的文件
 */
const handleUploadError = (error, file) => {
  message.error(`文件 ${file.name} 上传失败: ${error}`)
  // 减少上传中的文件计数
  uploadingCount.value = Math.max(0, uploadingCount.value - 1)
}

/**
 * 文件变更处理
 *
 * @param file 变更的文件
 */
const handleFileChange = (file) => {
  if (file.status === 'success' || file.status === 'fail') {
    uploadingCount.value = Math.max(0, uploadingCount.value - 1)
  }
}

/**
 * 文件移除处理
 *
 * @param file 被移除的文件
 */
const handleFileRemove = (file) => {
  if (file.status === 'uploading') {
    uploadingCount.value = Math.max(0, uploadingCount.value - 1)
  }
}

/**
 * 从列表中移除文件
 *
 * @param index 要移除的文件索引
 */
const removeFile = (index: number) => {
  // 从列表中移除文件
  const newList = [...props.modelValue.list]
  newList.splice(index, 1)
  // 更新表单数据
  emit('update:modelValue', {
    ...props.modelValue,
    list: newList
  })
}

/** 下一步按钮处理 */
const handleNextStep = () => {
  // 1.1 检查是否有文件上传
  if (!modelData.value.list || modelData.value.list.length === 0) {
    message.warning('请上传至少一个文件')
    return
  }
  // 1.2 检查是否有文件正在上传
  if (uploadingCount.value > 0) {
    message.warning('请等待所有文件上传完成')
    return
  }

  // 2. 获取父组件的goToNextStep方法
  const parentEl = parent || getCurrentInstance()?.parent
  if (parentEl && typeof parentEl.exposed?.goToNextStep === 'function') {
    parentEl.exposed.goToNextStep()
  }
}

/** 初始化 */
onMounted(() => {
  ensureListExists()
})
</script>

<style lang="scss" scoped></style>
