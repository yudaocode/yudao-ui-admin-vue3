<!-- 设备服务调用 -->
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
          placeholder="请选择服务标识符"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="service in serviceThingModels"
            :key="service.identifier"
            :label="`${service.name}(${service.identifier})`"
            :value="service.identifier!"
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
    <!-- 服务调用列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="调用时间" align="center" prop="requestTime" width="180px">
        <template #default="scope">
          {{ scope.row.request?.reportTime ? formatDate(scope.row.request.reportTime) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="响应时间" align="center" prop="responseTime" width="180px">
        <template #default="scope">
          {{ scope.row.reply?.reportTime ? formatDate(scope.row.reply.reportTime) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="标识符" align="center" prop="identifier" width="160px">
        <template #default="scope">
          <el-tag type="primary" size="small">
            {{ scope.row.request?.identifier }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="服务名称" align="center" prop="serviceName" width="160px">
        <template #default="scope">
          {{ getServiceName(scope.row.request?.identifier) }}
        </template>
      </el-table-column>
      <el-table-column label="调用方式" align="center" prop="callType" width="100px">
        <template #default="scope">
          {{ getCallType(scope.row.request?.identifier) }}
        </template>
      </el-table-column>
      <el-table-column label="输入参数" align="center" prop="inputParams">
        <template #default="scope"> {{ parseParams(scope.row.request?.params) }} </template>
      </el-table-column>
      <el-table-column label="输出参数" align="center" prop="outputParams">
        <template #default="scope">
          <span v-if="scope.row.reply">
            {{
              `{"code":${scope.row.reply.code},"msg":"${scope.row.reply.msg}","data":${scope.row.reply.data}\}`
            }}
          </span>
          <span v-else>-</span>
        </template>
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
  getThingModelServiceCallTypeLabel,
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
  method: IotDeviceMessageMethodEnum.SERVICE_INVOKE.method, // 固定筛选服务调用消息
  identifier: '',
  times: [] as any[],
  pageNo: 1,
  pageSize: 10
})
const queryFormRef = ref() // 搜索的表单

/** 服务类型的物模型数据 */
const serviceThingModels = computed(() => {
  return props.thingModelList.filter(
    (item: ThingModelData) => item.type === IoTThingModelTypeEnum.SERVICE
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

/** 获取服务名称 */
const getServiceName = (identifier: string | undefined) => {
  if (!identifier) return '-'
  const service = serviceThingModels.value.find(
    (item: ThingModelData) => item.identifier === identifier
  )
  return service?.name || identifier
}

/** 获取调用方式 */
const getCallType = (identifier: string | undefined) => {
  if (!identifier) return '-'
  const service = serviceThingModels.value.find(
    (item: ThingModelData) => item.identifier === identifier
  )
  if (!service?.service?.callType) return '-'
  return getThingModelServiceCallTypeLabel(service.service.callType) || '-'
}

/** 解析参数 */
const parseParams = (params: string) => {
  if (!params) return '-'
  try {
    const parsed = JSON.parse(params)
    if (parsed.params) {
      return JSON.stringify(parsed.params, null, 2)
    }
    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    return params
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
