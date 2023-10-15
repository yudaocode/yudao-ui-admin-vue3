<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="用户编号" prop="userId">
        <el-input v-model="formData.userId" placeholder="请输入用户编号" />
      </el-form-item>
      <el-form-item label="用户类型" prop="userType">
        <el-select v-model="formData.userType" placeholder="请选择用户类型">
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="余额，单位分" prop="balance">
        <el-input v-model="formData.balance" placeholder="请输入余额，单位分" />
      </el-form-item>
      <el-form-item label="累计支出，单位分" prop="totalExpense">
        <el-input v-model="formData.totalExpense" placeholder="请输入累计支出，单位分" />
      </el-form-item>
      <el-form-item label="累计充值，单位分" prop="totalRecharge">
        <el-input v-model="formData.totalRecharge" placeholder="请输入累计充值，单位分" />
      </el-form-item>
      <el-form-item label="冻结金额，单位分" prop="freezePrice">
        <el-input v-model="formData.freezePrice" placeholder="请输入冻结金额，单位分" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as WalletApi from '@/api/pay/wallet/balance'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  userId: undefined,
  userType: undefined,
  balance: undefined,
  totalExpense: undefined,
  totalRecharge: undefined,
  freezePrice: undefined
})
const formRules = reactive({
  userId: [{ required: true, message: '用户编号不能为空', trigger: 'blur' }],
  userType: [{ required: true, message: '用户类型不能为空', trigger: 'change' }],
  balance: [{ required: true, message: '余额，单位分不能为空', trigger: 'blur' }],
  totalExpense: [{ required: true, message: '累计支出，单位分不能为空', trigger: 'blur' }],
  totalRecharge: [{ required: true, message: '累计充值，单位分不能为空', trigger: 'blur' }],
  freezePrice: [{ required: true, message: '冻结金额，单位分不能为空', trigger: 'blur' }]
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
      formData.value = await WalletApi.getWallet(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    userId: undefined,
    userType: undefined,
    balance: undefined,
    totalExpense: undefined,
    totalRecharge: undefined,
    freezePrice: undefined
  }
  formRef.value?.resetFields()
}
</script>
