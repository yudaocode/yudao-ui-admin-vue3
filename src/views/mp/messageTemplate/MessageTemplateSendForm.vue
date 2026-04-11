<template>
  <Dialog title="发送消息模板" v-model="dialogVisible" width="600px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item label="模板编号">
        <el-input v-model="formData.id" disabled />
      </el-form-item>
      <el-form-item label="模板标题">
        <el-input v-model="templateTitle" disabled />
      </el-form-item>
      <el-form-item label="用户" prop="userId">
        <el-select
          v-model="formData.userId"
          filterable
          remote
          reserve-keyword
          placeholder="请输入用户昵称搜索"
          :remote-method="searchUser"
          :loading="userLoading"
          class="!w-full"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.nickname || user.openid"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="模板数据" prop="data">
        <el-input
          v-model="formData.data"
          type="textarea"
          :rows="4"
          placeholder='请输入模板数据（JSON 格式），例如：{"keyword1": {"value": "测试内容"}}'
        />
      </el-form-item>
      <el-form-item label="跳转链接" prop="url">
        <el-input v-model="formData.url" placeholder="请输入跳转链接" />
      </el-form-item>
      <el-form-item label="小程序 appId" prop="miniProgramAppId">
        <el-input v-model="formData.miniProgramAppId" placeholder="请输入小程序 appId" />
      </el-form-item>
      <el-form-item label="小程序页面路径" prop="miniProgramPagePath">
        <el-input v-model="formData.miniProgramPagePath" placeholder="请输入小程序页面路径" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submitForm" :loading="loading">发 送</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { MessageTemplateApi, MsgTemplateVO, MsgTemplateSendVO } from '@/api/mp/messageTemplate'
import * as MpUserApi from '@/api/mp/user'

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 提交加载中
const templateTitle = ref('') // 模板标题
const accountId = ref<number>() // 公众号账号编号

const formRef = ref() // 表单 Ref
const formData = ref<MsgTemplateSendVO>({
  id: undefined!,
  userId: undefined!,
  data: '',
  url: '',
  miniProgramAppId: '',
  miniProgramPagePath: ''
})
const formRules = reactive({
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }]
})

// 用户搜索相关
const userLoading = ref(false)
const userList = ref<any[]>([])

/** 搜索用户 */
const searchUser = async (query: string) => {
  if (!accountId.value) {
    return
  }
  userLoading.value = true
  try {
    const data = await MpUserApi.getUserPage({
      pageNo: 1,
      pageSize: 20,
      accountId: accountId.value,
      nickname: query || undefined
    })
    userList.value = data.list || []
  } finally {
    userLoading.value = false
  }
}

/** 打开弹窗 */
const open = async (row: MsgTemplateVO) => {
  resetForm()
  dialogVisible.value = true
  // 设置表单数据
  formData.value.id = row.id
  accountId.value = row.accountId
  templateTitle.value = row.title
  // 加载用户列表
  await searchUser('')
}
defineExpose({ open }) // 暴露 open 方法

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  loading.value = true
  try {
    const sendData: MsgTemplateSendVO = {
      ...formData.value
    }
    // 如果填写了小程序信息，需要拼接成 miniprogram 字段
    if (sendData.miniProgramAppId && sendData.miniProgramPagePath) {
      sendData.miniprogram = JSON.stringify({
        appid: sendData.miniProgramAppId,
        pagepath: sendData.miniProgramPagePath
      })
    }
    // 如果填写了 data 字段
    if (sendData.data) {
      try {
        sendData.data = JSON.parse(sendData.data)
      } catch (e) {
        message.error('模板数据格式不正确，请输入有效的 JSON 格式')
        return
      }
    }
    await MessageTemplateApi.sendMessageTemplate(sendData)
    message.success('发送成功')
    dialogVisible.value = false
  } finally {
    loading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined!,
    userId: undefined!,
    data: '',
    url: '',
    miniProgramAppId: '',
    miniProgramPagePath: ''
  }
  userList.value = []
  formRef.value?.resetFields()
}
</script>
