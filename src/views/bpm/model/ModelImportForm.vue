<template>
  <ContentWrap>
    <!-- 列表 -->
    <XTable @register="registerTable">
      <template #toolbar_buttons>
        <!-- 操作：导入 -->
        <XButton
          type="warning"
          preIcon="ep:upload"
          :title="'导入流程'"
          @click="handleImport"
          style="margin-left: 10px"
        />
      </template>
    </XTable>

    <!-- 导入流程 -->
    <XModal v-model="importDialogVisible" width="400" title="导入流程">
      <div>
        <el-upload
          ref="uploadRef"
          :action="importUrl"
          :headers="uploadHeaders"
          :drag="true"
          :limit="1"
          :multiple="true"
          :show-file-list="true"
          :disabled="uploadDisabled"
          :on-exceed="handleExceed"
          :on-success="handleFileSuccess"
          :on-error="excelUploadError"
          :auto-upload="false"
          accept=".bpmn, .xml"
          name="bpmnFile"
          :data="importForm"
        >
          <Icon class="el-icon--upload" icon="ep:upload-filled" />
          <div class="el-upload__text"> 将文件拖到此处，或 <em>点击上传</em> </div>
          <template #tip>
            <div class="el-upload__tip" style="color: red">
              提示：仅允许导入“bpm”或“xml”格式文件！
            </div>
            <div>
              <el-form
                ref="importFormRef"
                :model="importForm"
                :rules="rules"
                label-width="120px"
                status-icon
              >
                <el-form-item label="流程标识" prop="key">
                  <el-input
                    v-model="importForm.key"
                    placeholder="请输入流标标识"
                    style="width: 250px"
                  />
                </el-form-item>
                <el-form-item label="流程名称" prop="name">
                  <el-input v-model="importForm.name" placeholder="请输入流程名称" clearable />
                </el-form-item>
                <el-form-item label="流程描述" prop="description">
                  <el-input type="textarea" v-model="importForm.description" clearable />
                </el-form-item>
              </el-form>
            </div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <!-- 按钮：保存 -->
        <XButton
          type="warning"
          preIcon="ep:upload-filled"
          :title="t('action.save')"
          @click="submitFileForm"
        />
        <XButton title="取 消" @click="uploadClose" />
      </template>
    </XModal>

  </ContentWrap>
</template>

<script setup lang="ts">
import { getAccessToken, getTenantId } from '@/utils/auth'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const router = useRouter() // 路由

// ========== 导入流程 ==========
const uploadRef = ref<UploadInstance>()
let importUrl = import.meta.env.VITE_BASE_URL + import.meta.env.VITE_API_URL + '/bpm/model/import'
const uploadHeaders = ref()
const importDialogVisible = ref(false)
const uploadDisabled = ref(false)
const importFormRef = ref<FormInstance>()
const importForm = ref({
  key: '',
  name: '',
  description: ''
})

// 导入流程弹窗显示
const handleImport = () => {
  importDialogVisible.value = true
}
// 文件数超出提示
const handleExceed = (): void => {
  message.error('最多只能上传一个文件！')
}
// 上传错误提示
const excelUploadError = (): void => {
  message.error('导入流程失败，请您重新上传！')
}

// 提交文件上传
const submitFileForm = () => {
  uploadHeaders.value = {
    Authorization: 'Bearer ' + getAccessToken(),
    'tenant-id': getTenantId()
  }
  uploadDisabled.value = true
  uploadRef.value!.submit()
}
// 文件上传成功
const handleFileSuccess = async (response: any): Promise<void> => {
  if (response.code !== 0) {
    message.error(response.msg)
    return
  }
  // 重置表单
  uploadClose()
  // 提示，并刷新
  message.success('导入流程成功！请点击【设计流程】按钮，进行编辑保存后，才可以进行【发布流程】')
  await reload()
}
// 关闭文件上传
const uploadClose = () => {
  // 关闭弹窗
  importDialogVisible.value = false
  // 重置上传状态和文件
  uploadDisabled.value = false
  uploadRef.value!.clearFiles()
  // 重置表单
  importForm.value = {
    key: '',
    name: '',
    description: ''
  }
  importFormRef.value?.resetFields()
}
</script>
