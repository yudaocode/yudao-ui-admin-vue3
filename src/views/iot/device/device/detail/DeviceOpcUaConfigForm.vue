<!-- OPC UA 连接配置弹窗 -->
<template>
  <Dialog title="编辑 OPC UA 连接配置" v-model="dialogVisible" width="640px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-alert
        v-if="legacyAdjusted"
        title="原配置使用匿名认证或 None / Sign，已不受支持，已调整为用户名认证 + SignAndEncrypt，请确认凭据别名后保存"
        type="warning"
        show-icon
        :closable="false"
        class="mb-4"
      />
      <el-form-item label="端点地址" prop="endpointUrl">
        <el-input
          v-model="formData.endpointUrl"
          placeholder="例如：opc.tcp://192.168.1.10:4840/server"
          maxlength="255"
        />
      </el-form-item>
      <el-form-item label="安全策略" prop="securityPolicy">
        <el-select v-model="formData.securityPolicy" placeholder="请选择安全策略" class="!w-full">
          <el-option
            v-for="item in OpcUaSecurityPolicyOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="安全模式" prop="securityMode">
        <template #label>
          <Tooltip message="用户名认证的口令必须加密传输，只能使用 SignAndEncrypt" title="安全模式" />
        </template>
        <el-select v-model="formData.securityMode" placeholder="请选择安全模式" class="!w-full">
          <el-option
            v-for="item in OpcUaSecurityModeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="认证方式" prop="authType">
        <template #label>
          <Tooltip message="OPC UA Client 只支持用户名认证，不支持匿名" title="认证方式" />
        </template>
        <el-radio-group v-model="formData.authType">
          <el-radio v-for="item in authTypeOptions" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="凭据别名" prop="credentialAlias">
        <template #label>
          <Tooltip
            message="账号、口令只保存在网关本地（credentials），这里只引用别名"
            title="凭据别名"
          />
        </template>
        <el-input
          v-model="formData.credentialAlias"
          placeholder="网关配置的凭据别名，例如：plc-reader"
          maxlength="64"
        />
      </el-form-item>
      <el-form-item label="请求超时(ms)" prop="timeout">
        <el-input-number
          v-model="formData.timeout"
          :min="1000"
          :max="600000"
          :step="1000"
          controls-position="right"
          placeholder="请输入请求超时时间"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item label="重试间隔(ms)" prop="retryInterval">
        <el-input-number
          v-model="formData.retryInterval"
          :min="1000"
          :max="600000"
          :step="1000"
          controls-position="right"
          placeholder="请输入重试间隔"
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
import { DeviceOpcUaConfigApi, DeviceOpcUaConfigVO } from '@/api/iot/device/opcua/config'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import {
  OpcUaAuthTypeEnum,
  OpcUaAuthTypeOptions,
  OpcUaSecurityModeEnum,
  OpcUaSecurityModeOptions,
  OpcUaSecurityPolicyOptions
} from '@/views/iot/utils/constants'

defineOptions({ name: 'DeviceOpcUaConfigForm' })

const props = defineProps<{
  deviceId: number
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const SECURITY_NONE = 'None'
const DEFAULT_SECURITY_POLICY = 'Basic256Sha256'

const message = useMessage()
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单提交 loading 状态
const formData = ref<DeviceOpcUaConfigVO>(buildDefaultFormData())
const formRef = ref() // 表单 Ref
const legacyAdjusted = ref(false) // 编辑的历史配置是否被调整为用户名认证

/** 认证方式选项：只支持用户名认证 */
const authTypeOptions = OpcUaAuthTypeOptions.filter(
  (item) => item.value === OpcUaAuthTypeEnum.USERNAME
)

/** 校验端点地址：opc.tcp://主机:端口[/路径]，不能带用户信息、查询参数和片段 */
const validateEndpointUrl = (_rule: any, value: string, callback: any) => {
  const matched = /^opc\.tcp:\/\/(\[[0-9a-fA-F:.]+\]|[^/@\s:?#[\]]+):(\d{1,5})(\/[^\s?#]*)?$/i.exec(
    (value || '').trim()
  )
  if (!matched || Number(matched[2]) < 1 || Number(matched[2]) > 65535) {
    callback(new Error('端点地址必须以 opc.tcp:// 开头，并包含主机和端口，不能带查询参数和片段'))
    return
  }
  callback()
}

const formRules = {
  endpointUrl: [
    { required: true, message: '请输入端点地址', trigger: 'blur' },
    { validator: validateEndpointUrl, trigger: 'blur' }
  ],
  securityPolicy: [{ required: true, message: '请选择安全策略', trigger: 'change' }],
  securityMode: [{ required: true, message: '请选择安全模式', trigger: 'change' }],
  authType: [{ required: true, message: '请选择认证方式', trigger: 'change' }],
  credentialAlias: [
    { required: true, message: '请输入凭据别名', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9_.-]+$/,
      message: '凭据别名只能包含字母、数字、下划线、点和中划线',
      trigger: 'blur'
    }
  ],
  timeout: [{ required: true, message: '请输入请求超时时间', trigger: 'blur' }],
  retryInterval: [{ required: true, message: '请输入重试间隔', trigger: 'blur' }]
}

/** 打开弹窗 */
const open = async (data?: DeviceOpcUaConfigVO) => {
  dialogVisible.value = true
  resetForm()
  // 编辑模式：只支持用户名认证 + SignAndEncrypt，历史的匿名、None、Sign 配置回填时调整，与新增的默认值一致
  if (data && data.id) {
    const securityPolicy =
      !data.securityPolicy || data.securityPolicy === SECURITY_NONE
        ? DEFAULT_SECURITY_POLICY
        : data.securityPolicy
    legacyAdjusted.value =
      data.authType !== OpcUaAuthTypeEnum.USERNAME ||
      securityPolicy !== data.securityPolicy ||
      data.securityMode !== OpcUaSecurityModeEnum.SIGN_AND_ENCRYPT
    formData.value = {
      ...data,
      securityPolicy,
      securityMode: OpcUaSecurityModeEnum.SIGN_AND_ENCRYPT,
      authType: OpcUaAuthTypeEnum.USERNAME,
      credentialAlias: data.credentialAlias || ''
    }
  }
}

/** 默认表单 */
function buildDefaultFormData(): DeviceOpcUaConfigVO {
  return {
    deviceId: props.deviceId,
    endpointUrl: '',
    securityPolicy: DEFAULT_SECURITY_POLICY,
    securityMode: OpcUaSecurityModeEnum.SIGN_AND_ENCRYPT,
    authType: OpcUaAuthTypeEnum.USERNAME,
    credentialAlias: '',
    timeout: 5000,
    retryInterval: 10000,
    status: CommonStatusEnum.ENABLE
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = buildDefaultFormData()
  legacyAdjusted.value = false
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
    const data = {
      ...formData.value,
      deviceId: props.deviceId,
      endpointUrl: formData.value.endpointUrl.trim()
    }
    await DeviceOpcUaConfigApi.saveOpcUaConfig(data)
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
