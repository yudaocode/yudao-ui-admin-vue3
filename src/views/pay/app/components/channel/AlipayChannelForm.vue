<template>
  <div>
    <Dialog v-model="dialogVisible" :title="dialogTitle" @closed="close" width="830px">
      <el-form
        ref="formRef"
        :model="formData"
        :formRules="formRules"
        label-width="100px"
        v-loading="formLoading"
      >
        <el-form-item label-width="180px" label="渠道费率" prop="feeRate">
          <el-input v-model="formData.feeRate" placeholder="请输入渠道费率" clearable>
            <template #append>%</template>
          </el-input>
        </el-form-item>
        <el-form-item label-width="180px" label="开放平台 APPID" prop="config.appId">
          <el-input v-model="formData.config.appId" placeholder="请输入开放平台 APPID" clearable />
        </el-form-item>
        <el-form-item label-width="180px" label="渠道状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio
              v-for="dict in getDictOptions(DICT_TYPE.COMMON_STATUS)"
              :key="parseInt(dict.value)"
              :label="parseInt(dict.value)"
            >
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label-width="180px" label="网关地址" prop="config.serverUrl">
          <el-radio-group v-model="formData.config.serverUrl">
            <el-radio label="https://openapi.alipay.com/gateway.do">线上环境</el-radio>
            <el-radio label="https://openapi-sandbox.dl.alipaydev.com/gateway.do">
              沙箱环境
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label-width="180px" label="算法类型" prop="config.signType">
          <el-radio-group v-model="formData.config.signType">
            <el-radio key="RSA2" label="RSA2">RSA2</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label-width="180px" label="公钥类型" prop="config.mode">
          <el-radio-group v-model="formData.config.mode">
            <el-radio key="公钥模式" :label="1">公钥模式</el-radio>
            <el-radio key="证书模式" :label="2">证书模式</el-radio>
          </el-radio-group>
        </el-form-item>
        <div v-if="formData.config.mode === 1">
          <el-form-item label-width="180px" label="应用私钥" prop="config.privateKey">
            <el-input
              type="textarea"
              :autosize="{ minRows: 8, maxRows: 8 }"
              v-model="formData.config.privateKey"
              placeholder="请输入应用私钥"
              clearable
              :style="{ width: '100%' }"
            />
          </el-form-item>
          <el-form-item label-width="180px" label="支付宝公钥" prop="config.alipayPublicKey">
            <el-input
              type="textarea"
              :autosize="{ minRows: 8, maxRows: 8 }"
              v-model="formData.config.alipayPublicKey"
              placeholder="请输入支付宝公钥"
              clearable
              :style="{ width: '100%' }"
            />
          </el-form-item>
        </div>
        <div v-if="formData.config.mode === 2">
          <el-form-item label-width="180px" label="应用私钥" prop="config.privateKey">
            <el-input
              type="textarea"
              :autosize="{ minRows: 8, maxRows: 8 }"
              v-model="formData.config.privateKey"
              placeholder="请输入应用私钥"
              clearable
              :style="{ width: '100%' }"
            />
          </el-form-item>
          <el-form-item label-width="180px" label="商户公钥应用证书" prop="config.appCertContent">
            <el-input
              v-model="formData.config.appCertContent"
              type="textarea"
              placeholder="请上传商户公钥应用证书"
              readonly
              :autosize="{ minRows: 8, maxRows: 8 }"
              :style="{ width: '100%' }"
            />
          </el-form-item>
          <el-form-item label-width="180px" label="">
            <el-upload
              action=""
              ref="privateKeyContentFile"
              :limit="1"
              :accept="fileAccept"
              :http-request="appCertUpload"
              :before-upload="fileBeforeUpload"
            >
              <el-button type="primary">
                <Icon icon="ep:upload" class="mr-5px" /> 点击上传
              </el-button>
            </el-upload>
          </el-form-item>
          <el-form-item
            label-width="180px"
            label="支付宝公钥证书"
            prop="config.alipayPublicCertContent"
          >
            <el-input
              v-model="formData.config.alipayPublicCertContent"
              type="textarea"
              placeholder="请上传支付宝公钥证书"
              readonly
              :autosize="{ minRows: 8, maxRows: 8 }"
              :style="{ width: '100%' }"
            />
          </el-form-item>
          <el-form-item label-width="180px" label="">
            <el-upload
              ref="privateCertContentFile"
              action=""
              :limit="1"
              :accept="fileAccept"
              :before-upload="fileBeforeUpload"
              :http-request="alipayPublicCertUpload"
            >
              <el-button type="primary">
                <Icon icon="ep:upload" class="mr-5px" /> 点击上传
              </el-button>
            </el-upload>
          </el-form-item>
          <el-form-item label-width="180px" label="根证书" prop="config.rootCertContent">
            <el-input
              v-model="formData.config.rootCertContent"
              type="textarea"
              placeholder="请上传根证书"
              readonly
              :autosize="{ minRows: 8, maxRows: 8 }"
              :style="{ width: '100%' }"
            />
          </el-form-item>
          <el-form-item label-width="180px" label="">
            <el-upload
              ref="privateCertContentFile"
              :limit="1"
              :accept="fileAccept"
              action=""
              :before-upload="fileBeforeUpload"
              :http-request="rootCertUpload"
            >
              <el-button type="primary">
                <Icon icon="ep:upload" class="mr-5px" /> 点击上传
              </el-button>
            </el-upload>
          </el-form-item>
        </div>
        <el-form-item label-width="180px" label="备注" prop="remark">
          <el-input v-model="formData.remark" :style="{ width: '100%' }" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>
