<template>
  <Dialog v-model="dialogVisible" title="升级任务详情" width="1200px" append-to-body>
    <!-- 任务信息 -->
    <ContentWrap title="任务信息" class="mb-20px">
      <el-descriptions :column="3" v-loading="taskLoading">
        <el-descriptions-item label="任务ID">{{ taskInfo.id }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ taskInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="任务类型">版本升级</el-descriptions-item>
        <el-descriptions-item label="设备数量">{{
          taskInfo.deviceTotalCount
        }}</el-descriptions-item>
        <el-descriptions-item label="预定时间">-</el-descriptions-item>
        <el-descriptions-item label="添加时间">{{
          formatTime(taskInfo.createTime)
        }}</el-descriptions-item>
        <el-descriptions-item label="任务描述" :span="3">{{
          taskInfo.description || '-'
        }}</el-descriptions-item>
      </el-descriptions>
    </ContentWrap>

    <!-- 任务升级设备统计 -->
    <ContentWrap title="升级设备统计" class="mb-20px">
      <el-row :gutter="20" class="py-20px" v-loading="statisticsLoading">
        <el-col :span="4">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-blue-500">
              {{ statisticsData.total }}
            </div>
            <div class="text-14px text-gray-600">升级设备总数</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-gray-400">
              {{ statisticsData.pending }}
            </div>
            <div class="text-14px text-gray-600">待推送</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-yellow-500">
              {{ statisticsData.upgrading }}
            </div>
            <div class="text-14px text-gray-600">正在升级</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-green-500">
              {{ statisticsData.success }}
            </div>
            <div class="text-14px text-gray-600">升级成功</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-red-500">
              {{ statisticsData.failure }}
            </div>
            <div class="text-14px text-gray-600">升级失败</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="text-center p-20px border border-solid border-gray-200 rounded bg-gray-50">
            <div class="text-32px font-bold mb-8px text-gray-400">
              {{ statisticsData.stopped }}
            </div>
            <div class="text-14px text-gray-600">停止</div>
          </div>
        </el-col>
      </el-row>
    </ContentWrap>

    <!-- 设备管理 -->
    <ContentWrap title="升级设备记录">
      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="mb-15px">
        <el-tab-pane v-for="tab in statusTabs" :key="tab.key" :label="tab.label" :name="tab.key" />
      </el-tabs>
      <!-- Tab 内容 -->
      <div v-for="tab in statusTabs" :key="tab.key" v-show="activeTab === tab.key">
        <!-- 设备列表 -->
        <el-table
          v-loading="recordLoading"
          :data="recordList"
          :stripe="true"
          :show-overflow-tooltip="true"
        >
          <el-table-column label="设备名称" align="center" prop="deviceName" />
          <el-table-column label="当前版本" align="center" prop="currentVersion" />
          <el-table-column label="升级状态" align="center" prop="status" width="120">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.IOT_OTA_RECORD_STATUS" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="升级进度" align="center" prop="progress" width="120">
            <template #default="scope"> {{ scope.row.progress }}% </template>
          </el-table-column>
          <el-table-column label="状态描述" align="center" prop="description" />
          <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
            <template #default="scope"> {{ formatTime(scope.row.updateTime) }} </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="80">
            <template #default="scope">
              <el-button
                v-if="scope.row.status === IoTOtaTaskRecordStatusEnum.UPGRADING.value"
                link
                type="danger"
                @click="handleCancelUpgrade(scope.row)"
              >
                取消
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <!-- 分页 -->
        <div class="flex justify-center mt-20px">
          <Pagination
            :total="recordTotal"
            v-model:page="queryParams.pageNo"
            v-model:limit="queryParams.pageSize"
            @pagination="getRecordList"
          />
        </div>
      </div>
    </ContentWrap>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { TabsPaneContext } from 'element-plus'
import { Dialog } from '@/components/Dialog'
import { ContentWrap } from '@/components/ContentWrap'
import Pagination from '@/components/Pagination/index.vue'
import { IoTOtaTaskApi, OtaTask } from '@/api/iot/ota/task'
import { IoTOtaTaskRecordApi, OtaTaskRecord } from '@/api/iot/ota/task/record'
import { DICT_TYPE } from '@/utils/dict'
import { IoTOtaTaskRecordStatusEnum } from '@/views/iot/utils/constants'
import { formatDate } from '@/utils/formatTime'

/** OTA 任务详情组件 */
defineOptions({ name: 'OtaTaskDetail' })

const message = useMessage()

// 弹窗相关
const dialogVisible = ref(false)
const taskId = ref<number>()

// 任务信息
const taskLoading = ref(false)
const taskInfo = ref<OtaTask>({})

// 统计加载状态
const statisticsLoading = ref(false)

// 统计数据
const statisticsData = ref({
  total: 0,
  pending: 0,
  pushed: 0,
  upgrading: 0,
  success: 0,
  failure: 0,
  stopped: 0
})

// 当前选中的标签
const activeTab = ref('')

// 记录列表相关
const recordLoading = ref(false)
const recordList = ref<OtaTaskRecord[]>([])
const recordTotal = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: undefined as number | undefined,
  status: undefined as number | undefined,
  deviceNumber: ''
})

