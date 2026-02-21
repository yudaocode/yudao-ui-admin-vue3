<!-- MES 生产报工表单 -->
<template>
  <!-- TODO @AI：一行 3 个 -->
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <!-- TODO @AI：生成，前端处理；参考别的模块  -->
          <el-form-item label="报工单号" prop="code">
            <el-input v-model="formData.code" disabled placeholder="自动生成" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
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
      <el-row>
        <!-- TODO @芋艿：报告途径，是不是非必须？ -->
        <el-col :span="12">
          <el-form-item label="报工途径" prop="channel">
            <el-select
              v-model="formData.channel"
              placeholder="请选择报工途径"
              :disabled="isDetail"
              class="!w-1/1"
            >
              <el-option
                v-for="dict in getStrDictOptions(DICT_TYPE.MES_PRO_FEEDBACK_CHANNEL)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="批次号" prop="batchCode">
            <el-input
              v-model="formData.batchCode"
              placeholder="请输入批次号"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 工单选择 -->
      <!-- TODO @AI：生产工单 select； -->
      <el-row>
        <el-col :span="12">
          <el-form-item label="生产工单" prop="workOrderId">
            <el-select
              v-model="formData.workOrderId"
              filterable
              remote
              reserve-keyword
              :remote-method="searchWorkOrder"
              placeholder="请搜索工单编码/名称"
              :disabled="isDetail"
              class="!w-1/1"
              @change="handleWorkOrderChange"
            >
              <el-option
                v-for="item in workOrderOptions"
                :key="item.id"
                :label="item.code + ' - ' + item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="生产任务" prop="taskId">
            <el-select
              v-model="formData.taskId"
              filterable
              remote
              reserve-keyword
              :remote-method="searchTask"
              placeholder="请搜索任务编码"
              :disabled="isDetail || !formData.workOrderId"
              class="!w-1/1"
              @change="handleTaskChange"
            >
              <el-option
                v-for="item in taskOptions"
                :key="item.id"
                :label="item.code + ' - ' + item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 工作站 / 工序（任务选中后自动填充，也支持手动选择） -->
      <!-- TODO @AI：工作站 select； -->
      <el-row>
        <el-col :span="12">
          <el-form-item label="工作站" prop="workstationId">
            <el-select
              v-model="formData.workstationId"
              filterable
              remote
              reserve-keyword
              :remote-method="searchWorkstation"
              placeholder="请搜索工作站"
              :disabled="isDetail"
              class="!w-1/1"
            >
              <el-option
                v-for="item in workstationOptions"
                :key="item.id"
                :label="item.code + ' - ' + item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <!-- TODO @AI：生产任务 select； -->
        <el-col :span="12">
          <el-form-item label="工序" prop="processId">
            <el-input v-model="processDisplay" disabled placeholder="由任务自动带入" />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 物料 / 单位 / 工艺路线（自动填充，只读） -->
      <!-- TODO 下面的 itemDisplay、scheduledQuantity 不需要 -->
      <el-row>
        <el-col :span="12">
          <el-form-item label="产品物料" prop="itemId">
            <el-input v-model="itemDisplay" disabled placeholder="由任务自动带入" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排产数量" prop="scheduledQuantity">
            <el-input-number
              v-model="formData.scheduledQuantity"
              :min="0"
              :precision="2"
              disabled
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 数量区域 -->
      <el-divider content-position="left">报工数量</el-divider>
      <el-row>
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
      <el-row v-if="formData.unqualifiedQuantity > 0">
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
      <!-- TODO @AI：报工人、报工时间、审批人 -->
      <el-row>
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
import { ProWorkOrderApi } from '@/api/mes/pro/workorder'

// TODO @AI：方法注释、变量注释，参考别的模块；

