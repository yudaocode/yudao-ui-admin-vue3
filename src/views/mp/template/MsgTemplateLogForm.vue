<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        v-loading="formLoading"
    >
      <el-form-item label="appId" prop="appId">
        <el-input v-model="formData.appId" placeholder="请输入appId"/>
      </el-form-item>
      <el-form-item label="用户openid" prop="toUser">
        <el-input v-model="formData.toUser" placeholder="请输入用户openid"/>
      </el-form-item>
      <el-form-item label="公众号模板ID" prop="templateId">
        <el-input v-model="formData.templateId" placeholder="请输入公众号模板ID"/>
      </el-form-item>
      <el-form-item label="消息内容" prop="data">
        <el-input v-model="formData.data" placeholder="请输入消息内容"/>
      </el-form-item>
      <el-form-item label="链接" prop="url">
        <el-input v-model="formData.url" placeholder="请输入链接"/>
      </el-form-item>
      <el-form-item label="小程序appid" prop="miniProgramAppId">
        <el-input v-model="formData.miniProgramAppId" placeholder="请输入小程序appid"/>
      </el-form-item>
      <el-form-item label="小程序页面路径" prop="miniProgramPagePath">
        <el-input v-model="formData.miniProgramPagePath" placeholder="请输入小程序页面路径"/>
      </el-form-item>
      <el-form-item label="发送时间" prop="sendTime">
        <el-date-picker
            v-model="formData.sendTime"
            type="date"
            value-format="x"
            placeholder="选择发送时间"
        />
      </el-form-item>
      <el-form-item label="发送状态 0成功，1失败" prop="sendStatus">
        <el-radio-group v-model="formData.sendStatus">
          <el-radio value="1">请选择字典生成</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="发送结果" prop="sendResult">
        <el-input v-model="formData.sendResult" placeholder="请输入发送结果"/>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import {MsgTemplateLogApi, MsgTemplateLogVO} from '@/api/mp/template'

/** 微信模版消息发送记录 表单 */
defineOptions({name: 'MsgTemplateLogForm'})

const {t} = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  appId: undefined,
  toUser: undefined,
  templateId: undefined,
  data: undefined,
  url: undefined,
  miniProgramAppId: undefined,
  miniProgramPagePath: undefined,
  sendTime: undefined,
  sendStatus: undefined,
  sendResult: undefined,
})
const formRules = reactive({
  appId: [{required: true, message: 'appId不能为空', trigger: 'blur'}],
})
const formRef = ref() // 表单 Ref

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
      formData.value = await MsgTemplateLogApi.getMsgTemplateLog(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({open}) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as MsgTemplateLogVO
    if (formType.value === 'create') {
      await MsgTemplateLogApi.createMsgTemplateLog(data)
      message.success(t('common.createSuccess'))
    } else {
      await MsgTemplateLogApi.updateMsgTemplateLog(data)
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
    id: undefined,
    appId: undefined,
    toUser: undefined,
    templateId: undefined,
    data: undefined,
    url: undefined,
    miniProgramAppId: undefined,
    miniProgramPagePath: undefined,
    sendTime: undefined,
    sendStatus: undefined,
    sendResult: undefined,
  }
  formRef.value?.resetFields()
}
</script>