<!-- OPC UA 点位表单弹窗 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="640px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      v-loading="formLoading"
    >
      <el-form-item label="物模型属性" prop="thingModelId">
        <el-select
          v-model="formData.thingModelId"
          placeholder="请选择物模型属性"
          filterable
          class="!w-full"
        >
          <el-option
            v-for="item in propertyList"
            :key="item.id!"
            :label="`${item.name} (${item.identifier})`"
            :value="item.id!"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="NodeId" prop="nodeId">
        <template #label>
          <Tooltip
            message="格式：[nsu=命名空间 URI; | ns=索引;] + i=数字 | s=字符串 | g=GUID | b=Base64；推荐 nsu= 写法"
            title="NodeId"
          />
        </template>
        <el-input
          v-model="formData.nodeId"
          placeholder="例如：nsu=urn:plc:line1;s=Line1.Temperature"
          maxlength="512"
          class="font-mono"
        />
      </el-form-item>
      <el-alert
        v-if="isNamespaceIndexBased"
        title="ns= 索引可能随服务端重启、命名空间顺序变化而指向其它命名空间，建议改为 nsu= 写法"
        type="warning"
        show-icon
        :closable="false"
        class="mb-4"
      />
      <el-form-item label="采集方式" prop="collectMode">
        <el-radio-group v-model="formData.collectMode">
          <el-radio v-for="item in OpcUaCollectModeOptions" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="采集间隔(ms)" prop="collectInterval">
        <template #label>
          <Tooltip
            message="轮询：每隔该间隔 Read 一次；订阅：作为发布间隔和采样间隔，值变化时上报"
            title="采集间隔(ms)"
          />
        </template>
        <el-input-number
          v-model="formData.collectInterval"
          :min="100"
          :max="86400000"
          :step="1000"
          controls-position="right"
          placeholder="请输入采集间隔"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item label="是否可写" prop="writable">
        <template #label>
          <Tooltip
            message="开启后允许属性设置（thing.property.set）写入该节点的 Value；需要物模型属性为读写，网关还会校验节点的数据类型和访问级别"
            title="是否可写"
          />
        </template>
        <!-- 已开启但物模型属性变为只读时（历史数据）仍可关闭，只禁止开启 -->
        <el-switch v-model="formData.writable" :disabled="!writableAllowed && !formData.writable" />
        <span v-if="formData.thingModelId && !writableAllowed" class="ml-2 text-xs text-gray-400">
          物模型属性为只读，不能开启
        </span>
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
import { DeviceOpcUaPointApi, DeviceOpcUaPointVO } from '@/api/iot/device/opcua/point'
import {
  IoTThingModelAccessModeEnum,
  IoTThingModelTypeEnum,
  OpcUaCollectModeEnum,
  OpcUaCollectModeOptions
} from '@/views/iot/utils/constants'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'DeviceOpcUaPointForm' })

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
const formData = ref<DeviceOpcUaPointVO>(buildDefaultFormData())
const formRef = ref() // 表单 Ref

/**
 * NodeId 语法：与后端 IotOpcUaUtils.isValidNodeId 一致
 * 1. nsu= 的命名空间 URI 不能为空白，也不能带首尾空白；
 * 2. b= 与 java.util.Base64 基本解码器一致：末尾分组可以省略填充，但至少 2 个字符；带填充时数量必须正确且只能在末尾；解码结果不能为空
 */
const NODE_ID_PATTERN =
  /^(ns=\d{1,5};|nsu=[^;\s](?:[^;]*[^;\s])?;)?(i=\d{1,10}|s=.+|g=[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|b=(?=.)(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}(?:==)?|[A-Za-z0-9+/]{3}=?)?)$/

/** 校验 NodeId */
const validateNodeId = (_rule: any, value: string, callback: any) => {
  const nodeId = (value || '').trim()
  const nsMatched = /^ns=(\d+);/.exec(nodeId)
  const numericMatched = /(?:^|;)i=(\d+)$/.exec(nodeId)
  if (
    !NODE_ID_PATTERN.test(nodeId) ||
    (nsMatched && Number(nsMatched[1]) > 65535) ||
    (numericMatched && Number(numericMatched[1]) > 4294967295)
  ) {
    callback(new Error('NodeId 格式不正确，例如：nsu=urn:plc;s=Tag1、ns=2;i=1001'))
    return
  }
  callback()
}

const formRules = {
  thingModelId: [{ required: true, message: '请选择物模型属性', trigger: 'change' }],
  nodeId: [
    { required: true, message: '请输入 NodeId', trigger: 'blur' },
    { validator: validateNodeId, trigger: 'blur' }
  ],
  collectMode: [{ required: true, message: '请选择采集方式', trigger: 'change' }],
  collectInterval: [{ required: true, message: '请输入采集间隔', trigger: 'blur' }]
}

/** 筛选属性类型的物模型 */
const propertyList = computed(() => {
  return props.thingModelList.filter((item) => item.type === IoTThingModelTypeEnum.PROPERTY)
})

/** 选中的物模型属性 */
const selectedProperty = computed(() =>
  propertyList.value.find((item) => item.id === formData.value.thingModelId)
)

/** 选中的物模型属性是否为读写：只有读写属性的点位才能开启可写 */
const writableAllowed = computed(
  () =>
    selectedProperty.value?.property?.accessMode === IoTThingModelAccessModeEnum.READ_WRITE.value
)

/** 不可写时（物模型属性为只读、已删除或未选择）关闭可写 */
const clearWritableIfNotAllowed = () => {
  if (!writableAllowed.value && formData.value.writable) {
    formData.value.writable = false
  }
}

/** 切换物模型属性、属性的读写模式变化时：只要不可写就关闭可写 */
watch([() => formData.value.thingModelId, writableAllowed], clearWritableIfNotAllowed)

/** 是否使用 ns= 索引写法 */
const isNamespaceIndexBased = computed(() => (formData.value.nodeId || '').trim().startsWith('ns='))

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
      formData.value = await DeviceOpcUaPointApi.getOpcUaPoint(id)
      // 物模型属性后来改为只读或已删除：加载后立即关闭可写（watch 只在变化时触发，加载前后都不可写时不会触发）
      clearWritableIfNotAllowed()
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
    // 可写只在物模型属性为读写时提交 true，避免提交残留的 true
    const data = {
      ...formData.value,
      nodeId: formData.value.nodeId.trim(),
      writable: writableAllowed.value && !!formData.value.writable
    }
    if (formType.value === 'create') {
      await DeviceOpcUaPointApi.createOpcUaPoint(data)
      message.success('创建成功')
    } else {
      await DeviceOpcUaPointApi.updateOpcUaPoint(data)
      message.success('更新成功')
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 默认表单 */
function buildDefaultFormData(): DeviceOpcUaPointVO {
  return {
    deviceId: props.deviceId,
    thingModelId: undefined,
    nodeId: '',
    collectMode: OpcUaCollectModeEnum.SUBSCRIBE,
    collectInterval: 1000,
    writable: false,
    status: CommonStatusEnum.ENABLE
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = buildDefaultFormData()
  formRef.value?.resetFields()
}

/** 暴露方法 */
defineExpose({ open })
</script>
