<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="800px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="转账类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PAY_TRANSFER_TYPE)"
            :key="dict.value"
            :label="dict.value"
            :disabled="dict.value === 2 || dict.value === 3 || dict.value === 4"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="转账金额(元)" prop="price">
        <el-input-number
          v-model="formData.price"
          :min="0"
          :precision="2"
          :step="0.01"
          placeholder="请输入转账金额"
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="收款人姓名" prop="userName">
        <el-input v-model="formData.userName" placeholder="请输入收款人姓名" />
      </el-form-item>
      <el-form-item v-show="formData.type === 1" label="支付宝登录账号" prop="alipayLogonId">
        <el-input v-model="formData.alipayLogonId" placeholder="请输入支付宝登录账号" />
      </el-form-item>
      <el-form-item v-show="formData.type === 2" label="微信 openid" prop="openid">
        <el-input v-model="formData.openid" placeholder="请输入微信 openid" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as DemoTransferApi from '@/api/pay/demo/transfer'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { yuanToFen } from '@/utils'
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  price: undefined,
  type: undefined,
  userName: undefined,
  alipayLogonId: undefined,
  openid: undefined
})
const formRules = reactive({
  price: [{ required: true, message: '转账金额不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '转账类型不能为空', trigger: 'change' }]
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
      await DemoTransferApi.createDemoTransfer(data)
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
    id: undefined,
    price: undefined,
    userName: undefined,
    alipayLogonId: undefined,
    openid: undefined
  }
  formRef.value?.resetFields()
}
</script>
