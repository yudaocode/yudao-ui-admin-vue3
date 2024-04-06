<template>
  <Dialog v-model="dialogVisible" title="导入流程" width="400">
    <div>
      <el-upload
        ref="uploadRef"
        v-model:file-list="fileList"
        :action="importUrl"
        :auto-upload="false"
        :data="formData"
        :disabled="formLoading"
        :headers="uploadHeaders"
        :limit="1"
        :on-error="submitFormError"
        :on-exceed="handleExceed"
        :on-success="submitFormSuccess"
        accept=".bpmn, .xml"
        drag
        name="bpmnFile"
      >
        <Icon class="el-icon--upload" icon="ep:upload-filled" />
        <div class="el-upload__text"> 将文件拖到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip" style="color: red">
            提示：仅允许导入“bpm”或“xml”格式文件！
          </div>
          <div>
            <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
              <el-form-item label="流程标识" prop="key">
                <el-input
                  v-model="formData.key"
                  placeholder="请输入流标标识"
                  style="width: 250px"
                />
              </el-form-item>
              <el-form-item label="流程名称" prop="name">
                <el-input v-model="formData.name" clearable placeholder="请输入流程名称" />
              </el-form-item>
              <el-form-item label="流程描述" prop="description">
                <el-input v-model="formData.description" clearable type="textarea" />
              </el-form-item>
            </el-form>
          </div>
        </template>
      </el-upload>
    </div>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { getAccessToken, getTenantId } from '@/utils/auth'

defineOptions({ name: 'ModelImportForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formData = ref({
  key: '',
  name: '',
  description: ''
})
const formRules = reactive({
  key: [{ required: true, message: '流程标识不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '流程名称不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const uploadRef = ref() // 上传 Ref
const importUrl = import.meta.env.VITE_BASE_URL + import.meta.env.VITE_API_URL + '/bpm/model/import'
const uploadHeaders = ref() // 上传 Header 头
const fileList = ref([]) // 文件列表

/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true
  resetForm()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  if (fileList.value.length == 0) {
    message.error('请上传文件')
    return
  }
  // 提交请求
  uploadHeaders.value = {
    Authorization: 'Bearer ' + getAccessToken(),
    'tenant-id': getTenantId()
  }
  formLoading.value = true
  uploadRef.value!.submit()
}

/** 文件上传成功 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitFormSuccess = async (response: any) => {
  if (response.code !== 0) {
    message.error(response.msg)
    formLoading.value = false
    return
  }
  // 提示成功
  message.success('导入流程成功！请点击【设计流程】按钮，进行编辑保存后，才可以进行【发布流程】')
  dialogVisible.value = false
  // 发送操作成功的事件
  emit('success')
}

/** 上传错误提示 */
const submitFormError = (): void => {
  message.error('导入流程失败，请您重新上传！')
  formLoading.value = false
}

/** 重置表单 */
const resetForm = () => {
  // 重置上传状态和文件
  formLoading.value = false
  uploadRef.value?.clearFiles()
  // 重置表单
  formData.value = {
    key: '',
    name: '',
    description: ''
  }
  formRef.value?.resetFields()
}

/** 文件数超出提示 */
const handleExceed = (): void => {
  message.error('最多只能上传一个文件！')
}
</script>
