<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="800px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="提现标题" prop="subject">
        <el-input v-model="formData.subject" placeholder="请输入提现标题" />
      </el-form-item>
      <el-form-item label="提现类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio :value="1">支付宝</el-radio>
          <el-radio :value="2">微信余额</el-radio>
          <el-radio :value="3">钱包</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="提现金额" prop="price">
        <el-input-number
          v-model="formData.price"
          :min="0.01"
          :precision="2"
          :step="0.01"
          placeholder="请输入提现金额"
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="收款人账号" prop="userAccount">
        <el-input v-model="formData.userAccount" :placeholder="getAccountPlaceholder()" />
      </el-form-item>
      <el-form-item label="收款人姓名" prop="userName">
        <el-input v-model="formData.userName" placeholder="请输入收款人姓名" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as DemoWithdrawApi from '@/api/pay/demo/withdraw/index'
import { yuanToFen } from '@/utils'
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<DemoWithdrawApi.PayDemoWithdrawVO>({
  subject: '',
  price: 0,
  type: 1,
  userName: '',
  userAccount: ''
})
const formRules = reactive({
  subject: [{ required: true, message: '提现标题不能为空', trigger: 'blur' }],
  price: [{ required: true, message: '提现金额不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '提现类型不能为空', trigger: 'change' }],
  userAccount: [{ required: true, message: '收款人账号不能为空', trigger: 'blur' }],
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
}
/** 关闭弹窗 */
const close = async () => {
  dialogVisible.value = false
  resetForm()
}
defineExpose({ open, close }) // 提供 open， close 方法，用于打开, 关闭弹窗

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
    const data = { ...formData.value }
    data.price = yuanToFen(data.price)
    if (formType.value === 'create') {
      await DemoWithdrawApi.createDemoWithdraw(data)
      message.success(t('common.createSuccess'))
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
    subject: '',
    price: 0,
    type: 1,
    userName: '',
    userAccount: ''
  }
  formRef.value?.resetFields()
}

/** 根据提现类型获取账号输入框的占位符文本 */
const getAccountPlaceholder = () => {
  if (formData.value.type === 1) {
    return '请输入支付宝账号'
  } else if (formData.value.type === 2) {
    return '请输入微信 openid'
  } else if (formData.value.type === 3) {
    return '请输入钱包编号'
  }
  return '请输入收款人账号'
}
</script>
