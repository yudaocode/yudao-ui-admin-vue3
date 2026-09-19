<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="180px"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入标题" maxlength="255" />
      </el-form-item>
      <el-form-item label="紧急程度" prop="urgency">
        <el-select v-model="formData.urgency" placeholder="请选择紧急程度" class="!w-full">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_APPLY_URGENCY)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="工作交接人" prop="handoverUserId">
        <UserSelectV2 v-model="formData.handoverUserId" placeholder="请选择工作交接人" />
      </el-form-item>
      <el-form-item label="未完成事宜" prop="unfinishedWork">
        <el-input
          v-model="formData.unfinishedWork"
          placeholder="请输入未完成事宜"
          type="textarea"
          :rows="3"
        />
      </el-form-item>
      <el-form-item label="申请原因" prop="reason">
        <el-input
          v-model="formData.reason"
          maxlength="5000"
          placeholder="请输入申请原因"
          type="textarea"
          :rows="3"
        />
      </el-form-item>
      <el-form-item label="是否有费用报销未完成" prop="hasPendingReimbursement">
        <el-checkbox v-model="formData.hasPendingReimbursement">有费用报销未完成</el-checkbox>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">保 存</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as ResignApplyApi from '@/api/oa/resign'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import type { FormRules } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'OaResignApplyForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<ResignApplyApi.ResignApplyVO>({ hasPendingReimbursement: false }) // 表单数据
const formRules = reactive<FormRules>({
  unfinishedWork: [{ required: true, message: '未完成事宜不能为空', trigger: 'blur' }],
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  urgency: [{ required: true, message: '紧急程度不能为空', trigger: 'change' }],
  handoverUserId: [{ required: true, message: '工作交接人不能为空', trigger: 'change' }],
  reason: [{ required: true, message: '申请原因不能为空', trigger: 'blur' }],
  hasPendingReimbursement: [
    { required: true, message: '是否有费用报销未完成不能为空', trigger: 'change' }
  ]
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
      formData.value = await ResignApplyApi.getResignApply(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 提交表单 */
async function submitForm() {
  // 校验表单
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await ResignApplyApi.createResignApply(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await ResignApplyApi.updateResignApply(formData.value)
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
  formData.value = { hasPendingReimbursement: false }
  formRef.value?.resetFields()
}
</script>
