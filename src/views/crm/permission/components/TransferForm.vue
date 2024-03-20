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
        <el-radio-group
          v-model="oldOwnerHandler"
          @change="formData.oldOwnerPermissionLevel = undefined"
        >
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
    </el-form>
    <!-- TODO @puhui999 转移客户时，需要额外有【联系人】【商机】【合同】的 checkbox 选择 -->
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as UserApi from '@/api/system/user'
import type { TransferReqVO,TransferListReqVO } from '@/api/crm/customer'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { PermissionLevelEnum } from '@/api/crm/permission'

defineOptions({ name: 'CrmTransferForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const isTransferList = ref(false) //是否是多个线索或是客户id一起转移
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const oldOwnerHandler = ref(false) // 老负责人的处理方式
const formData = ref<TransferReqVO>({
  id: undefined, // 客户编号
  newOwnerUserId: undefined, // 新负责人的用户编号
  oldOwnerPermissionLevel: undefined // 老负责人加入团队后的权限级别
})

const formDataList = ref<TransferListReqVO>({
  ids:undefined,// 线索或客户编号
  newOwnerUserId: undefined, // 新负责人的用户编号
  oldOwnerPermissionLevel: undefined // 老负责人加入团队后的权限级别
})

const formRules = reactive({
  newOwnerUserId: [{ required: true, message: '新负责人不能为空', trigger: 'blur' }],
  oldOwnerPermissionLevel: [
    { required: true, message: '老负责人加入团队后的权限级别不能为空', trigger: 'blur' }
  ]
})
const formRef = ref() // 表单 Ref
const transferFuncRef = ref<Function>(() => {}) // 转移所需回调

/** 打开弹窗 */
const open = async (title: string, bizId: number, transferFunc: Function) => {
  isTransferList.value = false
  dialogVisible.value = true
  dialogTitle.value = title
  transferFuncRef.value = transferFunc
  resetForm()
  formData.value.id = bizId
}
/** 打开弹窗,批量转移 */
const openBizIds = async (title: string, bizIds: Array<number>, transferFunc: Function) => {
  isTransferList.value = true
  dialogVisible.value = true
  dialogTitle.value = title
  transferFuncRef.value = transferFunc
  resetForm()
  formDataList.value.ids = bizIds
}

defineExpose({ open,openBizIds }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true

  //是否批量转移
  if(isTransferList.value) {
    // 提交请求
    try {
        formDataList.value.newOwnerUserId = formData.value.newOwnerUserId
        formDataList.value.oldOwnerPermissionLevel = formData.value.oldOwnerPermissionLevel

        const data = formDataList.value
        await transferFuncRef.value(unref(data))
        message.success(dialogTitle.value + '成功')
        dialogVisible.value = false
        // 发送操作成功的事件
        emit('success')
      } finally {
        formLoading.value = false
      }
  } 
  else 
  {
      // 提交请求
      try {
        const data = formData.value
        await transferFuncRef.value(unref(data))
        message.success(dialogTitle.value + '成功')
        dialogVisible.value = false
        // 发送操作成功的事件
        emit('success')
      } finally {
        formLoading.value = false
      }
  }

}

/** 重置表单 */
const resetForm = () => {
  formRef.value?.resetFields()
  formData.value = {
    id: undefined, // 客户编号
    newOwnerUserId: undefined, // 新负责人的用户编号
    oldOwnerPermissionLevel: undefined // 老负责人加入团队后的权限级别
  }
}
onMounted(async () => {
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
})
</script>
