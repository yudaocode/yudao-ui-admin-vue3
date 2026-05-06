<!-- MES 生产任务列表（工单维度，排产对话框内使用） -->
<template>
  <div>
    <!-- DONE @AI：详情时，整个都不展示 -->
    <!-- 操作栏 -->
    <div v-if="!disabled" class="mb-10px">
      <el-button
        type="primary"
        plain
        @click="openForm('create')"
        v-hasPermi="['mes:pro-task:create']"
      >
        <Icon icon="ep:plus" class="mr-5px" /> 新增任务
      </el-button>
    </div>

    <!-- 任务列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="任务编码" align="center" prop="code" width="140" />
      <el-table-column label="任务名称" align="center" prop="name" min-width="150" />
      <el-table-column label="工作站编号" align="center" prop="workstationCode" width="120" />
      <el-table-column label="工作站名称" align="center" prop="workstationName" width="120" />
      <el-table-column label="排产数量" align="center" prop="quantity" width="100" />
      <el-table-column label="已生产数量" align="center" prop="producedQuantity" width="100" />
      <el-table-column
        label="开始生产时间"
        align="center"
        prop="startTime"
        :formatter="dateFormatter"
        width="170"
      />
      <el-table-column label="生产时长" align="center" prop="duration" width="80" />
      <el-table-column
        label="预计完成时间"
        align="center"
        prop="endTime"
        :formatter="dateFormatter"
        width="170"
      />
      <el-table-column label="显示颜色" align="center" prop="colorCode" width="100">
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
      <el-table-column v-if="!disabled" label="操作" align="center" width="160" fixed="right">
        <template #default="scope">
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
      </el-table-column>
    </el-table>
  </div>

  <!-- 添加/编辑任务弹窗 -->
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="工作站" prop="workstationId">
            <MdWorkstationSelect v-model="formData.workstationId" :disabled="isDetail" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="排产数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :min="0.01"
              :precision="2"
              class="!w-1/1"
              :disabled="isDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="甘特颜色" prop="colorCode">
            <el-color-picker v-model="formData.colorCode" :disabled="isDetail" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
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
        <el-col :span="8">
          <el-form-item label="生产时长" prop="duration">
            <el-input-number
              v-model="formData.duration"
              :min="1"
              :precision="0"
              class="!w-1/1"
              :disabled="isDetail"
              @change="handleDurationChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
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
import { ProTaskApi, ProTaskVO } from '@/api/mes/pro/task'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'

defineOptions({ name: 'ProTaskList' })

const props = defineProps<{
  workOrderId: number
  routeId: number
  processId: number
  itemId?: number
  colorCode?: string
  disabled?: boolean
}>()

const { t } = useI18n()
const message = useMessage()

// ==================== 列表 ====================
const loading = ref(false)
const list = ref<ProTaskVO[]>([])

// ==================== 表单弹窗 ====================
const dialogVisible = ref(false)
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增生产任务',
    update: '编辑生产任务',
    detail: '生产任务详情'
  }
  return titles[formType.value] || ''
})
const formLoading = ref(false)
const formType = ref('')
const isDetail = computed(() => formType.value === 'detail')
const formData = ref<ProTaskVO>({} as unknown as ProTaskVO)
const formRules = reactive({
  workstationId: [{ required: true, message: '工作站不能为空', trigger: 'change' }],
  quantity: [
    { required: true, message: '排产数量不能为空', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '排产数量必须大于 0', trigger: 'blur' }
  ],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'change' }],
  duration: [{ required: true, message: '生产时长不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 查询任务列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProTaskApi.getTaskPage({
      workOrderId: props.workOrderId,
      routeId: props.routeId,
      processId: props.processId,
      pageNo: 1,
      pageSize: 100
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  if (type === 'create') {
    formData.value.workOrderId = props.workOrderId!
    formData.value.routeId = props.routeId!
    formData.value.processId = props.processId!
    formData.value.itemId = props.itemId!
    formData.value.colorCode = props.colorCode || '#00AEF3'
  } else if (id) {
    formLoading.value = true
    try {
      formData.value = await ProTaskApi.getTask(id)
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
    if (formType.value === 'create') {
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

/** 删除任务 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProTaskApi.deleteTask(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 计算结束时间：开始时间 + 生产时长 × 8小时 */
const handleDurationChange = () => {
  if (formData.value.startTime && formData.value.duration) {
    const start =
      typeof formData.value.startTime === 'number'
        ? formData.value.startTime
        : new Date(formData.value.startTime).getTime()
    formData.value.endTime = start + formData.value.duration * 8 * 3600 * 1000
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
    quantity: undefined,
    startTime: undefined,
    duration: 1,
    endTime: undefined,
    colorCode: undefined,
    status: undefined,
    remark: undefined
  } as unknown as ProTaskVO
  formRef.value?.resetFields()
}

/** 监听开始时间变化重新计算结束时间 */
watch(
  () => formData.value.startTime,
  () => handleDurationChange()
)

/** 监听 processId 切换重新加载 */
watch(
  () => props.processId,
  () => getList()
)

/** 初始化 */
onMounted(() => {
  getList()
})

defineExpose({ getList })
</script>