<script lang="ts" setup>
import { CommonStatusEnum } from '@/utils/constants'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import * as ChannelApi from '@/api/pay/channel'

defineOptions({ name: 'AlipayChannelForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref<any>({
  appId: '',
  code: '',
  status: undefined,
  feeRate: undefined,
  remark: '',
  config: {
    appId: '',
    serverUrl: null,
    signType: '',
    mode: null,
    privateKey: '',
    alipayPublicKey: '',
    appCertContent: '',
    alipayPublicCertContent: '',
    rootCertContent: ''
  }
})
const formRules = {
  feeRate: [{ required: true, message: '请输入渠道费率', trigger: 'blur' }],
  status: [{ required: true, message: '渠道状态不能为空', trigger: 'blur' }],
  'config.appId': [{ required: true, message: '请输入开放平台上创建的应用的 ID', trigger: 'blur' }],
  'config.serverUrl': [{ required: true, message: '请传入网关地址', trigger: 'blur' }],
  'config.signType': [{ required: true, message: '请传入签名算法类型', trigger: 'blur' }],
  'config.mode': [{ required: true, message: '公钥类型不能为空', trigger: 'blur' }],
  'config.privateKey': [{ required: true, message: '请输入商户私钥', trigger: 'blur' }],
  'config.alipayPublicKey': [
    { required: true, message: '请输入支付宝公钥字符串', trigger: 'blur' }
  ],
  'config.appCertContent': [{ required: true, message: '请上传商户公钥应用证书', trigger: 'blur' }],
  'config.alipayPublicCertContent': [
    { required: true, message: '请上传支付宝公钥证书', trigger: 'blur' }
  ],
  'config.rootCertContent': [{ required: true, message: '请上传指定根证书', trigger: 'blur' }]
}
const fileAccept = '.crt'
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (appId, code) => {
  dialogVisible.value = true
  formLoading.value = true
  resetForm(appId, code)
  // 加载数据
  try {
    const data = await ChannelApi.getChannel(appId, code)
    if (data && data.id) {
      formData.value = data
      formData.value.config = JSON.parse(data.config)
    }
    dialogTitle.value = !formData.value.id ? '创建支付渠道' : '编辑支付渠道'
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = { ...formData.value } as unknown as ChannelApi.ChannelVO
    data.config = JSON.stringify(formData.value.config)
    if (!data.id) {
      await ChannelApi.createChannel(data)
      message.success(t('common.createSuccess'))
    } else {
      await ChannelApi.updateChannel(data)
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
const resetForm = (appId, code) => {
  formData.value = {
    appId: appId,
    code: code,
    status: CommonStatusEnum.ENABLE,
    remark: '',
    feeRate: null,
    config: {
      appId: '',
      serverUrl: null,
      signType: 'RSA2',
      mode: null,
      privateKey: '',
      alipayPublicKey: '',
      appCertContent: '',
      alipayPublicCertContent: '',
      rootCertContent: ''
    }
  }
  formRef.value?.resetFields()
}

const fileBeforeUpload = (file) => {
  let format = '.' + file.name.split('.')[1]
  if (format !== fileAccept) {
    message.error(`请上传指定格式"${fileAccept}"文件`)
    return false
  }
  let isRightSize = file.size / 1024 / 1024 < 2
  if (!isRightSize) {
    message.error('文件大小超过 2MB')
  }
  return isRightSize
}

const appCertUpload = (event) => {
  const readFile = new FileReader()
  readFile.onload = (e: any) => {
    formData.value.config.appCertContent = e.target.result
  }
  readFile.readAsText(event.file)
}

const alipayPublicCertUpload = (event) => {
  const readFile = new FileReader()
  readFile.onload = (e: any) => {
    formData.value.config.alipayPublicCertContent = e.target.result
  }
  readFile.readAsText(event.file)
}

const rootCertUpload = (event) => {
  const readFile = new FileReader()
  readFile.onload = (e: any) => {
    formData.value.config.rootCertContent = e.target.result
  }
  readFile.readAsText(event.file)
}
</script>
