<!-- 模拟设备 -->
<template>
  <ContentWrap>
    <el-row :gutter="20">
      <!-- 左侧指令调试区域 -->
      <el-col :span="12">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 上行指令调试 -->
          <el-tab-pane label="上行指令调试" name="upstream">
            <el-tabs v-if="activeTab === 'upstream'" v-model="upstreamTab">
              <!-- 属性上报 -->
              <el-tab-pane label="属性上报" :name="IotDeviceMessageMethodEnum.PROPERTY_POST.method">
                <ContentWrap>
                  <el-table :data="propertyList" :show-overflow-tooltip="true" :stripe="true">
                    <el-table-column
                      fixed="left"
                      align="center"
                      label="功能名称"
                      prop="name"
                      width="120"
                    />
                    <el-table-column
                      fixed="left"
                      align="center"
                      label="标识符"
                      prop="identifier"
                      width="120"
                    />
                    <el-table-column align="center" label="数据类型" width="100">
                      <template #default="{ row }">
                        {{ row.property?.dataType ?? '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column align="left" label="数据定义" min-width="200">
                      <template #default="{ row }">
                        <DataDefinition :data="row" />
                      </template>
                    </el-table-column>
                    <el-table-column fixed="right" align="center" label="值" width="150">
                      <template #default="scope">
                        <el-input
                          :model-value="getFormValue(scope.row.identifier)"
                          @update:model-value="setFormValue(scope.row.identifier, $event)"
                          placeholder="输入值"
                          size="small"
                        />
                      </template>
                    </el-table-column>
                  </el-table>
                  <div class="flex justify-between items-center mt-4">
                    <span class="text-sm text-gray-600">
                      设置属性值后，点击「发送属性上报」按钮
                    </span>
                    <el-button type="primary" @click="handlePropertyPost">发送属性上报</el-button>
                  </div>
                </ContentWrap>
              </el-tab-pane>

              <!-- 事件上报 -->
              <el-tab-pane label="事件上报" :name="IotDeviceMessageMethodEnum.EVENT_POST.method">
                <ContentWrap>
                  <el-table :data="eventList" :show-overflow-tooltip="true" :stripe="true">
                    <el-table-column
                      fixed="left"
                      align="center"
                      label="功能名称"
                      prop="name"
                      width="120"
                    />
                    <el-table-column
                      fixed="left"
                      align="center"
                      label="标识符"
                      prop="identifier"
                      width="120"
                    />
                    <el-table-column align="center" label="数据类型" width="100">
                      <template #default="{ row }">
                        {{ row.event?.dataType ?? '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column align="left" label="数据定义" min-width="200">
                      <template #default="{ row }">
                        <DataDefinition :data="row" />
                      </template>
                    </el-table-column>
                    <el-table-column align="center" label="值" width="200">
                      <template #default="scope">
                        <el-input
                          :model-value="getFormValue(scope.row.identifier)"
                          @update:model-value="setFormValue(scope.row.identifier, $event)"
                          type="textarea"
                          :rows="3"
                          placeholder="输入事件参数（JSON格式）"
                          size="small"
                        />
                      </template>
                    </el-table-column>
                    <el-table-column fixed="right" align="center" label="操作" width="100">
                      <template #default="scope">
                        <el-button type="primary" size="small" @click="handleEventPost(scope.row)">
                          上报事件
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </ContentWrap>
              </el-tab-pane>

              <!-- 状态变更 -->
              <el-tab-pane label="状态变更" :name="IotDeviceMessageMethodEnum.STATE_UPDATE.method">
                <ContentWrap>
                  <div class="flex gap-4">
                    <el-button type="primary" @click="handleDeviceState(DeviceStateEnum.ONLINE)">
                      设备上线
                    </el-button>
                    <el-button type="danger" @click="handleDeviceState(DeviceStateEnum.OFFLINE)">
                      设备下线
                    </el-button>
                  </div>
                </ContentWrap>
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>

          <!-- 下行指令调试 -->
          <el-tab-pane label="下行指令调试" name="downstream">
            <el-tabs v-if="activeTab === 'downstream'" v-model="downstreamTab">
              <!-- 属性调试 -->
              <el-tab-pane label="属性设置" :name="IotDeviceMessageMethodEnum.PROPERTY_SET.method">
                <ContentWrap>
                  <el-table :data="propertyList" :show-overflow-tooltip="true" :stripe="true">
                    <el-table-column
                      fixed="left"
                      align="center"
                      label="功能名称"
                      prop="name"
                      width="120"
                    />
                    <el-table-column
                      fixed="left"
                      align="center"
                      label="标识符"
                      prop="identifier"
                      width="120"
                    />
                    <el-table-column align="center" label="数据类型" width="100">
                      <template #default="{ row }">
                        {{ row.property?.dataType ?? '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column align="left" label="数据定义" min-width="200">
                      <template #default="{ row }">
                        <DataDefinition :data="row" />
                      </template>
                    </el-table-column>
                    <el-table-column fixed="right" align="center" label="值" width="150">
                      <template #default="scope">
                        <el-input
                          :model-value="getFormValue(scope.row.identifier)"
                          @update:model-value="setFormValue(scope.row.identifier, $event)"
                          placeholder="输入值"
                          size="small"
                        />
                      </template>
                    </el-table-column>
                  </el-table>
                  <div class="flex justify-between items-center mt-4">
                    <span class="text-sm text-gray-600">
                      设置属性值后，点击「发送属性设置」按钮
                    </span>
                    <el-button type="primary" @click="handlePropertySet">发送属性设置</el-button>
                  </div>
                </ContentWrap>
              </el-tab-pane>

              <!-- 服务调用 -->
              <el-tab-pane
                label="设备服务调用"
                :name="IotDeviceMessageMethodEnum.SERVICE_INVOKE.method"
              >
                <ContentWrap>
                  <el-table :data="serviceList" :show-overflow-tooltip="true" :stripe="true">
                    <el-table-column
                      fixed="left"
                      align="center"
                      label="服务名称"
                      prop="name"
                      width="120"
                    />
                    <el-table-column
                      fixed="left"
                      align="center"
                      label="标识符"
                      prop="identifier"
                      width="120"
                    />
                    <el-table-column align="left" label="输入参数" min-width="200">
                      <template #default="{ row }">
                        <DataDefinition :data="row" />
                      </template>
                    </el-table-column>
                    <el-table-column align="center" label="参数值" width="200">
                      <template #default="scope">
                        <el-input
                          :model-value="getFormValue(scope.row.identifier)"
                          @update:model-value="setFormValue(scope.row.identifier, $event)"
                          type="textarea"
                          :rows="3"
                          placeholder="输入服务参数（JSON格式）"
                          size="small"
                        />
                      </template>
                    </el-table-column>
                    <el-table-column fixed="right" align="center" label="操作" width="100">
                      <template #default="scope">
                        <el-button
                          type="primary"
                          size="small"
                          @click="handleServiceInvoke(scope.row)"
                        >
                          服务调用
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </ContentWrap>
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>

          <!-- 透传下发 -->
          <el-tab-pane v-if="canRawSend" label="透传下发" name="raw">
            <ContentWrap>
              <el-alert
                v-if="!rawSupported"
                title="HTTP / CoAP 协议的产品不支持透传下发"
                type="info"
                show-icon
                :closable="false"
                class="mb-4"
              />
              <el-form label-width="90px">
                <el-form-item label="载荷 HEX">
                  <el-input
                    v-model="rawPayloadHex"
                    type="textarea"
                    :rows="4"
                    :disabled="!rawSupported"
                    :input-style="{ fontFamily: 'monospace' }"
                    :placeholder="isModbusProduct ? '例如：03 00 00 00 02' : '例如：AA 01 00 DC'"
                  />
                </el-form-item>
              </el-form>
              <div class="flex justify-between items-center mt-4">
                <span class="text-sm text-gray-600">
                  <template v-if="isModbusProduct">
                    填写 Modbus PDU（功能码 + 数据，不含从站地址、CRC、MBAP），5~253 字节
                  </template>
                  <template v-else>原样发送给设备，1~4096 字节</template>
                </span>
                <el-button
                  type="primary"
                  :disabled="!rawSupported"
                  :loading="rawSending"
                  @click="handleRawPush"
                >
                  发送
                </el-button>
              </div>
              <div class="text-xs text-gray-500 mt-2">
                将真实发送给设备。不提供透传上报的模拟，验证脚本请使用产品详情的「数据解析」调试
              </div>
            </ContentWrap>
          </el-tab-pane>
        </el-tabs>
      </el-col>

      <!-- 右侧设备日志区域 -->
      <el-col :span="12">
        <ContentWrap title="设备消息">
          <DeviceDetailsMessage ref="deviceMessageRef" :device-id="device.id" />
        </ContentWrap>
      </el-col>
    </el-row>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { ProductVO, ProtocolTypeEnum } from '@/api/iot/product/product'
import { ThingModelData } from '@/api/iot/thingmodel'
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import DeviceDetailsMessage from './DeviceDetailsMessage.vue'
import { DataDefinition } from '@/views/iot/thingmodel/components'
import {
  DeviceStateEnum,
  IotDeviceMessageMethodEnum,
  IoTThingModelTypeEnum
} from '@/views/iot/utils/constants'
import {
  bytesToBase64,
  MODBUS_PDU_MAX_BYTES,
  MODBUS_PDU_MIN_BYTES,
  MODBUS_WRITE_FUNCTION_CODES,
  parseHex,
  RAW_PAYLOAD_MAX_BYTES
} from '@/views/iot/utils/raw'
import { checkPermi } from '@/utils/permission'

const props = defineProps<{
  product: ProductVO
  device: DeviceVO
  thingModelList: ThingModelData[]
}>()

const message = useMessage() // 消息弹窗
const activeTab = ref('upstream') // 上行upstream、下行downstream、透传下发raw
const upstreamTab = ref(IotDeviceMessageMethodEnum.PROPERTY_POST.method) // 上行子标签
const downstreamTab = ref(IotDeviceMessageMethodEnum.PROPERTY_SET.method) // 下行子标签
const deviceMessageRef = ref() // 设备消息组件引用
const deviceMessageRefreshDelay = 2000 // 延迟 N 秒，保证模拟上行的消息被处理

// 表单数据：存储用户输入的模拟值
const formData = ref<Record<string, string>>({})

// 根据类型过滤物模型数据
const getFilteredThingModelList = (type: number) => {
  return props.thingModelList.filter((item) => item.type === type)
}
const propertyList = computed(() => getFilteredThingModelList(IoTThingModelTypeEnum.PROPERTY))
const eventList = computed(() => getFilteredThingModelList(IoTThingModelTypeEnum.EVENT))
const serviceList = computed(() => getFilteredThingModelList(IoTThingModelTypeEnum.SERVICE))

/** 获取表单值的辅助函数 */
const getFormValue = (identifier: string | number | undefined) => {
  if (!identifier) return ''
  return formData.value[String(identifier)] || ''
}
/** 设置表单值的辅助函数 */
const setFormValue = (identifier: string | number | undefined, value: string) => {
  if (!identifier) return
  formData.value[String(identifier)] = value
}

/** 模拟属性上报 */
const handlePropertyPost = async () => {
  const data: Record<string, any> = {}
  propertyList.value.forEach((item) => {
    const value = getFormValue(item.identifier)
    if (value && item.identifier) {
      data[String(item.identifier)] = value
    }
  })
  if (Object.keys(data).length === 0) {
    message.warning('请至少设置一个属性值')
    return
  }

  try {
    await DeviceApi.sendDeviceMessage({
      deviceId: props.device.id,
      method: IotDeviceMessageMethodEnum.PROPERTY_POST.method,
      params: data
    })
    message.success('属性上报成功')
    deviceMessageRef.value.refresh(deviceMessageRefreshDelay)
  } catch (error) {
    message.error('属性上报失败')
  }
}

/** 模拟事件上报 */
const handleEventPost = async (eventItem: ThingModelData) => {
  const value = getFormValue(eventItem.identifier)
  if (!value) {
    message.warning('请输入事件参数')
    return
  }
  let eventParams: any
  try {
    eventParams = JSON.parse(value)
  } catch {
    message.error('事件参数格式不正确，请输入有效的JSON格式')
    return
  }

  try {
    await DeviceApi.sendDeviceMessage({
      deviceId: props.device.id,
      method: IotDeviceMessageMethodEnum.EVENT_POST.method,
      params: {
        identifier: String(eventItem.identifier),
        value: eventParams,
        time: Date.now()
      }
    })
    message.success(`事件【${String(eventItem.name)}】上报成功`)
    deviceMessageRef.value.refresh(deviceMessageRefreshDelay)
  } catch (error) {
    message.error(`事件【${String(eventItem.name)}】上报失败`)
  }
}

/** 模拟设备状态 */
const handleDeviceState = async (state: number) => {
  try {
    await DeviceApi.sendDeviceMessage({
      deviceId: props.device.id,
      method: IotDeviceMessageMethodEnum.STATE_UPDATE.method,
      params: {
        state: state
      }
    })
    message.success(`设备${state === DeviceStateEnum.ONLINE ? '上线' : '下线'}成功`)
    deviceMessageRef.value.refresh(deviceMessageRefreshDelay)
  } catch (error) {
    message.error(`设备${state === DeviceStateEnum.ONLINE ? '上线' : '下线'}失败`)
  }
}

/** 模拟属性设置 */
const handlePropertySet = async () => {
  const data: Record<string, any> = {}
  propertyList.value.forEach((item) => {
    const value = getFormValue(item.identifier)
    if (value && item.identifier) {
      data[String(item.identifier)] = value
    }
  })
  if (Object.keys(data).length === 0) {
    message.warning('请至少设置一个属性值')
    return
  }

  try {
    await DeviceApi.sendDeviceMessage({
      deviceId: props.device.id,
      method: IotDeviceMessageMethodEnum.PROPERTY_SET.method,
      params: data
    })
    message.success('属性设置成功')
    deviceMessageRef.value.refresh(deviceMessageRefreshDelay)
  } catch (error) {
    message.error('属性设置失败')
  }
}

/** 模拟服务调用 */
const handleServiceInvoke = async (serviceItem: ThingModelData) => {
  const value = getFormValue(serviceItem.identifier)
  if (!value) {
    message.warning('请输入服务参数')
    return
  }
  let serviceParams: any
  try {
    serviceParams = JSON.parse(value)
  } catch {
    message.error('服务参数格式不正确，请输入有效的JSON格式')
    return
  }

  try {
    await DeviceApi.sendDeviceMessage({
      deviceId: props.device.id,
      method: IotDeviceMessageMethodEnum.SERVICE_INVOKE.method,
      params: {
        identifier: String(serviceItem.identifier),
        inputParams: serviceParams
      }
    })
    message.success(`服务【${String(serviceItem.name)}】调用成功`)
    deviceMessageRef.value.refresh(deviceMessageRefreshDelay)
  } catch (error) {
    message.error(`服务【${String(serviceItem.name)}】调用失败`)
  }
}

// ========== 透传下发 ==========

// 是否有透传下发权限：需要同时拥有消息发送、透传下发权限
const canRawSend =
  checkPermi(['iot:device:message-send']) && checkPermi(['iot:device:message-raw-send'])
const rawPayloadHex = ref('') // 透传载荷 HEX
const rawSending = ref(false) // 透传下发中

/** 是否为 Modbus 产品：载荷为 Modbus PDU */
const isModbusProduct = computed(() =>
  [ProtocolTypeEnum.MODBUS_TCP_CLIENT, ProtocolTypeEnum.MODBUS_TCP_SERVER].includes(
    props.product.protocolType as ProtocolTypeEnum
  )
)

/** 是否支持透传下发：HTTP、CoAP 不支持 */
const rawSupported = computed(
  () =>
    ![ProtocolTypeEnum.HTTP, ProtocolTypeEnum.COAP].includes(
      props.product.protocolType as ProtocolTypeEnum
    )
)

/** 透传下发：确认后真实发送给设备；Modbus 写操作额外确认功能码和地址 */
const handleRawPush = async () => {
  // 1. 校验载荷
  const bytes = parseHex(rawPayloadHex.value)
  if (!bytes) {
    message.warning('请输入合法的 HEX（偶数位十六进制字符，允许空格）')
    return
  }
  const minBytes = isModbusProduct.value ? MODBUS_PDU_MIN_BYTES : 1
  const maxBytes = isModbusProduct.value ? MODBUS_PDU_MAX_BYTES : RAW_PAYLOAD_MAX_BYTES
  if (bytes.length < minBytes || bytes.length > maxBytes) {
    message.warning(`载荷需为 ${minBytes}~${maxBytes} 字节，当前 ${bytes.length} 字节`)
    return
  }

  // 2. 二次确认
  await message.confirm(`将真实发送给设备（${bytes.length} 字节），确认发送？`)
  const writeName = isModbusProduct.value ? MODBUS_WRITE_FUNCTION_CODES[bytes[0]] : undefined
  if (writeName) {
    const functionCode = bytes[0].toString(16).toUpperCase().padStart(2, '0')
    const address = (bytes[1] << 8) | bytes[2]
    const addressHex = address.toString(16).toUpperCase().padStart(4, '0')
    await message.confirm(
      `这是 Modbus 写操作：功能码 0x${functionCode}（${writeName}），地址 ${address}（0x${addressHex}）。确认写入设备？`,
      '写操作确认'
    )
  }

  // 3. 发送
  rawSending.value = true
  try {
    await DeviceApi.sendDeviceMessage({
      deviceId: props.device.id,
      method: IotDeviceMessageMethodEnum.RAW_PUSH.method,
      params: { payload: bytesToBase64(bytes) }
    })
    message.success('透传下发成功')
    deviceMessageRef.value.refresh(deviceMessageRefreshDelay)
  } finally {
    rawSending.value = false
  }
}
</script>
