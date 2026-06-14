<!-- 设备影子 -->
<template>
  <ContentWrap>
    <!-- 顶部信息栏 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600"
          >版本号：<b>{{ shadow.version ?? 0 }}</b></span
        >
        <span class="text-sm text-gray-600">
          最后更新：{{ shadow.shadowTime ? formatTime(shadow.shadowTime) : '-' }}
        </span>
        <span class="text-sm text-gray-600 flex items-center gap-2">
          影子开关：
          <el-switch
            v-model="shadowEnabled"
            :active-value="CommonStatusEnum.ENABLE"
            :inactive-value="CommonStatusEnum.DISABLE"
            @change="handleStatusChange"
          />
        </span>
      </div>
      <div class="flex gap-2">
        <el-button @click="loadShadow" :loading="loading">
          <Icon icon="ep:refresh" class="mr-1" />刷新
        </el-button>
        <el-button type="danger" plain @click="handleReset" :loading="resetting">
          重置影子
        </el-button>
      </div>
    </div>

    <!-- 属性对比表 -->
    <el-table
      :data="shadow.properties"
      :show-overflow-tooltip="true"
      :stripe="true"
      :row-class-name="rowClassName"
      v-loading="loading"
    >
      <el-table-column align="center" label="标识符" prop="identifier" width="140" />
      <el-table-column align="center" label="名称" prop="name" width="120" />
      <el-table-column align="center" label="数据类型" prop="dataType" width="100" />
      <el-table-column align="center" label="期望值 (desired)" min-width="150">
        <template #default="{ row }">
          <span :class="{ 'text-orange-500 font-bold': isDelta(row) }">
            {{ formatValue(row.desiredValue) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="上报值 (reported)" min-width="150">
        <template #default="{ row }">
          <span :class="{ 'text-orange-500 font-bold': isDelta(row) }">
            {{ formatValue(row.reportedValue) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="期望更新时间" width="160">
        <template #default="{ row }">
          {{ row.desiredTime ? formatTime(row.desiredTime) : '-' }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="上报更新时间" width="160">
        <template #default="{ row }">
          {{ row.reportedTime ? formatTime(row.reportedTime) : '-' }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 下发期望 -->
    <el-divider content-position="left">下发期望状态</el-divider>
    <el-table :data="writableProperties" :show-overflow-tooltip="true" :stripe="true">
      <el-table-column align="center" label="标识符" prop="identifier" width="140" />
      <el-table-column align="center" label="名称" prop="name" width="120" />
      <el-table-column align="center" label="数据类型" prop="dataType" width="100" />
      <el-table-column align="center" label="期望值" min-width="200">
        <template #default="{ row }">
          <el-input v-model="desiredForm[row.identifier]" placeholder="输入期望值" size="small" />
        </template>
      </el-table-column>
    </el-table>
    <div class="flex justify-end mt-4">
      <el-button type="primary" @click="handleUpdateDesired" :loading="updating">
        下发期望状态
      </el-button>
    </div>

    <!-- 原始 JSON -->
    <el-collapse class="mt-4">
      <el-collapse-item title="原始影子文档 (JSON)" name="raw">
        <pre class="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">{{ rawJson }}</pre>
      </el-collapse-item>
    </el-collapse>
  </ContentWrap>
</template>

<script setup lang="ts">
import type { DeviceShadowVO } from '@/api/iot/device/shadow'
import { DeviceShadowApi } from '@/api/iot/device/shadow'
import { ThingModelData } from '@/api/iot/thingmodel'
import { CommonStatusEnum } from '@/utils/constants'
import { IoTThingModelAccessModeEnum, IoTThingModelTypeEnum } from '@/views/iot/utils/constants'
import { formatDate } from '@/utils/formatTime'

const props = defineProps<{
  deviceId: number
  thingModelList: ThingModelData[]
}>()

const message = useMessage()
const loading = ref(false)
const updating = ref(false)
const resetting = ref(false)
const shadow = ref<DeviceShadowVO>({
  version: 0,
  shadowTime: 0,
  status: CommonStatusEnum.ENABLE,
  properties: [],
  desired: {},
  reported: {},
  metadata: {}
})
const shadowEnabled = ref(CommonStatusEnum.ENABLE)
const desiredForm = ref<Record<string, any>>({})

/** 可写属性列表（引导填写 desired） */
const writableProperties = computed(() => {
  return props.thingModelList.filter((item) => {
    if (item.type !== IoTThingModelTypeEnum.PROPERTY) return false
    const accessMode = item.property?.accessMode
    return (
      accessMode === IoTThingModelAccessModeEnum.READ_WRITE.value ||
      accessMode === IoTThingModelAccessModeEnum.WRITE_ONLY.value
    )
  })
})

const rawJson = computed(() =>
  JSON.stringify(
    {
      state: { desired: shadow.value.desired, reported: shadow.value.reported },
      metadata: shadow.value.metadata,
      version: shadow.value.version,
      timestamp: shadow.value.shadowTime
    },
    null,
    2
  )
)

const loadShadow = async () => {
  loading.value = true
  try {
    shadow.value = await DeviceShadowApi.getDeviceShadow(props.deviceId)
    shadowEnabled.value = shadow.value.status ?? CommonStatusEnum.ENABLE
  } finally {
    loading.value = false
  }
}

const handleStatusChange = async (status: number) => {
  try {
    await DeviceShadowApi.updateShadowStatus({ deviceId: props.deviceId, status })
    message.success('影子开关已更新')
  } catch {
    shadowEnabled.value = shadow.value.status
  }
}

const handleUpdateDesired = async () => {
  const desired: Record<string, any> = {}
  for (const [key, value] of Object.entries(desiredForm.value)) {
    if (value !== undefined && value !== '') {
      desired[key] = value
    }
  }
  if (Object.keys(desired).length === 0) {
    message.warning('请至少填写一个期望值')
    return
  }
  updating.value = true
  try {
    await DeviceShadowApi.updateDesiredState({ deviceId: props.deviceId, desired })
    message.success('期望状态已下发')
    desiredForm.value = {}
    await loadShadow()
  } finally {
    updating.value = false
  }
}

const handleReset = async () => {
  await message.confirm('确认重置该设备的影子文档？此操作将清空 desired 和 reported。')
  resetting.value = true
  try {
    await DeviceShadowApi.resetShadow(props.deviceId)
    message.success('影子已重置')
    await loadShadow()
  } finally {
    resetting.value = false
  }
}

const isDelta = (row: any) => {
  const d = row.desiredValue
  const r = row.reportedValue
  if (d === undefined || d === null) return false
  return String(d) !== String(r ?? '')
}

const rowClassName = ({ row }: { row: any }) => (isDelta(row) ? 'shadow-delta-row' : '')

const formatValue = (val: any) => {
  if (val === undefined || val === null) return '-'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const formatTime = (epochSecond: number) => {
  return formatDate(new Date(epochSecond * 1000))
}

onMounted(() => {
  loadShadow()
})
</script>

<style scoped>
:deep(.shadow-delta-row) {
  background-color: var(--el-color-warning-light-9) !important;
}
</style>
