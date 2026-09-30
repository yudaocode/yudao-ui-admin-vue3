<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="收文类型" prop="receiveType">
            <el-select
              v-model="formData.receiveType"
              placeholder="请选择收文类型"
              class="!w-1/1"
              disabled
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_OFFICIAL_DOC_RECEIVE_TYPE)"
                :key="dict.value"
                :value="dict.value"
                :label="dict.label"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <!-- 关联发文信息 -->
        <template v-if="formData.sendId">
          <el-col :span="12">
            <el-form-item label="发文单位">
              <el-input :model-value="formData.sendDeptName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发文日期">
              <el-input
                :model-value="
                  formData.issueTime ? formatDate(formData.issueTime, 'YYYY-MM-DD') : ''
                "
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="签发人">
              <el-input :model-value="formData.signerName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公开类别">
              <el-select v-model="formData.disclosureType" disabled class="!w-1/1">
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.OA_OFFICIAL_DOC_PUBLIC_CATEGORY)"
                  :key="dict.value"
                  :value="dict.value"
                  :label="dict.label"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </template>
        <el-col :span="12">
          <el-form-item label="来文字号" prop="documentNo">
            <el-input v-model="formData.documentNo" placeholder="请输入来文字号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="公文标题" prop="title">
            <el-input v-model="formData.title" placeholder="请输入公文标题" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="密级" prop="secrecyLevel">
            <el-select v-model="formData.secrecyLevel" class="!w-1/1">
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
            <el-select v-model="formData.urgencyLevel" class="!w-1/1">
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
          <el-form-item label="收文日期" prop="receiveTime">
            <el-date-picker
              v-model="formData.receiveTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择收文日期"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="收文部门" prop="receiveDeptId">
            <DeptSelect
              v-model="formData.receiveDeptId"
              :disabled="!formData.sendId"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="主办人" prop="handlerUserId">
            <UserSelect v-model="formData.handlerUserId" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="领导批示" prop="instruction">
            <el-input
              v-model="formData.instruction"
              placeholder="请输入领导批示"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="办理结果" prop="result">
            <el-input
              v-model="formData.result"
              placeholder="请输入办理结果"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="办理期限" prop="deadlineTime">
            <el-date-picker
              v-model="formData.deadlineTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择办理期限"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="内容摘要" prop="summary">
            <el-input
              v-model="formData.summary"
              placeholder="请输入内容摘要"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              placeholder="请输入备注"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="附件" prop="fileUrls">
            <UploadFile
              v-model="formData.fileUrls!"
              :limit="10"
              :disabled="!!formData.sendId"
              :is-show-tip="!formData.sendId"
            />
          </el-form-item>
        </el-col>
        <!-- 正式公文 -->
        <el-col :span="24">
          <el-form-item label="正式公文" prop="formalFileUrl">
            <UploadFile
              v-model="formData.formalFileUrl!"
              :limit="1"
              :disabled="!!formData.sendId"
              :is-show-tip="!formData.sendId"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">保 存</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as ReceiveApi from '@/api/oa/officialdoc/receive'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import type { FormRules } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'OaOfficialDocReceiveForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const userStore = useUserStore() // 当前用户

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<ReceiveApi.OfficialDocReceiveVO>({
  id: undefined,
  title: '',
  documentNo: '',
  receiveType: 0,
  receiveTime: formatDate(new Date()),
  receiveDeptId: userStore.getUser.deptId || undefined,
  handlerUserId: undefined,
  secrecyLevel: 0,
  urgencyLevel: 0,
  instruction: '',
  result: '',
  deadlineTime: undefined,
  summary: '',
  remark: '',
  fileUrls: [],
  formalFileUrl: ''
}) // 表单数据
const formRules = reactive<FormRules>({
  title: [{ required: true, message: '公文标题不能为空', trigger: 'blur' }],
  secrecyLevel: [{ required: true, message: '密级不能为空', trigger: 'change' }],
  urgencyLevel: [{ required: true, message: '紧急程度不能为空', trigger: 'change' }],
  receiveType: [{ required: true, message: '收文类型不能为空', trigger: 'change' }],
  receiveTime: [{ required: true, message: '收文日期不能为空', trigger: 'change' }],
  receiveDeptId: [{ required: true, message: '收文部门不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ReceiveApi.getReceive(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value
    if (formType.value === 'create') {
      await ReceiveApi.createReceive(data)
      message.success(t('common.createSuccess'))
    } else {
      await ReceiveApi.updateReceive(data)
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
    title: '',
    documentNo: '',
    receiveType: 0,
    receiveTime: formatDate(new Date()),
    receiveDeptId: userStore.getUser.deptId || undefined,
    handlerUserId: undefined,
    secrecyLevel: 0,
    urgencyLevel: 0,
    instruction: '',
    result: '',
    deadlineTime: undefined,
    summary: '',
    remark: '',
    fileUrls: [],
    formalFileUrl: ''
  }
  formRef.value?.resetFields()
}
</script>