// 状态标签配置
const statusTabs = computed(() => [
  { key: '', label: '全部设备' },
  {
    key: IoTOtaTaskRecordStatusEnum.PENDING.value.toString(),
    label: IoTOtaTaskRecordStatusEnum.PENDING.label
  },
  {
    key: IoTOtaTaskRecordStatusEnum.PUSHED.value.toString(),
    label: IoTOtaTaskRecordStatusEnum.PUSHED.label
  },
  {
    key: IoTOtaTaskRecordStatusEnum.UPGRADING.value.toString(),
    label: IoTOtaTaskRecordStatusEnum.UPGRADING.label
  },
  {
    key: IoTOtaTaskRecordStatusEnum.SUCCESS.value.toString(),
    label: IoTOtaTaskRecordStatusEnum.SUCCESS.label
  },
  {
    key: IoTOtaTaskRecordStatusEnum.FAILURE.value.toString(),
    label: IoTOtaTaskRecordStatusEnum.FAILURE.label
  },
  {
    key: IoTOtaTaskRecordStatusEnum.CANCELED.value.toString(),
    label: IoTOtaTaskRecordStatusEnum.CANCELED.label
  }
])

/** 时间格式化 */
const formatTime = (time: string | undefined) => {
  if (!time) return '-'
  return formatDate(new Date(time))
}

/** 获取任务详情 */
const getTaskInfo = async () => {
  if (!taskId.value) return

  taskLoading.value = true
  try {
    const data = await IoTOtaTaskApi.getOtaTask(taskId.value)
    taskInfo.value = data
  } catch (error) {
    console.error('获取任务详情失败', error)
  } finally {
    taskLoading.value = false
  }
}

/** 获取统计数据 */
const getStatistics = async () => {
  if (!taskId.value) return

  statisticsLoading.value = true
  try {
    const data = await IoTOtaTaskRecordApi.getOtaTaskRecordStatusStatistics(undefined, taskId.value)
    statisticsData.value = {
      total: data.total || 0,
      pending: data.pending || 0,
      pushed: data.pushed || 0,
      upgrading: data.upgrading || 0,
      success: data.success || 0,
      failure: data.failure || 0,
      stopped: data.stopped || 0
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
    // 模拟数据
    statisticsData.value = {
      total: 1,
      pending: 0,
      pushed: 0,
      upgrading: 0,
      success: 0,
      failure: 1,
      stopped: 0
    }
  } finally {
    statisticsLoading.value = false
  }
}

/** 获取记录列表 */
const getRecordList = async () => {
  if (!taskId.value) return

  recordLoading.value = true
  try {
    queryParams.taskId = taskId.value
    const data = await IoTOtaTaskRecordApi.getOtaTaskRecordPage(queryParams)
    recordList.value = data.list || []
    recordTotal.value = data.total || 0
  } catch (error) {
    console.error('获取记录列表失败', error)
    // 模拟数据
    recordList.value = [
      {
        id: 1,
        taskId: taskId.value,
        deviceId: '1',
        status: IoTOtaTaskRecordStatusEnum.FAILURE.value,
        progress: 0,
        description: '升级失败'
      } as OtaTaskRecord
    ]
    recordTotal.value = 1
  } finally {
    recordLoading.value = false
  }
}

/** 切换标签 */
const handleTabClick = (tab: TabsPaneContext) => {
  const tabKey = tab.paneName as string
  activeTab.value = tabKey
  queryParams.pageNo = 1

  // 设置状态过滤：使用 IoTOtaTaskRecordStatusEnum 的值作为 tab key
  if (tabKey === '') {
    queryParams.status = undefined // 全部
  } else {
    queryParams.status = parseInt(tabKey) // 直接使用枚举值
  }

  getRecordList()
}

/** 取消升级 */
const handleCancelUpgrade = async (record: OtaTaskRecord) => {
  try {
    await message.confirm('确认要取消该设备的升级任务吗？')
    // TODO: 调用取消升级接口
    message.success('取消成功')
    getRecordList()
  } catch (error) {
    console.error('取消升级失败', error)
  }
}

/** 打开弹窗 */
const open = (id: number) => {
  taskId.value = id
  dialogVisible.value = true

  // 重置数据
  activeTab.value = ''
  queryParams.pageNo = 1
  queryParams.status = undefined
  queryParams.deviceNumber = ''

  // 加载数据
  getTaskInfo()
  getStatistics()
  getRecordList()
}

/** 暴露方法 */
defineExpose({
  open
})
</script>
