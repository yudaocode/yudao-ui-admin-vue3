<template>
  <Dialog v-model="dialogVisible" title="提交绩效申诉" width="680px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-form-item label="退回评分节点" prop="reviewStageIds">
        <el-checkbox-group v-model="formData.reviewStageIds">
          <el-checkbox v-for="stage in completedReviewStages" :key="stage.id" :value="stage.id">
            {{ stage.name || '评分阶段' }}
            <span v-if="stage.handlerName">（{{ stage.handlerName }}）</span>
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="申诉原因" prop="appealReason">
        <el-input
          v-model="formData.appealReason"
          :rows="4"
          maxlength="500"
          placeholder="请输入申诉原因"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
      <el-form-item label="申诉附件" prop="appealFileUrls">
        <UploadFile
          v-model="formData.appealFileUrls"
          :file-size="20"
          :limit="5"
          directory="hrm/performance/appeal"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import * as PerformanceAssessmentApi from '@/api/hrm/portal/performance/assessment'
import type { PerformanceAssessmentStageVO } from '@/api/hrm/performance/assessment'
import { HrmPerformanceAssessmentStageStatus } from '@/views/hrm/utils/constants'

defineOptions({ name: 'HrmPortalPerformanceAppealForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const formLoading = ref(false) // 表单加载中
const formRef = ref<FormInstance>() // 表单 Ref
const completedReviewStages = ref<PerformanceAssessmentStageVO[]>([]) // 已完成的评分阶段
interface AppealFormData {
  assessmentId?: number
  appealReason: string
  appealFileUrls: string[]
  reviewStageIds: number[]
}
const formData = ref<AppealFormData>({
  assessmentId: undefined,
  appealReason: '',
  appealFileUrls: [],
  reviewStageIds: []
})
const formRules: FormRules = {
  reviewStageIds: [{ required: true, message: '请选择需要退回的评分节点', trigger: 'change' }],
  appealReason: [{ required: true, message: '申诉原因不能为空', trigger: 'blur' }]
}

/** 打开弹窗 */
async function open(assessmentId: number) {
  dialogVisible.value = true
  formLoading.value = true
  resetForm()
  formData.value.assessmentId = assessmentId
  try {
    // 获取表单数据
    const assessment = await PerformanceAssessmentApi.getPerformanceAssessment(assessmentId)
    completedReviewStages.value = (assessment.reviewStages || []).filter(
      (stage) => stage.id != null && stage.status === HrmPerformanceAssessmentStageStatus.PROCESSED
    )
    const latestStage = completedReviewStages.value[completedReviewStages.value.length - 1]
    formData.value.reviewStageIds = latestStage?.id ? [latestStage.id] : []
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开组件

const emit = defineEmits(['success']) // 定义组件事件

/** 提交表单 */
async function submitForm() {
  // 校验表单
  await formRef.value?.validate()
  if (!formData.value.assessmentId) {
    return
  }
  // 提交请求
  formLoading.value = true
  try {
    await PerformanceAssessmentApi.submitPerformanceAssessmentAppeal({
      assessmentId: formData.value.assessmentId,
      appealReason: formData.value.appealReason,
      appealFileUrls: formData.value.appealFileUrls,
      reviewStageIds: formData.value.reviewStageIds
    })
    message.success('绩效申诉已提交')
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
    assessmentId: undefined,
    appealReason: '',
    appealFileUrls: [],
    reviewStageIds: []
  }
  completedReviewStages.value = []
  formRef.value?.resetFields()
}
</script>
