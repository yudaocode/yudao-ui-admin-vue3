<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="桥梁名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入桥梁名称" />
      </el-form-item>
      <el-form-item label="桥梁方向" prop="direction">
        <el-radio-group v-model="formData.direction">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_DATA_BRIDGE_DIRECTION_ENUM)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="桥梁类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_DATA_BRIDGE_TYPE_ENUM)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <HttpConfigForm v-if="showConfig(IoTDataBridgeConfigType.HTTP)" v-model="formData.config" />
      <MqttConfigForm v-if="showConfig(IoTDataBridgeConfigType.MQTT)" v-model="formData.config" />
      <RocketMQConfigForm
        v-if="showConfig(IoTDataBridgeConfigType.ROCKETMQ)"
        v-model="formData.config"
      />
      <KafkaMQConfigForm
        v-if="showConfig(IoTDataBridgeConfigType.KAFKA)"
        v-model="formData.config!"
      />
      <RabbitMQConfigForm
        v-if="showConfig(IoTDataBridgeConfigType.RABBITMQ)"
        v-model="formData.config!"
      />
      <RedisStreamMQConfigForm
        v-if="showConfig(IoTDataBridgeConfigType.REDIS_STREAM)"
        v-model="formData.config!"
      />
      <el-form-item label="桥梁状态" prop="status">
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
      <el-form-item label="桥梁描述" prop="description">
        <el-input v-model="formData.description" height="150px" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import { DataBridgeApi, DataBridgeVO, IoTDataBridgeConfigType } from '@/api/iot/rule/databridge'
import {
  HttpConfigForm,
  KafkaMQConfigForm,
  MqttConfigForm,
  RabbitMQConfigForm,
  RedisStreamMQConfigForm,
  RocketMQConfigForm
} from './config'

/** IoT 数据桥梁 表单 */
defineOptions({ name: 'IoTDataBridgeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<DataBridgeVO>({
  status: 0,
  direction: 1,
  type: 1,
  config: {} as any
})
const formRules = reactive({
  name: [{ required: true, message: '桥梁名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '桥梁状态不能为空', trigger: 'blur' }],
  direction: [{ required: true, message: '桥梁方向不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '桥梁类型不能为空', trigger: 'change' }],
  'config.bootstrapServers': [{ required: true, message: '服务地址不能为空', trigger: 'blur' }],
  'config.topic': [{ required: true, message: '主题不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const showConfig = computed(() => (val: string) => {
  const label = getDictLabel(DICT_TYPE.IOT_DATA_BRIDGE_TYPE_ENUM, formData.value.type)
  return label && label === val
}) // 显示对应的 Config 配置项
/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await DataBridgeApi.getDataBridge(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as DataBridgeVO
    if (formType.value === 'create') {
      await DataBridgeApi.createDataBridge(data)
      message.success(t('common.createSuccess'))
    } else {
      await DataBridgeApi.updateDataBridge(data)
      message.success(t('common.updateSuccess'))
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
    status: 0,
    direction: 1,
    type: 1,
    config: {} as any
  }
  formRef.value?.resetFields()
}
</script>
