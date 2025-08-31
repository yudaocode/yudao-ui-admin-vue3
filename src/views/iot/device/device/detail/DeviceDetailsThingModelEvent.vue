<!-- 设备事件管理 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
      @submit.prevent
    >
      <el-form-item label="标识符" prop="identifier">
        <el-select
          v-model="queryParams.identifier"
          placeholder="请选择事件标识符"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="event in eventThingModels"
            :key="event.identifier"
            :label="`${event.name}(${event.identifier})`"
            :value="event.identifier!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="时间范围" prop="times">
        <el-date-picker
          v-model="queryParams.times"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
          class="!w-360px"
          :shortcuts="defaultShortcuts"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" />
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <!-- 事件列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="上报时间" align="center" prop="reportTime" width="180px">
        <template #default="scope">
          {{ scope.row.request?.reportTime ? formatDate(scope.row.request.reportTime) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="标识符" align="center" prop="identifier" width="160px">
        <template #default="scope">
          <el-tag type="primary" size="small">
            {{ scope.row.request?.identifier }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="事件名称" align="center" prop="eventName" width="160px">
        <template #default="scope">
          {{ getEventName(scope.row.request?.identifier) }}
        </template>
      </el-table-column>
      <el-table-column label="事件类型" align="center" prop="eventType" width="100px">
        <template #default="scope">
          {{ getEventType(scope.row.request?.identifier) }}
        </template>
      </el-table-column>
      <el-table-column label="输入参数" align="center" prop="params">
        <template #default="scope"> {{ parseParams(scope.row.request.params) }} </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { DeviceApi } from '@/api/iot/device/device'
import { ThingModelData } from '@/api/iot/thingmodel'
import { formatDate, defaultShortcuts } from '@/utils/formatTime'
import {
  getEventTypeLabel,
  IotDeviceMessageMethodEnum,
  IoTThingModelTypeEnum
} from '@/views/iot/utils/constants'

const props = defineProps<{
  deviceId: number
  thingModelList: ThingModelData[]
}>()

const loading = ref(false) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([] as any[]) // 列表的数据
const queryParams = reactive({
  deviceId: props.deviceId,
  method: IotDeviceMessageMethodEnum.EVENT_POST.method, // 固定筛选事件消息
  identifier: '',
  times: [] as any[],
  pageNo: 1,
  pageSize: 10
})
const queryFormRef = ref() // 搜索的表单

/** 事件类型的物模型数据 */
const eventThingModels = computed(() => {
  return props.thingModelList.filter(
    (item: ThingModelData) => item.type === IoTThingModelTypeEnum.EVENT
  )
})

/** 查询列表 */
const getList = async () => {
  if (!props.deviceId) return
  loading.value = true
  try {
    const data = await DeviceApi.getDeviceMessagePairPage(queryParams)
    list.value = data.list
    total.value = data.length
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.identifier = ''
  queryParams.times = []
  handleQuery()
}

/** 获取事件名称 */
const getEventName = (identifier: string | undefined) => {
  if (!identifier) return '-'
  const event = eventThingModels.value.find(
    (item: ThingModelData) => item.identifier === identifier
  )
  return event?.name || identifier
}

/** 获取事件类型 */
const getEventType = (identifier: string | undefined) => {
  if (!identifier) return '-'
  const event = eventThingModels.value.find(
    (item: ThingModelData) => item.identifier === identifier
  )
  if (!event?.event?.type) return '-'
  return getEventTypeLabel(event.event.type) || '-'
}

/** 解析参数 */
const parseParams = (params: string) => {
  try {
    const parsed = JSON.parse(params)
    if (parsed.params) {
      return parsed.params
    }
    return parsed
  } catch (error) {
    return {}
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
