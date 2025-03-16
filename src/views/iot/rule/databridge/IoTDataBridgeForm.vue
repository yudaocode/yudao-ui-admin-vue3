<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
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
        <el-radio-group :model-value="formData.type" @change="handleTypeChange">
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
        v-model="formData.config"
      />
      <RabbitMQConfigForm
        v-if="showConfig(IoTDataBridgeConfigType.RABBITMQ)"
        v-model="formData.config"
      />
      <RedisStreamMQConfigForm
        v-if="showConfig(IoTDataBridgeConfigType.REDIS_STREAM)"
        v-model="formData.config"
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
import { DICT_TYPE, getDictObj, getIntDictOptions } from '@/utils/dict'
import { DataBridgeApi, DataBridgeVO, IoTDataBridgeConfigType } from '@/api/iot/rule/databridge'
import {
  HttpConfigForm,
  KafkaMQConfigForm,
  MqttConfigForm,
  RabbitMQConfigForm,
  RedisStreamMQConfigForm,
  RocketMQConfigForm
} from './config'

/** IoT 数据桥梁的表单 */
defineOptions({ name: 'IoTDataBridgeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<DataBridgeVO>({
  status: 0,
  direction: 1, // TODO @puhui999:枚举类
  type: 1, // TODO @puhui999:枚举类
  config: {} as any
})
const formRules = reactive({
  // 通用字段
  name: [{ required: true, message: '桥梁名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '桥梁状态不能为空', trigger: 'blur' }],
  direction: [{ required: true, message: '桥梁方向不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '桥梁类型不能为空', trigger: 'change' }],
  // HTTP 配置
  'config.url': [{ required: true, message: '请求地址不能为空', trigger: 'blur' }],
  'config.method': [{ required: true, message: '请求方法不能为空', trigger: 'blur' }],
  // MQTT 配置
  'config.username': [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  'config.password': [{ required: true, message: '密码不能为空', trigger: 'blur' }],
  'config.clientId': [{ required: true, message: '客户端ID不能为空', trigger: 'blur' }],
  'config.topic': [{ required: true, message: '主题不能为空', trigger: 'blur' }],
  // RocketMQ 配置
  'config.nameServer': [{ required: true, message: 'NameServer 地址不能为空', trigger: 'blur' }],
  'config.accessKey': [{ required: true, message: 'AccessKey 不能为空', trigger: 'blur' }],
  'config.secretKey': [{ required: true, message: 'SecretKey 不能为空', trigger: 'blur' }],
  'config.group': [{ required: true, message: '消费组不能为空', trigger: 'blur' }],
  // Kafka 配置
  'config.bootstrapServers': [{ required: true, message: '服务地址不能为空', trigger: 'blur' }],
  'config.ssl': [{ required: true, message: 'SSL 配置不能为空', trigger: 'change' }],
  // RabbitMQ 配置
  'config.host': [{ required: true, message: '主机地址不能为空', trigger: 'blur' }],
  'config.port': [
    { required: true, message: '端口不能为空', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号范围 1-65535', trigger: 'blur' }
  ],
  'config.virtualHost': [{ required: true, message: '虚拟主机不能为空', trigger: 'blur' }],
  'config.exchange': [{ required: true, message: '交换机不能为空', trigger: 'blur' }],
  'config.routingKey': [{ required: true, message: '路由键不能为空', trigger: 'blur' }],
  'config.queue': [{ required: true, message: '队列不能为空', trigger: 'blur' }],
  // Redis Stream 配置
  'config.database': [
    { required: true, message: '数据库索引不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '数据库索引必须是非负整数', trigger: 'blur' }
  ]
})

const formRef = ref() // 表单 Ref
const showConfig = computed(() => (val: string) => {
  const dict = getDictObj(DICT_TYPE.IOT_DATA_BRIDGE_TYPE_ENUM, formData.value.type)
  return dict && dict.value + '' === val
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

/** 处理类型切换事件 */
const handleTypeChange = (val: number) => {
  formData.value.type = val
  // 切换类型时重置配置
  formData.value.config = {} as any
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    // TODO @puhui999：换成枚举值哈
    status: 0,
    direction: 1,
    type: 1,
    config: {} as any
  }
  formRef.value?.resetFields()
}
</script>
