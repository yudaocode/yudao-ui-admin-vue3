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
      <!-- 数量区域 -->
      <el-divider content-position="left">报工数量</el-divider>
      <!-- 非质检工序：报工数量(只读自动计算) + 合格品 + 不良品 -->
      <el-row :gutter="20" v-if="!checkFlag">
        <el-col :span="8">
          <el-form-item label="报工数量" prop="feedbackQuantity">
            <el-input-number
              v-model="formData.feedbackQuantity"
              :min="0"
              :precision="2"
              disabled
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="合格品数量" prop="qualifiedQuantity">
            <el-input-number
              v-model="formData.qualifiedQuantity"
              :min="0"
              :precision="2"
              :disabled="isDetail"
              class="!w-1/1"
              @change="handleQuantityChanged"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="不良品数量" prop="unqualifiedQuantity">
            <el-input-number
              v-model="formData.unqualifiedQuantity"
              :min="0"
              :precision="2"
              :disabled="isDetail"
              class="!w-1/1"
              @change="handleQuantityChanged"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 质检工序：只填报工数量 -->
      <el-row :gutter="20" v-else>
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
      </el-row>
      <!-- 废品分类（非质检工序 且 不良品>0 时展开） -->
      <el-row :gutter="20" v-if="!checkFlag && formData.unqualifiedQuantity > 0">
        <el-col :span="8">
          <el-form-item label="工废数量">
            <el-input-number
              v-model="formData.laborScrapQuantity"
              :min="0"
              :precision="2"
              :disabled="isDetail"
              class="!w-1/1"
              @change="handleScrapChanged"
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
              @change="handleScrapChanged"
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
              @change="handleScrapChanged"
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
              value-format="x"
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
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { ProFeedbackApi, ProFeedbackVO } from '@/api/mes/pro/feedback'
import { ProRouteProcessApi } from '@/api/mes/pro/route/process'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import ProTaskSelect from '@/views/mes/pro/task/components/ProTaskSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'FeedbackForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const dialogTitle = computed(() => {
  if (formType.value === 'detail') {
    return '查看生产报工记录'
  }
  if (formType.value === 'create') {
    return '添加生产报工记录'
  }
  return '修改生产报工记录'
})
const formData = ref<Record<string, any>>({
  id: undefined,
  code: undefined,
  type: undefined,
  workstationId: undefined,
  routeId: undefined,
  processId: undefined,
  workOrderId: undefined,
  taskId: undefined,
  itemId: undefined,
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
  feedbackQuantity: [{ required: true, message: '报工数量不能为空', trigger: 'blur' }],
  feedbackUserId: [{ required: true, message: '报工人不能为空', trigger: 'change' }],
  feedbackTime: [{ required: true, message: '报工时间不能为空', trigger: 'change' }],
  approveUserId: [{ required: true, message: '审核人不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const isDetail = computed(() => formType.value === 'detail') // 是否为详情模式
const checkFlag = ref(true) // 是否需要检验（默认 true，未选任务时只展示报工数量）

// ==================== 级联选择回调 ====================

/** 加载工序的 checkFlag */
const loadCheckFlag = async (routeId?: number, processId?: number) => {
  if (!routeId || !processId) {
    checkFlag.value = true
    return
  }
  try {
    const routeProcess = await ProRouteProcessApi.getRouteProcessByRouteAndProcess(
      routeId,
      processId
    )
    checkFlag.value = routeProcess?.checkFlag ?? false
  } catch {
    checkFlag.value = true
  }
}

/** 合格品/不良品变更：自动计算报工数量 = 合格 + 不良 */
const handleQuantityChanged = () => {
  formData.value.feedbackQuantity =
    (formData.value.qualifiedQuantity || 0) + (formData.value.unqualifiedQuantity || 0)
}

/** 废品明细变更：自动计算不良品数量 = 工废 + 料废 + 其他 */
const handleScrapChanged = () => {
  formData.value.unqualifiedQuantity =
    (formData.value.laborScrapQuantity || 0) +
    (formData.value.materialScrapQuantity || 0) +
    (formData.value.otherScrapQuantity || 0)
  handleQuantityChanged()
}

/** 工单变更：清空任务相关字段 */
const handleWorkOrderChange = () => {
  formData.value.taskId = undefined
  formData.value.routeId = undefined
  formData.value.processId = undefined
  formData.value.workstationId = undefined
  formData.value.itemId = undefined
  checkFlag.value = true
}

/** 任务变更：自动填充关联字段 */
const handleTaskChange = async (task: any) => {
  if (!task) {
    return
  }
  formData.value.routeId = task.routeId
  formData.value.processId = task.processId
  formData.value.workstationId = task.workstationId
  formData.value.itemId = task.itemId
  await loadCheckFlag(task.routeId, task.processId)
}

/** 生成报工单编号 */
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
  formType.value = type
  resetForm()
  // 修改/详情时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await ProFeedbackApi.getFeedback(id)
      formData.value = data as any
      await loadCheckFlag(data.routeId, data.processId)
    } finally {
      formLoading.value = false
    }
  } else {
    // 创建模式：自动生成报工单号 + 默认报工人为当前用户
    formData.value.code = generateCode()
    formData.value.feedbackUserId = useUserStore().getUser.id
  }
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProFeedbackVO
    // 提交前根据 checkFlag 对齐数量
    if (checkFlag.value) {
      // 质检工序：报工数量即待检数量，合格/不良/废品归零
      data.uncheckQuantity = data.feedbackQuantity
      data.qualifiedQuantity = 0
      data.unqualifiedQuantity = 0
      data.laborScrapQuantity = 0
      data.materialScrapQuantity = 0
      data.otherScrapQuantity = 0
    } else {
      // 非质检工序：报工数量 = 合格 + 不良，待检归零
      data.feedbackQuantity = (data.qualifiedQuantity || 0) + (data.unqualifiedQuantity || 0)
      data.uncheckQuantity = 0
    }
    // 执行提交
    if (formType.value === 'create') {
      await ProFeedbackApi.createFeedback(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProFeedbackApi.updateFeedback(data)
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
    itemId: undefined,
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
  checkFlag.value = true
  formRef.value?.resetFields()
}
</script>
