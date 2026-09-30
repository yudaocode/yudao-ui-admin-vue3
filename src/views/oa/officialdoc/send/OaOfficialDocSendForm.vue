<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="90%">
    <div class="grid grid-cols-1 gap-20px xl:grid-cols-2">
      <el-form
        ref="formRef"
        v-loading="formLoading"
        :model="formData"
        :rules="formRules"
        label-width="110px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="套红模板" prop="templateId">
              <OaOfficialDocTemplateSelect
                v-model="formData.templateId"
                class="!w-1/1"
                @change="handleTemplateChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input v-model="formData.title" placeholder="请输入标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="字号" prop="noPrefix">
              <el-input v-model="formData.noPrefix" placeholder="请输入字号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年份" prop="year">
              <el-input-number v-model="formData.year" :min="1" :max="9999" class="!w-1/1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="第几号文" prop="sequence">
              <el-input-number v-model="formData.sequence" :min="1" class="!w-1/1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密级" prop="secrecyLevel">
              <el-select v-model="formData.secrecyLevel" placeholder="请选择密级" class="!w-1/1">
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.OA_OFFICIAL_DOC_SECRET_LEVEL)"
                  :key="dict.value"
                  :value="dict.value"
                  :label="dict.label"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="紧急程度" prop="urgencyLevel">
              <el-select
                v-model="formData.urgencyLevel"
                placeholder="请选择紧急程度"
                class="!w-1/1"
              >
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.OA_OFFICIAL_DOC_URGENCY_LEVEL)"
                  :key="dict.value"
                  :value="dict.value"
                  :label="dict.label"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公开类别" prop="disclosureType">
              <el-select
                v-model="formData.disclosureType"
                placeholder="请选择公开类别"
                class="!w-1/1"
              >
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.OA_OFFICIAL_DOC_PUBLIC_CATEGORY)"
                  :key="dict.value"
                  :value="dict.value"
                  :label="dict.label"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发文日期" prop="issueTime">
              <el-date-picker
                v-model="formData.issueTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择发文日期"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发文部门" prop="sendDeptId">
              <DeptSelect v-model="formData.sendDeptId" class="!w-1/1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主送部门" prop="mainDeptIds">
              <DeptSelect v-model="formData.mainDeptIds" multiple class="!w-1/1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="抄送部门" prop="copyDeptIds">
              <DeptSelect v-model="formData.copyDeptIds" multiple class="!w-1/1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="签发人">
              <el-input :model-value="formData.signerName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="附注" prop="remark">
              <el-input
                v-model="formData.remark"
                placeholder="请输入附注"
                type="textarea"
                :rows="3"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="公文内容" prop="content">
              <Editor v-model="formData.content!" height="320px" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="附件" prop="fileUrls">
              <UploadFile v-model="formData.fileUrls!" :limit="10" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="正式公文" prop="formalFileUrl">
              <UploadFile v-model="formData.formalFileUrl!" :limit="1" :file-type="['pdf']" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <!-- 随表单内容实时更新套红预览 -->
      <div class="min-w-0 overflow-auto">
        <OaOfficialDocPreview :document="formData" :template="selectedTemplate" />
      </div>
    </div>
    <template #footer>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">保 存</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as SendApi from '@/api/oa/officialdoc/send'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as TemplateApi from '@/api/oa/officialdoc/template'
import { formatDate } from '@/utils/formatTime'
import OaOfficialDocTemplateSelect from '../template/components/OaOfficialDocTemplateSelect.vue'
import { useUserStore } from '@/store/modules/user'
import OaOfficialDocPreview from '../components/OaOfficialDocPreview.vue'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import type { FormRules } from 'element-plus'

defineOptions({ name: 'OaOfficialDocSendForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const userStore = useUserStore() // 当前用户

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<SendApi.OfficialDocSendVO>({
  year: new Date().getFullYear(),
  sequence: undefined,
  secrecyLevel: 0,
  urgencyLevel: 0,
  disclosureType: 0,
  issueTime: formatDate(new Date()),
  sendDeptId: userStore.getUser.deptId,
  mainDeptIds: [],
  copyDeptIds: [],
  fileUrls: [],
  content: '',
  formalFileUrl: ''
})
const formRules = reactive<FormRules>({
  templateId: [{ required: true, message: '套红模板不能为空', trigger: 'change' }],
  title: [{ required: true, message: '公文标题不能为空', trigger: 'blur' }],
  secrecyLevel: [{ required: true, message: '密级不能为空', trigger: 'change' }],
  urgencyLevel: [{ required: true, message: '紧急程度不能为空', trigger: 'change' }],
  disclosureType: [{ required: true, message: '公开类别不能为空', trigger: 'change' }],
  issueTime: [{ required: true, message: '发文日期不能为空', trigger: 'change' }],
  sendDeptId: [{ required: true, message: '发文部门不能为空', trigger: 'change' }],
  mainDeptIds: [{ required: true, message: '主送部门不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const selectedTemplate = ref<TemplateApi.OfficialDocTemplateVO>() // 当前模板详情，用于文号和预览

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formLoading.value = true
  try {
    // 修改时，设置数据
    if (id) {
      formData.value = await SendApi.getSend(id)
      if (formData.value.templateId) {
        selectedTemplate.value = await TemplateApi.getTemplate(formData.value.templateId)
      }
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 保存草稿，提交审批由列表单独操作 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    // 1. 保存表单
    if (formType.value === 'create') {
      formData.value.id = await SendApi.createSend(formData.value)
      formType.value = 'update'
    } else {
      await SendApi.updateSend(formData.value)
    }
    message.success('保存成功')
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  selectedTemplate.value = undefined
  formData.value = {
    year: new Date().getFullYear(),
    sequence: undefined,
    secrecyLevel: 0,
    urgencyLevel: 0,
    disclosureType: 0,
    issueTime: formatDate(new Date()),
    sendDeptId: userStore.getUser.deptId,
    mainDeptIds: [],
    copyDeptIds: [],
    fileUrls: [],
    content: '',
    formalFileUrl: ''
  }
  formRef.value?.resetFields()
}

/** 切换套红模板 */
async function handleTemplateChange() {
  const templateId = formData.value.templateId
  selectedTemplate.value = undefined
  formData.value.noPrefix = undefined
  if (!templateId) return
  formLoading.value = true
  try {
    const template = await TemplateApi.getTemplate(templateId)
    selectedTemplate.value = template
    formData.value.noPrefix = template.noPrefix
  } finally {
    formLoading.value = false
  }
}
</script>
