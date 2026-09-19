<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="680px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="公告内容" prop="content">
        <el-input
          v-model="formData.content"
          :rows="6"
          maxlength="5000"
          placeholder="请输入公告内容"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
      <el-form-item label="附件" prop="fileUrls">
        <UploadFile v-model="formData.fileUrls" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormRules } from 'element-plus'
import * as ProjectAnnouncementApi from '@/api/pms/pm/project/announcement'

defineOptions({ name: 'PmsProjectAnnouncementForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as number | undefined,
  projectId: undefined as number | undefined,
  content: '',
  fileUrls: [] as string[]
})
const formRules = reactive<FormRules>({
  content: [{ required: true, message: '公告内容不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
async function open(type: string, projectId: number, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '发布公告' : '编辑公告'
  formType.value = type
  resetForm()
  formData.value.projectId = projectId
  // 修改时，查询公告详情
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProjectAnnouncementApi.getProjectAnnouncement(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as ProjectAnnouncementApi.PmsProjectAnnouncementVO
    if (formType.value === 'create') {
      await ProjectAnnouncementApi.createProjectAnnouncement(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProjectAnnouncementApi.updateProjectAnnouncement(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = {
    id: undefined,
    projectId: undefined,
    content: '',
    fileUrls: []
  }
  formRef.value?.resetFields()
}
</script>
