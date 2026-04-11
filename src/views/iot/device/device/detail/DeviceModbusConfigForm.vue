<!-- Modbus 连接配置弹窗 -->
<template>
  <Dialog title="编辑 Modbus 连接配置" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <!-- Client 模式专有字段：IP、端口、超时、重试 -->
      <template v-if="isClient">
        <el-form-item label="IP 地址" prop="ip">
          <el-input v-model="formData.ip" placeholder="请输入 Modbus 服务器 IP 地址" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number
            v-model="formData.port"
            placeholder="请输入端口"
            :min="1"
            :max="65535"
            controls-position="right"
            class="!w-full"
          />
        </el-form-item>
      </template>
      <!-- 公共字段：从站地址 -->
      <el-form-item label="从站地址" prop="slaveId">
        <el-input-number
          v-model="formData.slaveId"
          :min="1"
          :max="247"
          controls-position="right"
          placeholder="请输入从站地址，范围 1-247"
          class="!w-full"
        />
      </el-form-item>
      <!-- Client 模式专有字段：超时、重试 -->
      <template v-if="isClient">
        <el-form-item label="连接超时(ms)" prop="timeout">
          <el-input-number
            v-model="formData.timeout"
            :min="1000"
            :step="1000"
            controls-position="right"
            placeholder="请输入连接超时时间"
            class="!w-full"
          />
        </el-form-item>
        <el-form-item label="重试间隔(ms)" prop="retryInterval">
          <el-input-number
            v-model="formData.retryInterval"
            :min="1000"
            :step="1000"
            controls-position="right"
            placeholder="请输入重试间隔"
            class="!w-full"
          />
        </el-form-item>
      </template>
      <!-- Server 模式专有字段：模式、帧格式 -->
      <template v-if="isServer">
        <el-form-item label="工作模式" prop="mode">
          <el-radio-group v-model="formData.mode">
            <el-radio
              v-for="dict in getIntDictOptions(DICT_TYPE.IOT_MODBUS_MODE)"
              :key="dict.value"
              :label="dict.value"
            >
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="帧格式" prop="frameFormat">
          <el-radio-group v-model="formData.frameFormat">
            <el-radio
              v-for="dict in getIntDictOptions(DICT_TYPE.IOT_MODBUS_FRAME_FORMAT)"
              :key="dict.value"
              :label="dict.value"
            >
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </template>
      <!-- 公共字段：状态 -->
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="formLoading">确定</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DeviceModbusConfigApi, DeviceModbusConfigVO } from '@/api/iot/device/modbus/config'
import { ProtocolTypeEnum } from '@/api/iot/product/product'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { ModbusModeEnum, ModbusFrameFormatEnum } from '@/views/iot/utils/constants'

defineOptions({ name: 'DeviceModbusConfigForm' })

const props = defineProps<{
  deviceId: number
  protocolType: string
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const message = useMessage()
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单提交 loading 状态
const isClient = computed(() => props.protocolType === ProtocolTypeEnum.MODBUS_TCP_CLIENT) // 是否为 Client 模式
const isServer = computed(() => props.protocolType === ProtocolTypeEnum.MODBUS_TCP_SERVER) // 是否为 Server 模式
const formData = ref<DeviceModbusConfigVO>({
  deviceId: props.deviceId,
  ip: '',
  port: 502,
  slaveId: 1,
  timeout: 3000,
  retryInterval: 10000,
  mode: ModbusModeEnum.POLLING,
  frameFormat: ModbusFrameFormatEnum.MODBUS_TCP,
  status: CommonStatusEnum.ENABLE
})
const formRules = computed(() => {
  const rules: Record<string, any[]> = {
    slaveId: [{ required: true, message: '请输入从站地址', trigger: 'blur' }]
  }
  if (isClient.value) {
    rules.ip = [{ required: true, message: '请输入 IP 地址', trigger: 'blur' }]
    rules.port = [{ required: true, message: '请输入端口', trigger: 'blur' }]
    rules.timeout = [{ required: true, message: '请输入连接超时时间', trigger: 'blur' }]
    rules.retryInterval = [{ required: true, message: '请输入重试间隔', trigger: 'blur' }]
  }
  if (isServer.value) {
    rules.mode = [{ required: true, message: '请选择工作模式', trigger: 'change' }]
    rules.frameFormat = [{ required: true, message: '请选择帧格式', trigger: 'change' }]
  }
  return rules
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (data?: DeviceModbusConfigVO) => {
  dialogVisible.value = true
  resetForm()
  // 编辑模式
  if (data && data.id) {
    formData.value = { ...data }
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    deviceId: props.deviceId,
    ip: '',
    port: 502,
    slaveId: 1,
    timeout: 3000,
    retryInterval: 10000,
    mode: ModbusModeEnum.POLLING,
    frameFormat: ModbusFrameFormatEnum.MODBUS_TCP,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    formData.value.deviceId = props.deviceId
    await DeviceModbusConfigApi.saveModbusConfig(formData.value)
    message.success('保存成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 暴露方法 */
defineExpose({ open })
</script>
