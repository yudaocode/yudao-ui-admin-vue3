<!-- MES 生产报工表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <!-- 基本信息 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="报工单号" prop="code">
            <el-input v-model="formData.code" disabled placeholder="自动生成" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="报工类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择报工类型"
              :disabled="isDetail"
              class="!w-1/1"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_FEEDBACK_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 工单 / 任务 / 工作站 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="生产工单" prop="workOrderId">
            <ProWorkOrderSelect
              v-model="formData.workOrderId"
              :disabled="isDetail"
              placeholder="请选择工单"
              @change="handleWorkOrderChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产任务" prop="taskId">
            <ProTaskSelect
              v-model="formData.taskId"
              :workOrderId="formData.workOrderId"
              :disabled="isDetail || !formData.workOrderId"
              placeholder="请选择任务"
              @change="handleTaskChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工作站" prop="workstationId">
            <MdWorkstationSelect
              v-model="formData.workstationId"
              :disabled="isDetail"
              placeholder="请选择工作站"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 工序 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="工序" prop="processId">
            <el-input v-model="processDisplay" disabled placeholder="由任务自动带入" />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 数量区域 -->
      <el-divider content-position="left">报工数量</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="报工数量" prop="feedbackQuantity">
            <el-input-number
              v-model="formData.feedbackQuantity"
              :min="0"
              :precision="2"
              :disabled="isDetail"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <!-- TODO @芋艿：在评审下 -->
        <el-col :span="8" v-if="!checkFlag">
          <el-form-item label="合格品数量" prop="qualifiedQuantity">
            <el-input-number
              v-model="formData.qualifiedQuantity"
              :min="0"
              :precision="2"
              :disabled="isDetail"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <!-- TODO @芋艿：在评审下 -->
        <el-col :span="8" v-if="!checkFlag">
          <el-form-item label="不良品数量" prop="unqualifiedQuantity">
            <el-input-number
              v-model="formData.unqualifiedQuantity"
              :min="0"
              :precision="2"
              :disabled="isDetail"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <!-- TODO @芋艿：在评审下 -->
        <el-col :span="8" v-if="checkFlag">
          <el-form-item label="待检测数量">
            <el-input-number
              v-model="formData.uncheckQuantity"
              :min="0"
              :precision="2"
              :disabled="isDetail"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 废品分类（不良品>0 时展开） -->
      <!-- TODO @芋艿：在评审下 -->
      <el-row :gutter="20" v-if="formData.unqualifiedQuantity > 0">
        <el-col :span="8">
          <el-form-item label="工废数量">
            <el-input-number
              v-model="formData.laborScrapQuantity"
              :min="0"
              :precision="2"
              :disabled="isDetail"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="料废数量">
            <el-input-number
              v-model="formData.materialScrapQuantity"
              :min="0"
              :precision="2"
              :disabled="isDetail"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="其他废品">
            <el-input-number
              v-model="formData.otherScrapQuantity"
              :min="0"
              :precision="2"
              :disabled="isDetail"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 报工人 / 报工时间 / 审核人 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="报工人" prop="feedbackUserId">
            <UserSelect
              v-model="formData.feedbackUserId"
              :disabled="isDetail"
              placeholder="请选择报工人"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="报工时间" prop="feedbackTime">
            <el-date-picker
              v-model="formData.feedbackTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择报工时间"
              :disabled="isDetail"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="审核人" prop="approveUserId">
            <UserSelect
              v-model="formData.approveUserId"
              :disabled="isDetail"
              placeholder="请选择审核人"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 备注 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer v-if="!isDetail">
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { ProFeedbackApi, ProFeedbackVO } from '@/api/mes/pro/feedback'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import ProTaskSelect from '@/views/mes/pro/task/components/ProTaskSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'

defineOptions({ name: 'FeedbackForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('') // 'create' | 'update' | 'detail'
const formData = ref<Record<string, any>>({
  id: undefined,
  code: undefined,
  type: undefined,
  workstationId: undefined,
  routeId: undefined,
  processId: undefined,
  workOrderId: undefined,
  taskId: undefined,
  expireDate: undefined,
  feedbackQuantity: 0,
  qualifiedQuantity: 0,
  unqualifiedQuantity: 0,
  uncheckQuantity: 0,
  laborScrapQuantity: 0,
  materialScrapQuantity: 0,
  otherScrapQuantity: 0,
  feedbackUserId: undefined,
  feedbackTime: undefined,
  approveUserId: undefined,
  remark: undefined
})
const formRules = reactive({
  type: [{ required: true, message: '报工类型不能为空', trigger: 'change' }],
  workOrderId: [{ required: true, message: '生产工单不能为空', trigger: 'change' }],
  taskId: [{ required: true, message: '生产任务不能为空', trigger: 'change' }],
  workstationId: [{ required: true, message: '工作站不能为空', trigger: 'change' }],
  feedbackQuantity: [{ required: true, message: '报工数量不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 是否为详情模式 */
const isDetail = computed(() => formType.value === 'detail')

/** 是否需要检验（checkFlag） */
const checkFlag = ref(false)

/** 工序显示（只读） */
const processDisplay = ref('')

// ==================== 级联选择回调 ====================

/** 工单变更：清空任务相关字段 */
const handleWorkOrderChange = () => {
  formData.value.taskId = undefined
  formData.value.routeId = undefined
  formData.value.processId = undefined
  formData.value.workstationId = undefined
  processDisplay.value = ''
  checkFlag.value = false
}

/** 任务变更：自动填充关联字段 */
const handleTaskChange = (task: any) => {
  if (!task) {
    return
  }
  formData.value.routeId = task.routeId
  formData.value.processId = task.processId
  formData.value.workstationId = task.workstationId
  processDisplay.value = task.processCode ? task.processCode + ' - ' + task.processName : ''
  // TODO @芋艿：加载 checkFlag（查询 routeProcess）
}

// ==================== 报工单编号生成 ====================

/** 生成报工单编号（前端生成） */
// TODO @芋艿：这块的生成逻辑；
const generateCode = () => {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const dateStr =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return 'FB' + dateStr + random
}

// ==================== 弹窗操作 ====================

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  // TODO @AI：搞成 computed
  dialogTitle.value =
    type === 'detail'
      ? '查看生产报工记录'
      : type === 'create'
        ? '添加生产报工记录'
        : '修改生产报工记录'
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const data = await ProFeedbackApi.getFeedback(id)
      formData.value = data as any
      // 填充显示字段
      processDisplay.value = data.processCode ? data.processCode + ' - ' + data.processName : ''
      checkFlag.value = (data as any).checkFlag || false
    } finally {
      formLoading.value = false
    }
  } else {
    // 创建模式：自动生成报工单号
    formData.value.code = generateCode()
  }
}

defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProFeedbackVO
    if (formType.value === 'create') {
      await ProFeedbackApi.createFeedback(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProFeedbackApi.updateFeedback(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    type: undefined,
    workstationId: undefined,
    routeId: undefined,
    processId: undefined,
    workOrderId: undefined,
    taskId: undefined,
    expireDate: undefined,
    feedbackQuantity: 0,
    qualifiedQuantity: 0,
    unqualifiedQuantity: 0,
    uncheckQuantity: 0,
    laborScrapQuantity: 0,
    materialScrapQuantity: 0,
    otherScrapQuantity: 0,
    feedbackUserId: undefined,
    feedbackTime: undefined,
    approveUserId: undefined,
    remark: undefined
  }
  processDisplay.value = ''
  checkFlag.value = false
  formRef.value?.resetFields()
}
</script>
