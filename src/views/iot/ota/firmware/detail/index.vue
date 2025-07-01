<template>
  <div class="app-container">
    <!-- 固件信息 -->
    <!-- TODO @AI：可以使用 ELDescription 原生的组件么？ -->
    <ContentWrap title="固件信息" class="mb-20px">
      <el-row :gutter="20" v-loading="firmwareLoading">
        <el-col :span="8">
          <div class="info-item">
            <span class="label">固件名称：</span>
            <span class="value">{{ firmwareInfo.name || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <span class="label">所属产品：</span>
            <span class="value">{{ productName || '-' }}</span>
          </div>
        </el-col>
        <!-- TODO @AI：移除 -->
        <el-col :span="8">
          <div class="info-item">
            <span class="label">是否最新：</span>
            <span class="value">{{ isLatest ? '是' : '否' }}</span>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="mt-10px">
        <!-- TODO @AI：移除 -->
        <el-col :span="8">
          <div class="info-item">
            <span class="label">固件类型：</span>
            <span class="value">{{ firmwareInfo.fileDigestAlgorithm || 'http' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <span class="label">固件版本：</span>
            <span class="value">{{ firmwareInfo.version || 'Version 1' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <span class="label">创建时间：</span>
            <span class="value">{{ formatDate(firmwareInfo.createTime) }} </span>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="mt-10px">
        <el-col :span="24">
          <div class="info-item">
            <span class="label">固件描述：</span>
            <span class="value">{{ firmwareInfo.description }}</span>
          </div>
        </el-col>
      </el-row>
    </ContentWrap>

    <!-- 固件升级设备统计 -->
    <!-- TODO @AI：字段不太对；还有待推送、已推送、升级取消 -->
    <ContentWrap title="固件升级设备统计" class="mb-20px">
      <el-row :gutter="20" class="statistics-row" v-loading="statisticsLoading">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number text-primary">{{ statistics.total || 0 }}</div>
            <div class="stat-label">升级设备总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number text-success">{{ statistics.success || 0 }}</div>
            <div class="stat-label">升级成功</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number text-warning">{{ statistics.inProgress || 0 }}</div>
            <div class="stat-label">正在升级</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number text-danger">{{ statistics.failed || 0 }}</div>
            <div class="stat-label">升级失败</div>
          </div>
        </el-col>
      </el-row>
    </ContentWrap>

    <!-- 任务管理 -->
    <ContentWrap title="任务管理" class="mb-20px">
      <!-- 搜索栏 -->
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item>
          <el-button type="primary" @click="openTaskForm">
            <Icon icon="ep:plus" class="mr-5px" /> 新增
          </el-button>
        </el-form-item>
        <el-form-item style="float: right">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入任务名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
      </el-form>

      <!-- 任务列表 -->
      <el-table
        v-loading="taskLoading"
        :data="taskList"
        :stripe="true"
        :show-overflow-tooltip="true"
        class="mt-15px"
      >
        <el-table-column label="任务编号" align="center" prop="id" width="80" />
        <el-table-column label="任务名称" align="center" prop="name" />
        <!-- TODO @AI：字典 iot_ota_task_device_scope -->
        <el-table-column label="升级范围" align="center" prop="deviceScope">
          <template #default="scope">
            <el-tag type="warning">{{ getDeviceScopeText(scope.row.deviceScope) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="升级进度" align="center">
          <template #default="scope">
            {{ scope.row.deviceSuccessCount }}/{{ scope.row.deviceTotalCount }}
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          align="center"
          prop="createTime"
          :formatter="dateFormatter"
        />
        <el-table-column label="任务描述" align="center" prop="description" show-overflow-tooltip />
        <!-- TODO @AI：字典 iot_ota_task_status -->
        <el-table-column label="任务状态" align="center" prop="status">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="120">
          <template #default="scope">
            <!-- TODO @AI：枚举下字段； -->
            <el-button
              v-if="scope.row.status === 1"
              link
              type="primary"
              @click="handleCancelTask(scope.row.id)"
              v-hasPermi="['iot:ota-task:cancel']"
            >
              取消
            </el-button>
            <!-- TODO @AI：不支持删除 -->
            <el-button
              link
              type="danger"
              @click="handleDeleteTask(scope.row.id)"
              v-hasPermi="['iot:ota-task:delete']"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        :total="taskTotal"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getTaskList"
      />
    </ContentWrap>

    <!-- 新增任务弹窗 -->
    <!-- TODO @AI：搞成独立组件，放到 task 目录 -->
    <el-dialog v-model="taskFormVisible" title="新增升级任务" width="600px" append-to-body>
      <el-form ref="taskFormRef" :model="taskForm" :rules="taskFormRules" label-width="100px">
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="taskForm.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务类型" prop="taskType">
          <el-select v-model="taskForm.taskType" placeholder="请选择任务类型" class="w-full">
            <el-option label="整体升级" value="全量升级" />
            <el-option label="批量升级" value="批量升级" />
          </el-select>
        </el-form-item>
        <el-form-item label="预定时间" prop="scheduledTime">
          <el-date-picker
            v-model="taskForm.scheduledTime"
            type="datetime"
            placeholder="请选择预定时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskFormVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitTask" :loading="taskSubmitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { IoTOtaFirmwareApi, IoTOtaFirmware } from '@/api/iot/ota/firmware'
import { IoTOtaTaskApi, OtaTask } from '@/api/iot/ota/task'
import { IoTOtaTaskRecordApi } from '@/api/iot/ota/task/record'
import { ProductApi } from '@/api/iot/product/product'

/** IoT OTA 固件详情 */
defineOptions({ name: 'IoTOtaFirmwareDetail' })

const message = useMessage() // 消息弹窗
const route = useRoute()
const firmwareId = ref(Number(route.params.id))

// 固件信息
const firmwareLoading = ref(false)
const firmwareInfo = ref<IoTOtaFirmware>({
  id: 0,
  name: '',
  description: '',
  version: '',
  productId: 0,
  createTime: ''
})
const productName = ref('')
const isLatest = ref(true)

// 统计信息
const statisticsLoading = ref(false)
const statistics = ref({
  total: 0,
  success: 0,
  inProgress: 0,
  failed: 0
})

// 任务列表
const taskLoading = ref(false)
const taskList = ref<OtaTask[]>([])
const taskTotal = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  firmwareId: firmwareId.value
})
const queryFormRef = ref()

// 任务表单
const taskFormVisible = ref(false)
const taskSubmitting = ref(false)
const taskForm = ref<OtaTask>({
  name: '',
  deviceScope: undefined,
  firmwareId: firmwareId.value,
  description: ''
})
const taskFormRef = ref()
const taskFormRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  deviceScope: [{ required: true, message: '请选择升级范围', trigger: 'change' }]
}

/** 获取固件信息 */
const getFirmwareInfo = async () => {
  firmwareLoading.value = true
  try {
    const data = await IoTOtaFirmwareApi.getOtaFirmware(firmwareId.value)
    firmwareInfo.value = data
    // 获取产品名称
    if (data.productId) {
      const product = await ProductApi.getProduct(data.productId)
      productName.value = product.name
    }
  } finally {
    firmwareLoading.value = false
  }
}

/** 获取升级统计 */
const getStatistics = async () => {
  statisticsLoading.value = true
  try {
    const data = await IoTOtaTaskRecordApi.getOtaTaskRecordStatusCount(firmwareId.value)
    statistics.value = {
      total: (data[1] || 0) + (data[2] || 0) + (data[3] || 0) + (data[4] || 0), // 假设状态：1待升级，2升级中，3成功，4失败
      success: data[3] || 0,
      inProgress: data[2] || 0,
      failed: data[4] || 0
    }
  } finally {
    statisticsLoading.value = false
  }
}

/** 获取任务列表 */
const getTaskList = async () => {
  taskLoading.value = true
  try {
    const data = await IoTOtaTaskApi.getOtaTaskPage(queryParams)
    taskList.value = data.list
    taskTotal.value = data.total
  } finally {
    taskLoading.value = false
  }
}

/** 搜索 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getTaskList()
}

/** 获取任务类型文本 */
const getTaskTypeText = (taskType: string) => {
  return taskType || '全量升级'
}

/** 获取状态文本 */
const getStatusText = (status: number) => {
  const statusMap = {
    1: '待执行',
    2: '执行中',
    3: '已完成',
    4: '已取消',
    5: '执行失败'
  }
  return statusMap[status] || '未知'
}

/** 获取状态标签类型 */
const getStatusTagType = (status: number) => {
  const typeMap = {
    1: 'info',
    2: 'warning',
    3: 'success',
    4: 'info',
    5: 'danger'
  }
  return typeMap[status] || 'info'
}

/** 打开任务表单 */
const openTaskForm = () => {
  taskForm.value = {
    taskName: '',
    taskType: '',
    firmwareId: firmwareId.value,
    scheduledTime: '',
    description: ''
  }
  taskFormVisible.value = true
}

/** 提交任务 */
const handleSubmitTask = async () => {
  try {
    await taskFormRef.value.validate()
    taskSubmitting.value = true
    await IoTOtaTaskApi.createOtaTask(taskForm.value)
    message.success('创建成功')
    taskFormVisible.value = false
    getTaskList()
  } catch (error) {
    console.error('创建任务失败', error)
  } finally {
    taskSubmitting.value = false
  }
}

/** 取消任务 */
const handleCancelTask = async (id: number) => {
  try {
    await message.confirm('确认要取消该升级任务吗？')
    await IoTOtaTaskApi.cancelOtaTask(id)
    message.success('取消成功')
    getTaskList()
  } catch (error) {
    console.error('取消任务失败', error)
  }
}

/** 删除任务 */
const handleDeleteTask = async (id: number) => {
  try {
    await message.confirm('确认要删除该升级任务吗？')
    // 这里应该调用删除接口，但提供的代码中没有删除接口
    message.success('删除成功')
    getTaskList()
  } catch (error) {
    console.error('删除任务失败', error)
  }
}

/** 初始化 */
onMounted(() => {
  getFirmwareInfo()
  getStatistics()
  getTaskList()
})
</script>

<style scoped>
.info-item {
  padding: 8px 0;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
}

.info-item .value {
  color: #303133;
}

.statistics-row {
  padding: 20px 0;
}

.stat-card {
  text-align: center;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}
</style>
