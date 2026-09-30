<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-form-item label="印章" prop="sealId">
        <OaSealSelect
          v-if="dialogVisible"
          v-model="formData.sealId"
          :selected-seal="{ id: formData.sealId, no: formData.sealNo, name: formData.sealName }"
          class="!w-full"
        />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="用印事由" prop="reason">
            <el-input
              v-model="formData.reason"
              placeholder="请输入用印事由"
              type="textarea"
              :rows="2"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用印类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择用印类型" class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_SEAL_APPLY_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用印方式" prop="mode">
            <el-select v-model="formData.mode" placeholder="请选择用印方式" class="!w-full">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_SEAL_USE_MODE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="文件标题" prop="documentTitle">
            <el-input
              v-model="formData.documentTitle"
              placeholder="请输入文件标题"
              maxlength="255"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="文件类型" prop="documentType">
            <el-input v-model="formData.documentType" placeholder="请输入文件类型" maxlength="64" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="文件份数" prop="documentCount">
            <el-input-number
              v-model="formData.documentCount"
              :min="1"
              :precision="0"
              controls-position="right"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="formData.type === OaSealApplyType.CONTRACT">
          <el-form-item label="合同金额" prop="contractPrice">
            <el-input-number
              v-model="formData.contractPrice"
              :min="0"
              :precision="2"
              controls-position="right"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="formData.type === OaSealApplyType.CONTRACT">
          <el-form-item label="合同对方" prop="contractParty">
            <el-input
              v-model="formData.contractParty"
              placeholder="请输入合同对方"
              maxlength="255"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="预计用印时间" prop="expectedUseTime">
            <el-date-picker
              v-model="formData.expectedUseTime"
              type="datetime"
              value-format="x"
              placeholder="请选择预计用印时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="formData.mode === OaSealUseMode.BORROW">
          <el-form-item label="预计归还时间" prop="expectedReturnTime">
            <el-date-picker
              v-model="formData.expectedReturnTime"
              type="datetime"
              value-format="x"
              placeholder="请选择预计归还时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="实际归还时间" prop="actualReturnTime">
            <el-date-picker
              v-model="formData.actualReturnTime"
              type="datetime"
              value-format="x"
              placeholder="请选择实际归还时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否紧急" prop="urgent">
            <el-switch v-model="formData.urgent" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              placeholder="请输入备注"
              type="textarea"
              :rows="2"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="附件" prop="fileUrls">
        <UploadFile v-model="formData.fileUrls!" :limit="5" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">保 存</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as SealApplyApi from '@/api/oa/seal/apply'
import OaSealSelect from '@/views/oa/seal/components/OaSealSelect.vue'
import type { FormRules } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { OaSealApplyType, OaSealUseMode } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaSealApplyForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<SealApplyApi.SealApplyVO>({ fileUrls: [] }) // 表单数据
const formRules = reactive<FormRules>({
  sealId: [{ required: true, message: '印章不能为空', trigger: 'change' }],
  reason: [{ required: true, message: '用印事由不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '用印类型不能为空', trigger: 'change' }],
  mode: [{ required: true, message: '用印方式不能为空', trigger: 'change' }],
  documentCount: [{ required: true, message: '文件份数不能为空', trigger: 'change' }],
  expectedUseTime: [{ required: true, message: '预计用印时间不能为空', trigger: 'change' }],
  urgent: [{ required: true, message: '是否紧急不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

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
      formData.value = await SealApplyApi.getSealApply(id)
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 保存草稿，提交审批由列表单独操作 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 1.1 校验表单
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 2. 保存申请
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      formData.value.id = await SealApplyApi.createSealApply(formData.value)
      formType.value = 'update'
    } else {
      await SealApplyApi.updateSealApply(formData.value)
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
  formData.value = {
    fileUrls: [],
    type: OaSealApplyType.CONTRACT,
    mode: OaSealUseMode.ONSITE,
    documentCount: 1,
    urgent: false,
    reason: '',
    documentTitle: '',
    documentType: '',
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
