<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" :width="800">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="140px"
    >
      <el-form-item label="邮箱账号" prop="accountId">
        <el-select v-model="formData.accountId" placeholder="请选择邮箱账号">
          <el-option
            v-for="account in accountList"
            :key="account.id"
            :label="account.mail"
            :value="account.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="模板编码" prop="code">
        <el-input v-model="formData.code" placeholder="请输入模板编码" />
      </el-form-item>
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入模板名称" />
      </el-form-item>
      <el-form-item label="发送人名称" prop="nickname">
        <el-input v-model="formData.nickname" placeholder="请输入发送人名称" />
      </el-form-item>
      <el-form-item label="模板标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入模板标题" />
      </el-form-item>
      <el-form-item label="模板内容" prop="content">
        <Editor v-model="formData.content" height="200px" />
      </el-form-item>
      <el-form-item label="开启状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as MailTemplateApi from '@/api/system/mail/template'
import * as MailAccountApi from '@/api/system/mail/account'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'SystemMailTemplateForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: '',
  code: '',
  accountId: undefined,
  nickname: '',
  title: '',
  content: '',
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive({
  accountId: [{ required: true, message: '邮箱账号不能为空', trigger: 'change' }],
  code: [{ required: true, message: '模板编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }],
  title: [{ required: true, message: '模板标题不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '模板内容不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '开启状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const accountList = ref<MailAccountApi.MailAccountVO[]>([]) // 邮箱账号列表

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MailTemplateApi.getMailTemplate(id)
    } finally {
      formLoading.value = false
    }
  }
  // 加载邮箱账号列表
  accountList.value = await MailAccountApi.getSimpleMailAccountList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    const data = formData.value as unknown as MailTemplateApi.MailTemplateVO
    if (formType.value === 'create') {
      await MailTemplateApi.createMailTemplate(data)
      message.success(t('common.createSuccess'))
    } else {
      await MailTemplateApi.updateMailTemplate(data)
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
    name: '',
    code: '',
    accountId: undefined,
    nickname: '',
    title: '',
    content: '',
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>
