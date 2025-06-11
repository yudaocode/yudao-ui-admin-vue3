<template>
  <div>
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
      <el-form
        ref="formRef"
        v-loading="formLoading"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="渠道费率" label-width="180px" prop="feeRate">
          <el-input
            v-model="formData.feeRate"
            :style="{ width: '100%' }"
            clearable
            placeholder="请输入渠道费率"
          >
            <template #append>%</template>
          </el-input>
        </el-form-item>
        <el-form-item label="微信 APPID" label-width="180px" prop="config.appId">
          <el-input
            v-model="formData.config.appId"
            :style="{ width: '100%' }"
            clearable
            placeholder="请输入微信 APPID"
          />
        </el-form-item>
        <el-form-item label-width="180px">
          <a
            href="https://pay.weixin.qq.com/index.php/extend/merchant_appid/mapay_platform/account_manage"
            target="_blank"
          >
            前往微信商户平台查看 APPID
          </a>
        </el-form-item>
        <el-form-item label="商户号" label-width="180px" prop="config.mchId">
          <el-input v-model="formData.config.mchId" :style="{ width: '100%' }" />
        </el-form-item>

        <el-form-item label-width="180px">
          <a href="https://pay.weixin.qq.com/index.php/extend/pay_setting" target="_blank">
            前往微信商户平台查看商户号
          </a>
        </el-form-item>
        <el-form-item label="渠道状态" label-width="180px" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio
              v-for="dict in getDictOptions(DICT_TYPE.COMMON_STATUS)"
              :key="parseInt(dict.value)"
              :value="parseInt(dict.value)"
            >
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="API 版本" label-width="180px" prop="config.apiVersion">
          <el-radio-group v-model="formData.config.apiVersion">
            <el-radio value="v2">v2</el-radio>
            <el-radio value="v3">v3</el-radio>
          </el-radio-group>
        </el-form-item>
        <div v-if="formData.config.apiVersion === 'v2'">
          <el-form-item label="商户密钥" label-width="180px" prop="config.mchKey">
            <el-input v-model="formData.config.mchKey" clearable placeholder="请输入商户密钥" />
          </el-form-item>
          <el-form-item
            label="apiclient_cert.p12 证书"
            label-width="180px"
            prop="config.keyContent"
          >
            <el-input
              v-model="formData.config.keyContent"
              :autosize="{ minRows: 2, maxRows: 4 }"
              :style="{ width: '100%' }"
              placeholder="请上传 apiclient_cert.p12 证书"
              readonly
              type="textarea"
              :rows="2"
            />
          </el-form-item>
          <el-form-item label="" label-width="180px">
            <el-upload
              :before-upload="p12FileBeforeUpload"
              :http-request="keyContentUpload"
              :limit="1"
              accept=".p12"
              action=""
            >
              <el-button type="primary">
                <Icon class="mr-5px" icon="ep:upload" />
                点击上传
              </el-button>
            </el-upload>
          </el-form-item>
        </div>
        <div v-if="formData.config.apiVersion === 'v3'">
          <el-form-item label="API V3 密钥" label-width="180px" prop="config.apiV3Key">
            <el-input
              v-model="formData.config.apiV3Key"
              clearable
              placeholder="请输入 API V3 密钥"
            />
          </el-form-item>
          <el-form-item
            label="apiclient_key.pem 证书"
            label-width="180px"
            prop="config.privateKeyContent"
          >
            <el-input
              v-model="formData.config.privateKeyContent"
              :autosize="{ minRows: 2, maxRows: 4 }"
              :style="{ width: '100%' }"
              placeholder="请上传 apiclient_key.pem 证书"
              readonly
              type="textarea"
              :rows="2"
            />
          </el-form-item>
          <el-form-item label="" label-width="180px" prop="privateKeyContentFile">
            <el-upload
              ref="privateKeyContentFile"
              :before-upload="pemFileBeforeUpload"
              :http-request="privateKeyContentUpload"
              :limit="1"
              accept=".pem"
              action=""
            >
              <el-button type="primary">
                <Icon class="mr-5px" icon="ep:upload" />
                点击上传
              </el-button>
            </el-upload>
          </el-form-item>
          <el-form-item label="证书序列号" label-width="180px" prop="config.certSerialNo">
            <el-input
              v-model="formData.config.certSerialNo"
              clearable
              placeholder="请输入证书序列号"
            />
          </el-form-item>
          <el-form-item label-width="180px">
            <a
              href="https://pay.weixin.qq.com/index.php/core/cert/api_cert#/api-cert-manage"
              target="_blank"
            >
              前往微信商户平台查看证书序列号
            </a>
          </el-form-item>
          <el-form-item label="public_key.pem 证书" label-width="180px" prop="config.publicKeyContent">
            <el-input
              v-model="formData.config.publicKeyContent"
              :autosize="{ minRows: 2, maxRows: 4 }"
              :style="{ width: '100%' }"
              placeholder="请上传 public_key.pem 证书"
              readonly
              type="textarea"
              :rows="2"
            />
          </el-form-item>
          <el-form-item label="" label-width="180px" prop="publicKeyContentFile">
            <el-upload
              ref="publicKeyContentFile"
              :before-upload="pemFileBeforeUpload"
              :http-request="publicKeyContentUpload"
              :limit="1"
              accept=".pem"
              action=""
            >
              <el-button type="primary">
                <Icon class="mr-5px" icon="ep:upload" />
                点击上传
              </el-button>
            </el-upload>
          </el-form-item>
          <el-form-item label="公钥 ID" label-width="180px" prop="config.publicKeyId">
            <el-input
              v-model="formData.config.publicKeyId"
              clearable
              placeholder="请输入公钥 ID"
            />
          </el-form-item>
          <el-form-item label-width="180px">
            <a
              href="https://pay.weixin.qq.com/doc/v3/merchant/4012153196"
              target="_blank"
            >
              微信支付公钥产品简介及使用说明
            </a>
          </el-form-item>
        </div>
        <el-form-item label="备注" label-width="180px" prop="remark">
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

