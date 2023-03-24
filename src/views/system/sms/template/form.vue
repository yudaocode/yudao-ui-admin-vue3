<template>
  <Dialog :title="modelTitle" v-model="modelVisible">
    <!-- 修改/新增 -->
    <el-form
      v-if="['template.addTitle', 'template.updtaeTitle'].includes(formType)"
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
    >
      <el-form-item label="短信渠道编号" prop="channelId">
        <el-select v-model="formData.channelId" placeholder="请选择短信渠道编号">
          <el-option
            v-for="channel in channelOptions"
            :key="channel.id"
            :value="channel.id"
            :label="
              channel.signature + optionLabel(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, channel.code)
            "
          />
        </el-select>
      </el-form-item>
      <el-form-item label="短信类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择短信类型">
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="parseInt(dict.value)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="模板编号" prop="code">
        <el-input v-model="formData.code" placeholder="请输入模板编号" />
      </el-form-item>
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入模板名称" />
      </el-form-item>
      <el-form-item label="模板内容" prop="content">
        <el-input type="textarea" v-model="formData.content" placeholder="请输入模板内容" />
      </el-form-item>
      <el-form-item label="开启状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="parseInt(dict.value)"
            >{{ dict.label }}</el-radio
          >
        </el-radio-group>
      </el-form-item>
      <el-form-item label="短信 API 模板编号" prop="apiTemplateId">
        <el-input v-model="formData.apiTemplateId" placeholder="请输入短信 API 的模板编号" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <!-- 短信测试 -->
    <el-form
      v-if="formType === 'template.sendSms'"
      ref="sendSmsFormRef"
      :model="sendSmsForm"
      :rules="sendSmsRules"
    >
      <el-form-item label="模板内容" prop="content">
        <el-input
          v-model="sendSmsForm.content"
          type="textarea"
          placeholder="请输入模板内容"
          readonly
        />
      </el-form-item>
      <el-form-item label="手机号" prop="mobile">
        <el-input v-model="sendSmsForm.mobile" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item
        v-for="param in sendSmsForm.params"
        :key="param"
        :label="'参数 {' + param + '}'"
        :prop="'templateParams.' + param"
      >
        <el-input
          v-model="sendSmsForm.templateParams[param]"
          :placeholder="'请输入 ' + param + ' 参数'"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="modelVisible = false">取 消</el-button>
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts" name="SmsTemplateFrom">
import { DICT_TYPE, getDictOptions, getDictLabel } from '@/utils/dict'
import * as templateApi from '@/api/system/sms/smsTemplate'
import * as SmsChannelApi from '@/api/system/sms/smsChannel'
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

defineProps({
  channelOptions: {
    type: Array as PropType<SmsChannelApi.SmsChannelListVO[]>,
    define: () => {}
  }
})

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型
const formData = ref<templateApi.SmsTemplateVO>({
  id: null,
  type: null,
  status: null,
  code: '',
  name: '',
  content: '',
  remark: '',
  apiTemplateId: '',
  channelId: null
})
const formRules = reactive({
  type: [{ required: true, message: '短信类型不能为空', trigger: 'change' }],
  status: [{ required: true, message: '开启状态不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '模板编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '模板内容不能为空', trigger: 'blur' }],
  apiTemplateId: [{ required: true, message: '短信 API 的模板编号不能为空', trigger: 'blur' }],
  channelId: [{ required: true, message: '短信渠道编号不能为空', trigger: 'change' }]
})

const formRef = ref() // 表单 Ref
const optionLabel = computed(
  () => (type: string, code: string) => `【${getDictLabel(type, code)}】`
)
// 发送短信表单相关
const sendSmsForm = ref({
  content: '',
  params: {},
  mobile: '',
  templateCode: '',
  templateParams: {}
})
const sendSmsRules = reactive({
  mobile: [{ required: true, message: '手机不能为空', trigger: 'blur' }],
  templateCode: [{ required: true, message: '模版编码不能为空', trigger: 'blur' }],
  templateParams: {}
})
const sendSmsFormRef = ref()
/** 打开弹窗 */
interface openModalOption {
  type: string
  // 编辑传id
  id?: ''
  // 短信测试传row
  row?: any
}
const openModal = async (option: openModalOption) => {
  modelVisible.value = true
  modelTitle.value = t('dialog.sms.' + option.type)
  formType.value = option.type
  resetForm()
  resetSendSms()
  // 短信测试
  if (option.row) {
    sendSmsForm.value.content = option.row.content
    sendSmsForm.value.params = option.row.params
    sendSmsForm.value.templateCode = option.row.code
    sendSmsForm.value.templateParams = option.row.params.reduce(function (obj, item) {
      obj[item] = undefined
      return obj
    }, {})
    sendSmsRules.templateParams = option.row.params.reduce(function (obj, item) {
      obj[item] = { required: true, message: '参数 ' + item + ' 不能为空', trigger: 'change' }
      return obj
    }, {})
  }

  // 修改时，设置数据
  if (option.id) {
    formLoading.value = true
    try {
      formData.value = await templateApi.getSmsTemplateApi(option.id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
/** 提交表单 */
const submitForm = async () => {
  formLoading.value = true
  // 提交请求
  if (['template.addTitle', 'template.updtaeTitle'].includes(formType.value)) {
    // 校验表单
    if (!formRef) return
    const valid = await formRef.value.validate()
    if (!valid) return
    try {
      const data = formData.value as templateApi.SmsTemplateVO
      if (formType.value === 'template.addTitle') {
        await templateApi.createSmsTemplateApi(data)
        message.success(t('common.createSuccess'))
      } else {
        await templateApi.updateSmsTemplateApi(data)
        message.success(t('common.updateSuccess'))
      }
      modelVisible.value = false
      // 发送操作成功的事件
      emit('success')
    } finally {
      formLoading.value = false
    }
  }
  if (formType.value === 'template.sendSms') {
    sendSmsTest()
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: null,
    type: null,
    status: null,
    code: '',
    name: '',
    content: '',
    remark: '',
    apiTemplateId: '',
    channelId: null
  }
  formRef.value?.resetFields()
}
/** 重置发送短信的表单 */
const resetSendSms = () => {
  // 根据 row 重置表单
  sendSmsForm.value = {
    content: '',
    params: {},
    mobile: '',
    templateCode: '',
    templateParams: {}
  }
  sendSmsFormRef.value?.resetFields()
}
/** 发送短信 */
const sendSmsTest = async () => {
  const data: templateApi.SendSmsReqVO = {
    mobile: sendSmsForm.value.mobile,
    templateCode: sendSmsForm.value.templateCode,
    templateParams: sendSmsForm.value.templateParams as unknown as Map<string, Object>
  }
  const res = await templateApi.sendSmsApi(data)
  if (res) {
    message.success('提交发送成功！发送结果，见发送日志编号：' + res)
  }
  formLoading.value = false
  modelVisible.value = false
}
</script>