defineOptions({ name: 'FeedbackForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('') // 'create' | 'update' | 'detail'

const formData = ref({
  id: undefined,
  type: undefined,
  channel: undefined,
  workstationId: undefined,
  routeId: undefined,
  processId: undefined,
  workOrderId: undefined,
  taskId: undefined,
  itemId: undefined,
  unitMeasureId: undefined,
  expireDate: undefined,
  batchCode: undefined,
  scheduledQuantity: 0,
  feedbackQuantity: 0,
  qualifiedQuantity: 0,
  unqualifiedQuantity: 0,
  uncheckQuantity: 0,
  laborScrapQuantity: 0,
  materialScrapQuantity: 0,
  otherScrapQuantity: 0,
  remark: undefined,
  code: undefined
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

/** 显示字段（只读） */
const processDisplay = ref('')
const itemDisplay = ref('')

// ==================== 远程搜索选项 ====================

const workOrderOptions = ref<any[]>([])
const taskOptions = ref<any[]>([])
const workstationOptions = ref<any[]>([])

/** 搜索工单 */
const searchWorkOrder = async (query: string) => {
  if (!query) return
  const data = await ProWorkOrderApi.getWorkOrderPage({
    pageNo: 1,
    pageSize: 20,
    code: query,
    status: 1
  })
  workOrderOptions.value = data.list
}

/** 搜索任务（按工单过滤） */
// TODO @芋艿：pro_task API 待迁移，暂用占位
const searchTask = async (query: string) => {
  if (!query || !formData.value.workOrderId) return
  // TODO @芋艿：待 pro_task 前端 API 迁移后，替换为 ProTaskApi.getTaskPage({ workOrderId, code: query })
  taskOptions.value = []
}

/** 搜索工作站 */
const searchWorkstation = async (query: string) => {
  if (!query) return
  // 使用工作站 API 搜索（这里用简单查询）
  // TODO @芋艿：如果有工作站搜索 API，可替换
  workstationOptions.value = []
}

/** 工单变更 */
const handleWorkOrderChange = (workOrderId: number) => {
  // 清空任务相关字段
  formData.value.taskId = undefined
  formData.value.routeId = undefined
  formData.value.processId = undefined
  formData.value.itemId = undefined
  formData.value.unitMeasureId = undefined
  formData.value.workstationId = undefined
  formData.value.scheduledQuantity = 0
  processDisplay.value = ''
  itemDisplay.value = ''
  taskOptions.value = []
  checkFlag.value = false
}

/** 任务变更：自动填充关联字段 */
const handleTaskChange = (taskId: number) => {
  const task = taskOptions.value.find((t: any) => t.id === taskId)
  if (!task) return
  formData.value.routeId = task.routeId
  formData.value.processId = task.processId
  formData.value.itemId = task.itemId
  formData.value.unitMeasureId = task.unitMeasureId
  formData.value.workstationId = task.workstationId
  formData.value.scheduledQuantity = task.quantity
  processDisplay.value = task.processCode ? task.processCode + ' - ' + task.processName : ''
  itemDisplay.value = task.itemCode ? task.itemCode + ' - ' + task.itemName : ''
  // TODO @芋艿：加载 checkFlag（查询 routeProcess）
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'detail' ? '报工详情' : t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const data = (await ProFeedbackApi.getFeedback(id)) as any
      formData.value = data
      // 填充显示字段
      processDisplay.value = data.processCode ? data.processCode + ' - ' + data.processName : ''
      itemDisplay.value = data.itemCode ? data.itemCode + ' - ' + data.itemName : ''
      checkFlag.value = data.checkFlag || false
      // 填充选项（让 select 能显示已选值）
      if (data.workOrderId) {
        workOrderOptions.value = [
          { id: data.workOrderId, code: data.workOrderCode, name: data.workOrderName }
        ]
      }
      if (data.taskId) {
        taskOptions.value = [{ id: data.taskId, code: data.taskCode, name: '' }]
      }
      if (data.workstationId) {
        workstationOptions.value = [
          { id: data.workstationId, code: data.workstationCode, name: data.workstationName }
        ]
      }
    } finally {
      formLoading.value = false
    }
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
    type: undefined,
    channel: undefined,
    workstationId: undefined,
    routeId: undefined,
    processId: undefined,
    workOrderId: undefined,
    taskId: undefined,
    itemId: undefined,
    unitMeasureId: undefined,
    expireDate: undefined,
    batchCode: undefined,
    scheduledQuantity: 0,
    feedbackQuantity: 0,
    qualifiedQuantity: 0,
    unqualifiedQuantity: 0,
    uncheckQuantity: 0,
    laborScrapQuantity: 0,
    materialScrapQuantity: 0,
    otherScrapQuantity: 0,
    remark: undefined,
    code: undefined
  }
  workOrderOptions.value = []
  taskOptions.value = []
  workstationOptions.value = []
  processDisplay.value = ''
  itemDisplay.value = ''
  checkFlag.value = false
  formRef.value?.resetFields()
}
</script>
