<!-- Modbus 点位表单弹窗 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="物模型属性" prop="thingModelId">
        <el-select
          v-model="formData.thingModelId"
          placeholder="请选择物模型属性"
          filterable
          class="!w-full"
          @change="handleThingModelChange"
        >
          <el-option
            v-for="item in propertyList"
            :key="item.id!"
            :label="`${item.name} (${item.identifier})`"
            :value="item.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="功能码" prop="functionCode">
        <el-select v-model="formData.functionCode" placeholder="请选择功能码" class="!w-full">
          <el-option
            v-for="item in ModbusFunctionCodeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="寄存器地址" prop="registerAddress">
        <el-input
          v-model.number="formData.registerAddress"
          type="number"
          :min="0"
          :max="65535"
          placeholder="请输入寄存器地址"
          class="!w-full"
        >
          <template #suffix>
            <span class="text-gray-400">{{ registerAddressHex }}</span>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="寄存器数量" prop="registerCount">
        <el-input-number
          v-model="formData.registerCount"
          :min="1"
          :max="125"
          controls-position="right"
          placeholder="请输入寄存器数量"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item label="原始数据类型" prop="rawDataType">
        <el-select
          v-model="formData.rawDataType"
          placeholder="请选择数据类型"
          class="!w-full"
          @change="handleRawDataTypeChange"
        >
          <el-option
            v-for="item in ModbusRawDataTypeOptions"
            :key="item.value"
            :label="`${item.label} - ${item.description}`"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="字节序" prop="byteOrder">
        <el-select v-model="formData.byteOrder" placeholder="请选择字节序" class="!w-full">
          <el-option
            v-for="item in currentByteOrderOptions"
            :key="item.value"
            :label="`${item.label} - ${item.description}`"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="缩放因子" prop="scale">
        <el-input-number
          v-model="formData.scale"
          :precision="6"
          :step="0.1"
          controls-position="right"
          placeholder="请输入缩放因子"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item label="轮询间隔(ms)" prop="pollInterval">
        <el-input-number
          v-model="formData.pollInterval"
          :min="100"
          :step="1000"
          controls-position="right"
          placeholder="请输入轮询间隔"
          class="!w-full"
        />
      </el-form-item>
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
import { ThingModelData } from '@/api/iot/thingmodel'
import { DeviceModbusPointApi, DeviceModbusPointVO } from '@/api/iot/device/modbus/point'
import {
  ModbusFunctionCodeOptions,
  ModbusRawDataTypeOptions,
  getByteOrderOptions,
  IoTThingModelTypeEnum
} from '@/views/iot/utils/constants'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'DeviceModbusPointForm' })

const props = defineProps<{
  deviceId: number
  thingModelList: ThingModelData[]
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const { t } = useI18n()
const message = useMessage()
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<DeviceModbusPointVO>({
  deviceId: props.deviceId,
  thingModelId: undefined,
  identifier: '',
  name: '',
  functionCode: undefined,
  registerAddress: undefined,
  registerCount: undefined,
  byteOrder: undefined,
  rawDataType: undefined,
  scale: 1,
  pollInterval: 5000,
  status: CommonStatusEnum.ENABLE
})

const formRules = {
  thingModelId: [{ required: true, message: '请选择物模型属性', trigger: 'change' }],
  functionCode: [{ required: true, message: '请选择功能码', trigger: 'change' }],
  registerAddress: [{ required: true, message: '请输入寄存器地址', trigger: 'blur' }],
  registerCount: [{ required: true, message: '请输入寄存器数量', trigger: 'blur' }],
  rawDataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }],
  pollInterval: [{ required: true, message: '请输入轮询间隔', trigger: 'blur' }]
}
const formRef = ref() // 表单 Ref

/** 寄存器地址十六进制显示 */
const registerAddressHex = computed(() => {
  if (formData.value.registerAddress === undefined || formData.value.registerAddress === null) {
    return ''
  }
  return '0x' + formData.value.registerAddress.toString(16).toUpperCase().padStart(4, '0')
})

/** 筛选属性类型的物模型 */
const propertyList = computed(() => {
  return props.thingModelList.filter((item) => item.type === IoTThingModelTypeEnum.PROPERTY)
})

/** 当前字节序选项（根据数据类型动态变化） */
const currentByteOrderOptions = computed(() => {
  if (!formData.value.rawDataType) {
    return []
  }
  return getByteOrderOptions(formData.value.rawDataType)
})

/** 物模型属性变化 */
const handleThingModelChange = (thingModelId: number) => {
  const thingModel = props.thingModelList.find((item) => item.id === thingModelId)
  if (thingModel) {
    formData.value.identifier = thingModel.identifier!
    formData.value.name = thingModel.name!
  }
}

/** 数据类型变化 */
const handleRawDataTypeChange = (rawDataType: string) => {
  // 根据数据类型自动设置寄存器数量
  const option = ModbusRawDataTypeOptions.find((item) => item.value === rawDataType)
  if (option && option.registerCount > 0) {
    formData.value.registerCount = option.registerCount
  }

  // 重置字节序为第一个选项
  const byteOrderOptions = getByteOrderOptions(rawDataType)
  if (byteOrderOptions.length > 0) {
    formData.value.byteOrder = byteOrderOptions[0].value
  }
}

/** 打开弹窗 */
const open = async (type: 'create' | 'update', id?: number) => {
  dialogVisible.value = true
  formType.value = type
  dialogTitle.value = t('action.' + type)
  resetForm()
  // 修改时，设置数据
  if (type === 'update' && id) {
    formLoading.value = true
    try {
      formData.value = await DeviceModbusPointApi.getModbusPoint(id)
    } finally {
      formLoading.value = false
    }
  }
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
    if (formType.value === 'create') {
      await DeviceModbusPointApi.createModbusPoint(formData.value)
      message.success('创建成功')
    } else {
      await DeviceModbusPointApi.updateModbusPoint(formData.value)
      message.success('更新成功')
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    deviceId: props.deviceId,
    thingModelId: undefined,
    identifier: '',
    name: '',
    functionCode: undefined,
    registerAddress: undefined,
    registerCount: undefined,
    byteOrder: undefined,
    rawDataType: undefined,
    scale: 1,
    pollInterval: 5000,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}

/** 暴露方法 */
defineExpose({ open })
</script>
