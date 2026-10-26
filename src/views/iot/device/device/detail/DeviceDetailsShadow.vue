<!-- 设备影子 -->
<template>
  <ContentWrap>
    <!-- 顶部信息栏 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600"
          >版本号：<b>{{ shadow.version ?? 0 }}</b></span
        >
        <span class="text-sm text-gray-600">最后更新：{{ formatTime(shadow.shadowTime) }}</span>
        <span class="text-sm text-gray-600 flex items-center gap-2">
          影子开关：
          <el-switch
            v-model="shadowEnabled"
            :active-value="CommonStatusEnum.ENABLE"
            :inactive-value="CommonStatusEnum.DISABLE"
            :disabled="!canUpdate"
            :loading="statusUpdating"
            @change="handleStatusChange"
          />
        </span>
      </div>
      <div class="flex gap-2">
        <el-button @click="loadShadow" :loading="loading">
          <Icon icon="ep:refresh" class="mr-1" />刷新
        </el-button>
        <el-button
          type="danger"
          plain
          @click="handleReset"
          :loading="resetting"
          v-hasPermi="['iot:device:shadow-update']"
        >
          重置影子
        </el-button>
      </div>
    </div>

    <!-- 属性对比表 -->
    <el-table
      :data="shadow.properties"
      :show-overflow-tooltip="true"
      :stripe="true"
      :row-class-name="({ row }) => (isDelta(row) ? 'shadow-delta-row' : '')"
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
        <template #default="{ row }">{{ formatTime(row.desiredTime) }}</template>
      </el-table-column>
      <el-table-column align="center" label="上报更新时间" width="160">
        <template #default="{ row }">{{ formatTime(row.reportedTime) }}</template>
      </el-table-column>
    </el-table>

    <!-- 下发期望 -->
    <template v-if="canUpdate">
      <el-divider content-position="left">下发期望状态</el-divider>
      <el-table :data="writableProperties" :show-overflow-tooltip="true" :stripe="true">
        <el-table-column align="center" label="标识符" prop="identifier" width="140" />
        <el-table-column align="center" label="名称" prop="name" width="120" />
        <el-table-column align="center" label="数据类型" prop="property.dataType" width="100" />
        <el-table-column align="center" label="期望值" min-width="200">
          <template #default="{ row }">
            <!-- 布尔、枚举：按物模型定义选择取值 -->
            <el-select
              v-if="getDesiredInputType(row) === 'select'"
              v-model="desiredForm[row.identifier]"
              placeholder="选择期望值"
              size="small"
              clearable
              class="!w-full"
            >
              <el-option
                v-for="item in row.property?.dataSpecsList || []"
                :key="item.value"
                :label="`${item.name}（${item.value}）`"
                :value="item.value"
              />
            </el-select>
            <!-- 数值：int 取整，float / double 保留输入精度 -->
            <el-input-number
              v-else-if="getDesiredInputType(row) === 'number'"
              v-model="desiredForm[row.identifier]"
              :precision="row.property.dataType === IoTDataSpecsDataTypeEnum.INT ? 0 : undefined"
              :controls="false"
              placeholder="输入期望值"
              size="small"
              class="!w-full"
            />
            <!-- 时间：毫秒时间戳 -->
            <el-date-picker
              v-else-if="getDesiredInputType(row) === 'date'"
              v-model="desiredForm[row.identifier]"
              type="datetime"
              value-format="x"
              placeholder="选择期望时间"
              size="small"
              class="!w-full"
            />
            <!-- 结构体、数组：输入 JSON -->
            <el-input
              v-else-if="getDesiredInputType(row) === 'json'"
              v-model="desiredForm[row.identifier]"
              :placeholder="
                row.property.dataType === IoTDataSpecsDataTypeEnum.ARRAY
                  ? '输入 JSON 数组'
                  : '输入 JSON 对象'
              "
              size="small"
            />
            <!-- 文本等：输入字符串 -->
            <el-input
              v-else
              v-model="desiredForm[row.identifier]"
              placeholder="输入期望值"
              size="small"
            />
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-4">
        <el-button type="primary" @click="handleUpdateDesired" :loading="updating">
          下发期望状态
        </el-button>
      </div>
    </template>

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
import {
  IoTDataSpecsDataTypeEnum,
  IoTThingModelAccessModeEnum,
  IoTThingModelTypeEnum
} from '@/views/iot/utils/constants'
import { formatNullableDate } from '@/utils/formatTime'
import { checkPermi } from '@/utils/permission'
import { isEqual, isPlainObject } from 'lodash-es'

const props = defineProps<{
  deviceId: number
  thingModelList: ThingModelData[]
}>()

