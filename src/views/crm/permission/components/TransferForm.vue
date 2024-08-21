<!-- 转移数据的表单弹窗，目前主要用于 CRM 客户、商机等详情界面 -->
<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="30%">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="150px"
    >
      <el-form-item label="选择新负责人" prop="newOwnerUserId">
        <el-select v-model="formData.newOwnerUserId">
          <el-option
            v-for="item in userOptions"
            :key="item.id"
            :label="item.nickname"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="老负责人">
        <el-radio-group v-model="oldOwnerHandler" @change="handleOwnerChange">
          <el-radio :label="false" size="large">移除</el-radio>
          <el-radio :label="true" size="large">加入团队</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="oldOwnerHandler" label="老负责人权限级别" prop="oldOwnerPermissionLevel">
        <el-radio-group v-model="formData.oldOwnerPermissionLevel">
          <template
            v-for="dict in getIntDictOptions(DICT_TYPE.CRM_PERMISSION_LEVEL)"
            :key="dict.value"
          >
            <el-radio v-if="dict.value != PermissionLevelEnum.OWNER" :label="dict.value">
              {{ dict.label }}
            </el-radio>
          </template>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="bizType === BizTypeEnum.CRM_CUSTOMER" label="同时转移">
        <el-checkbox-group v-model="formData.toBizTypes">
          <el-checkbox :label="BizTypeEnum.CRM_CONTACT">联系人</el-checkbox>
          <el-checkbox :label="BizTypeEnum.CRM_BUSINESS">商机</el-checkbox>
          <el-checkbox :label="BizTypeEnum.CRM_CONTRACT">合同</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as UserApi from '@/api/system/user'
import * as BusinessApi from '@/api/crm/business'
import * as ClueApi from '@/api/crm/clue'
import * as ContactApi from '@/api/crm/contact'
import * as CustomerApi from '@/api/crm/customer'
import * as ContractApi from '@/api/crm/contract'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { BizTypeEnum, PermissionLevelEnum, TransferReqVO } from '@/api/crm/permission'

defineOptions({ name: 'CrmTransferForm' })

const props = defineProps<{
  bizType: number
}>()

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const oldOwnerHandler = ref(false) // 老负责人的处理方式
const formData = ref<TransferReqVO>({} as TransferReqVO)
const formRules = reactive({
  newOwnerUserId: [{ required: true, message: '新负责人不能为空', trigger: 'blur' }],
  oldOwnerPermissionLevel: [
    { required: true, message: '老负责人加入团队后的权限级别不能为空', trigger: 'blur' }
  ]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (bizId: number) => {
  dialogVisible.value = true
  dialogTitle.value = getDialogTitle()
  resetForm()
  formData.value.id = bizId
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
// 老负责人负责方式
const handleOwnerChange = (val: boolean) => {
  if (!val) {
    // 移除的话提交不带 oldOwnerPermissionLevel 参数
    formData.value.oldOwnerPermissionLevel = undefined
  }
}
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
    const data = formData.value
    await transfer(unref(data))
    message.success(dialogTitle.value + '成功')
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}
const transfer = async (data: TransferReqVO) => {
  switch (props.bizType) {
    case BizTypeEnum.CRM_CLUE:
      return await ClueApi.transferClue(data)
    case BizTypeEnum.CRM_CUSTOMER:
      return await CustomerApi.transferCustomer(data)
    case BizTypeEnum.CRM_CONTACT:
      return await ContactApi.transferContact(data)
    case BizTypeEnum.CRM_BUSINESS:
      return await BusinessApi.transferBusiness(data)
    case BizTypeEnum.CRM_CONTRACT:
      return await ContractApi.transferContract(data)
    default:
      message.error('【转移失败】没有转移接口')
      throw new Error('【转移失败】没有转移接口')
  }
}
const getDialogTitle = () => {
  switch (props.bizType) {
    case BizTypeEnum.CRM_CLUE:
      return '线索转移'
    case BizTypeEnum.CRM_CUSTOMER:
      return '客户转移'
    case BizTypeEnum.CRM_CONTACT:
      return '联系人转移'
    case BizTypeEnum.CRM_BUSINESS:
      return '商机转移'
    case BizTypeEnum.CRM_CONTRACT:
      return '合同转移'
    default:
      return '转移'
  }
}

/** 重置表单 */
const resetForm = () => {
  formRef.value?.resetFields()
  formData.value = {} as TransferReqVO
}
onMounted(async () => {
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
})
</script>
