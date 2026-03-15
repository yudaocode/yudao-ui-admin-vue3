<!-- MES 生产任务列表（工单维度，排产对话框内使用） -->
<!-- TODO @芋艿：待 review -->
<template>
  <div>
    <!-- 操作栏 -->
    <div class="mb-10px">
      <el-button
        type="primary"
        plain
        @click="openForm('create')"
        v-hasPermi="['mes:pro-task:create']"
        :disabled="disabled"
      >
        <Icon icon="ep:plus" class="mr-5px" /> 新增任务
      </el-button>
    </div>

    <!-- 任务列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="任务编码" align="center" prop="code" width="140" />
      <el-table-column label="任务名称" align="center" prop="name" min-width="150" />
      <el-table-column label="工作站" align="center" prop="workstationName" width="120" />
      <el-table-column label="排产数量" align="center" prop="quantity" width="100" />
      <el-table-column label="已生产" align="center" prop="producedQuantity" width="80" />
      <el-table-column label="合格" align="center" prop="qualifyQuantity" width="80" />
      <el-table-column
        label="开始时间"
        align="center"
        prop="startTime"
        :formatter="dateFormatter"
        width="170"
      />
      <el-table-column label="时长(天)" align="center" prop="duration" width="80" />
      <el-table-column
        label="结束时间"
        align="center"
        prop="endTime"
        :formatter="dateFormatter"
        width="170"
      />
      <el-table-column label="颜色" align="center" prop="colorCode" width="60">
        <template #default="scope">
          <div
            :style="{
              background: scope.row.colorCode || '#00AEF3',
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              margin: '0 auto'
            }"
          ></div>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_TASK_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <!-- 草稿(0)：编辑/删除/开始 -->
          <template v-if="scope.row.status === MesProTaskStatusEnum.NORMAL">
            <el-button
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['mes:pro-task:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['mes:pro-task:delete']"
            >
              删除
            </el-button>
          </template>
          <!-- 进行中(1)：暂停/完成/取消 -->
          <template v-if="scope.row.status === MesProTaskStatusEnum.START">
            <el-button
              link
              type="warning"
              @click="handleChangeStatus(scope.row.id, MesProTaskStatusEnum.PAUSE, '暂停')"
              v-hasPermi="['mes:pro-task:update']"
            >
              暂停
            </el-button>
            <el-button
              link
              type="success"
              @click="handleChangeStatus(scope.row.id, MesProTaskStatusEnum.FINISHED, '完成')"
              v-hasPermi="['mes:pro-task:update']"
            >
              完成
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleChangeStatus(scope.row.id, MesProTaskStatusEnum.CANCELED, '取消')"
              v-hasPermi="['mes:pro-task:update']"
            >
              取消
            </el-button>
          </template>
          <!-- 暂停(2)：继续/完成/取消 -->
          <template v-if="scope.row.status === MesProTaskStatusEnum.PAUSE">
            <el-button
              link
              type="primary"
              @click="handleChangeStatus(scope.row.id, MesProTaskStatusEnum.START, '继续')"
              v-hasPermi="['mes:pro-task:update']"
            >
              继续
            </el-button>
            <el-button
              link
              type="success"
              @click="handleChangeStatus(scope.row.id, MesProTaskStatusEnum.FINISHED, '完成')"
              v-hasPermi="['mes:pro-task:update']"
            >
              完成
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleChangeStatus(scope.row.id, MesProTaskStatusEnum.CANCELED, '取消')"
              v-hasPermi="['mes:pro-task:update']"
            >
              取消
            </el-button>
          </template>
          <!-- 所有状态：详情 -->
          <el-button
            link
            type="primary"
            @click="openForm('detail', scope.row.id)"
            v-hasPermi="['mes:pro-task:query']"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- 添加/编辑/详情任务弹窗 -->
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
                v-for="item in props.processList"
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
            <MdWorkstationSelect v-model="formData.workstationId" :disabled="isDetail" />
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
      <el-row v-if="taskFormType !== 'create'">
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
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { ProTaskApi, ProTaskVO } from '@/api/mes/pro/task'
import { ProRouteProcessVO } from '@/api/mes/pro/route/process'
import { MesProTaskStatusEnum } from '@/views/mes/utils/constants'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'

defineOptions({ name: 'ProTaskList' })

const props = defineProps<{
  workOrderId: number
  workOrderCode?: string
  workOrderName?: string
  routeId: number
  processId: number
  itemId?: number
  unitMeasureId?: number
  processList?: ProRouteProcessVO[]
  disabled?: boolean
}>()

const { t } = useI18n()
const message = useMessage()

// ==================== 列表 ====================
const loading = ref(false)
const list = ref<ProTaskVO[]>([])

/** 查询任务列表（按工单+工序过滤） */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProTaskApi.getTaskPage({
      workOrderId: props.workOrderId,
      processId: props.processId,
      pageNo: 1,
      pageSize: 100
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 删除任务 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProTaskApi.deleteTask(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 变更任务状态 */
const handleChangeStatus = async (id: number, status: number, actionName: string) => {
  try {
    await message.confirm(`确认要${actionName}该任务吗？`)
    await ProTaskApi.updateTask({ id, status } as any)
    message.success(`任务已${actionName}`)
    await getList()
  } catch {}
}

// ==================== 添加/编辑/详情表单 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const taskFormType = ref('')
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

const isDetail = computed(() => taskFormType.value === 'detail')

/** 自动计算结束时间：startTime + duration * 8h */
const computeEndTime = () => {
  if (formData.value.startTime && formData.value.duration) {
    const start =
      typeof formData.value.startTime === 'number'
        ? formData.value.startTime
        : new Date(formData.value.startTime).getTime()
    formData.value.endTime = start + formData.value.duration * 8 * 3600 * 1000
  }
}

// 监听开始时间变化也重新计算
watch(
  () => formData.value.startTime,
  () => computeEndTime()
)

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'detail' ? '任务详情' : type === 'create' ? '新增任务' : '编辑任务'
  taskFormType.value = type
  resetForm()

  if (type === 'create') {
    // 新增时预填工单信息
    formData.value.workOrderId = props.workOrderId
    formData.value.routeId = props.routeId
    formData.value.processId = props.processId
    formData.value.itemId = props.itemId
    formData.value.unitMeasureId = props.unitMeasureId
    workOrderInfo.value = `${props.workOrderCode || ''} ${props.workOrderName || ''}`
  } else if (id) {
    // 编辑/详情：加载任务数据
    formLoading.value = true
    try {
      const data = await ProTaskApi.getTask(id)
      formData.value = data
      workOrderInfo.value = `${data.workOrderCode || ''} ${data.workOrderName || ''}`
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProTaskVO
    if (taskFormType.value === 'create') {
      await ProTaskApi.createTask(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProTaskApi.updateTask(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    await getList()
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

// 监听 processId 切换重新加载
watch(
  () => props.processId,
  () => getList()
)

onMounted(() => getList())

defineExpose({ getList })
</script>