const message = useMessage()
const canUpdate = checkPermi(['iot:device:shadow-update']) // 是否有影子修改权限
const loading = ref(false) // 加载中
const updating = ref(false) // 下发期望中
const resetting = ref(false) // 重置中
const statusUpdating = ref(false) // 开关更新中
const shadow = ref<DeviceShadowVO>({
  version: 0,
  shadowTime: 0,
  status: CommonStatusEnum.ENABLE,
  properties: [],
  desired: {},
  reported: {},
  metadata: {}
}) // 设备影子
const shadowEnabled = ref(CommonStatusEnum.ENABLE) // 开关的展示值
const desiredForm = ref<Record<string, any>>({}) // 期望值表单，只保存用户填写的属性

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

/** 原始影子文档 */
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

/** 加载设备影子 */
const loadShadow = async () => {
  loading.value = true
  try {
    shadow.value = await DeviceShadowApi.getDeviceShadow(props.deviceId)
    shadowEnabled.value = shadow.value.status ?? CommonStatusEnum.ENABLE
  } finally {
    loading.value = false
  }
}

/** 切换影子开关：失败时回滚到最近一次成功的状态 */
const handleStatusChange = async (status: number) => {
  statusUpdating.value = true
  try {
    await DeviceShadowApi.updateShadowStatus({ deviceId: props.deviceId, status })
    shadow.value.status = status
    message.success('影子开关已更新')
  } catch {
    shadowEnabled.value = shadow.value.status
  } finally {
    statusUpdating.value = false
  }
}

/** 期望值的输入方式，按物模型数据类型区分 */
const getDesiredInputType = (row: ThingModelData) => {
  switch (row.property?.dataType) {
    case IoTDataSpecsDataTypeEnum.BOOL:
    case IoTDataSpecsDataTypeEnum.ENUM:
      return 'select'
    case IoTDataSpecsDataTypeEnum.INT:
    case IoTDataSpecsDataTypeEnum.FLOAT:
    case IoTDataSpecsDataTypeEnum.DOUBLE:
      return 'number'
    case IoTDataSpecsDataTypeEnum.DATE:
      return 'date'
    case IoTDataSpecsDataTypeEnum.STRUCT:
    case IoTDataSpecsDataTypeEnum.ARRAY:
      return 'json'
    default:
      return 'text'
  }
}

/** 构建期望状态：结构体、数组解析为 JSON 对象、数组；解析失败时提示并返回 undefined */
const buildDesired = () => {
  const desired: Record<string, any> = {}
  for (const item of writableProperties.value) {
    const identifier = item.identifier as string
    const value = desiredForm.value[identifier]
    if (value === undefined || value === null || value === '') {
      continue
    }
    const inputType = getDesiredInputType(item)
    if (inputType === 'date') {
      // 日期选择器 value-format="x" 返回字符串，需转为毫秒时间戳
      const timestamp = Number(value)
      if (!Number.isSafeInteger(timestamp)) {
        message.error(`【${item.name}】需选择合法的时间`)
        return undefined
      }
      desired[identifier] = timestamp
      continue
    }
    if (inputType !== 'json') {
      desired[identifier] = value
      continue
    }
    const isArray = item.property.dataType === IoTDataSpecsDataTypeEnum.ARRAY
    let json: any
    try {
      json = JSON.parse(value)
    } catch {
      json = undefined
    }
    if (isArray ? !Array.isArray(json) : !isPlainObject(json)) {
      message.error(`【${item.name}】需填写合法的 JSON ${isArray ? '数组' : '对象'}`)
      return undefined
    }
    desired[identifier] = json
  }
  return desired
}

// TODO DONE @AI：注释 /** */；已补充
/** 下发期望状态：成功后清空表单并刷新；失败时保留输入 */
const handleUpdateDesired = async () => {
  const desired = buildDesired()
  if (!desired) {
    return
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

/** 重置影子：二次确认后清空 */
const handleReset = async () => {
  await message.confirm(
    '确认重置该设备的影子文档？此操作将清空 desired、reported 和 metadata，版本号归 0。'
  )
  resetting.value = true
  try {
    await DeviceShadowApi.resetShadow(props.deviceId)
    message.success('影子已重置')
    await loadShadow()
  } finally {
    resetting.value = false
  }
}

/** 期望值与上报值不一致（结构体、数组按内容深比较） */
const isDelta = (row: any) => {
  if (row.desiredValue === undefined || row.desiredValue === null) return false
  return !isEqual(row.desiredValue, row.reportedValue)
}

/** 格式化属性值 */
const formatValue = (val: any) => {
  if (val === undefined || val === null) return '-'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

/** 格式化 epoch 秒，为空时展示 - */
const formatTime = (epochSecond?: number) => {
  return formatNullableDate(epochSecond ? epochSecond * 1000 : undefined)
}

/** 初始化 */
onMounted(() => {
  loadShadow()
})
</script>

<style scoped>
:deep(.shadow-delta-row) {
  background-color: var(--el-color-warning-light-9) !important;
}
</style>
