<!-- MES 生产任务表单 -->
<!-- TODO @芋艿：晚点在 review -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="800px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="所属工单" prop="workOrderId">
            <el-input :model-value="workOrderInfo" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工序" prop="processId">
            <el-select
              v-model="formData.processId"
              placeholder="请选择工序"
              class="!w-1/1"
              :disabled="isDetail"
            >
              <el-option
                v-for="item in processList"
                :key="item.processId"
                :label="item.processName"
                :value="item.processId"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="工作站" prop="workstationId">
            <MdWorkstationSelect
              v-model="formData.workstationId"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排产数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :min="0"
              :precision="2"
              class="!w-1/1"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              placeholder="请选择开始时间"
              value-format="x"
              class="!w-1/1"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="生产时长(工作日)" prop="duration">
            <el-input-number
              v-model="formData.duration"
              :min="1"
              :precision="0"
              class="!w-1/1"
              :disabled="isDetail"
              @change="computeEndTime"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="结束时间">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              disabled
              value-format="x"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="甘特颜色" prop="colorCode">
            <el-color-picker v-model="formData.colorCode" :disabled="isDetail" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-if="formType !== 'create'">
        <el-col :span="12">
          <el-form-item label="任务状态">
            <dict-tag :type="DICT_TYPE.MES_PRO_TASK_STATUS" :value="formData.status" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              type="textarea"
              v-model="formData.remark"
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
import { DICT_TYPE } from '@/utils/dict'
import { ProTaskApi, ProTaskVO } from '@/api/mes/pro/task'
import { ProRouteProcessVO } from '@/api/mes/pro/route/process'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'

defineOptions({ name: 'ProTaskForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')

const formData = ref({
  id: undefined,
  workOrderId: undefined,
  workstationId: undefined,
  routeId: undefined,
  processId: undefined,
  itemId: undefined,
  unitMeasureId: undefined,
  quantity: undefined,
  startTime: undefined,
  duration: 1,
  endTime: undefined,
  colorCode: '#00AEF3',
  status: undefined,
  remark: undefined
})

const formRules = reactive({
  workstationId: [{ required: true, message: '工作站不能为空', trigger: 'change' }],
  processId: [{ required: true, message: '工序不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '排产数量不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'change' }],
  duration: [{ required: true, message: '生产时长不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 工单信息（只读展示） */
const workOrderInfo = ref('')
/** 工序列表（从工艺路线工序加载） */
const processList = ref<ProRouteProcessVO[]>([])

const isDetail = computed(() => formType.value === 'detail')

/** 自动计算结束时间：startTime + duration * 8h */
const computeEndTime = () => {
  if (formData.value.startTime && formData.value.duration) {
    const start = typeof formData.value.startTime === 'number'
      ? formData.value.startTime
      : new Date(formData.value.startTime).getTime()
    formData.value.endTime = start + formData.value.duration * 8 * 3600 * 1000
  }
}

// 监听开始时间变化也重新计算
watch(() => formData.value.startTime, () => computeEndTime())

/** 打开弹窗 */
const open = async (
  type: string,
  params: {
    id?: number
    workOrderId?: number
    workOrderCode?: string
    workOrderName?: string
    routeId?: number
    processId?: number
    itemId?: number
    unitMeasureId?: number
    processList?: ProRouteProcessVO[]
  }
) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'detail' ? '任务详情' : t('action.' + type)
  formType.value = type
  resetForm()

  // 设置工序列表
  if (params.processList) {
    processList.value = params.processList
  }

  if (type === 'create') {
    // 新增时预填工单信息
    formData.value.workOrderId = params.workOrderId
    formData.value.routeId = params.routeId
    formData.value.processId = params.processId
    formData.value.itemId = params.itemId
    formData.value.unitMeasureId = params.unitMeasureId
    workOrderInfo.value = `${params.workOrderCode || ''} ${params.workOrderName || ''}`
  } else if (params.id) {
    // 编辑/详情
    formLoading.value = true
    try {
      const data = await ProTaskApi.getTask(params.id)
      formData.value = data
      workOrderInfo.value = `${data.workOrderCode || ''} ${data.workOrderName || ''}`
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
    const data = formData.value as unknown as ProTaskVO
    if (formType.value === 'create') {
      await ProTaskApi.createTask(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProTaskApi.updateTask(data)
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
    workOrderId: undefined,
    workstationId: undefined,
    routeId: undefined,
    processId: undefined,
    itemId: undefined,
    unitMeasureId: undefined,
    quantity: undefined,
    startTime: undefined,
    duration: 1,
    endTime: undefined,
    colorCode: '#00AEF3',
    status: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