defineOptions({ name: 'WeixinChannelForm' })

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
    mchId: '',
    apiVersion: '',
    mchKey: '',
    keyContent: '',
    privateKeyContent: '',
    certSerialNo: '',
    apiV3Key: '',
    publicKeyContent: '',
    publicKeyId: ''
  }
})
const formRules = {
  feeRate: [{ required: true, message: '请输入渠道费率', trigger: 'blur' }],
  status: [{ required: true, message: '渠道状态不能为空', trigger: 'blur' }],
  'config.mchId': [{ required: true, message: '请传入商户号', trigger: 'blur' }],
  'config.appId': [{ required: true, message: '请输入公众号APPID', trigger: 'blur' }],
  'config.apiVersion': [{ required: true, message: 'API版本不能为空', trigger: 'blur' }],
  'config.mchKey': [{ required: true, message: '请输入商户密钥', trigger: 'blur' }],
  'config.keyContent': [
    { required: true, message: '请上传 apiclient_cert.p12 证书', trigger: 'blur' }
  ],
  'config.privateKeyContent': [
    { required: true, message: '请上传 apiclient_key.pem 证书', trigger: 'blur' }
  ],
  'config.certSerialNo': [{ required: true, message: '请输入证书序列号', trigger: 'blur' }],
  'config.publicKeyContent': [{ required: true, message: '请上传 public_key.pem 证书', trigger: 'blur' }],
  'config.publicKeyId': [{ required: true, message: '请输入公钥 ID', trigger: 'blur' }],
  'config.apiV3Key': [{ required: true, message: '请上传 api V3 密钥值', trigger: 'blur' }]
}
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
    feeRate: undefined,
    remark: '',
    config: {
      appId: '',
      mchId: '',
      apiVersion: '',
      mchKey: '',
      keyContent: '',
      privateKeyContent: '',
      certSerialNo: '',
      apiV3Key: '',
      publicKeyContent: '',
      publicKeyId: ''
    }
  }
  formRef.value?.resetFields()
}

/**
 * apiclient_cert.p12、apiclient_key.pem 上传前的校验
 */
const fileBeforeUpload = (file, fileAccept) => {
  let format = '.' + file.name.split('.')[1]
  if (format !== fileAccept) {
    message.error('请上传指定格式"' + fileAccept + '"文件')
    return false
  }
  let isRightSize = file.size / 1024 / 1024 < 2
  if (!isRightSize) {
    message.error('文件大小超过 2MB')
  }
  return isRightSize
}

const p12FileBeforeUpload = (file) => {
  fileBeforeUpload(file, '.p12')
}

const pemFileBeforeUpload = (file) => {
  fileBeforeUpload(file, '.pem')
}

/**
 * 读取 apiclient_key.pem 到 privateKeyContent 字段
 */
const privateKeyContentUpload = async (event) => {
  const readFile = new FileReader()
  readFile.onload = (e: any) => {
    formData.value.config.privateKeyContent = e.target.result
  }
  readFile.readAsText(event.file)
}

/**
 * 读取 apiclient_cert.p12 到 keyContent 字段
 */
const keyContentUpload = async (event) => {
  const readFile = new FileReader()
  readFile.onload = (e: any) => {
    formData.value.config.keyContent = e.target.result.split(',')[1]
  }
  readFile.readAsDataURL(event.file) // 读成 base64
}

/**
 * 读取 public_key.pem 到 publicKeyContent 字段
 */
const publicKeyContentUpload = async (event) => {
  const readFile = new FileReader()
  readFile.onload = (e: any) => {
    formData.value.config.publicKeyContent = e.target.result
  }
  readFile.readAsText(event.file)
}
</script>
