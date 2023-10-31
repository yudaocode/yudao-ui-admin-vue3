<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="回款编号" prop="no">
        <el-input v-model="formData.no" placeholder="请输入回款编号" />
      </el-form-item>
      <el-form-item label="回款计划" prop="planId">
        <el-input v-model="formData.planId" placeholder="请输入回款计划" />
      </el-form-item>
      <el-form-item label="客户名称" prop="customerId">
        <el-input v-model="formData.customerId" placeholder="请输入客户名称" />
      </el-form-item>
      <el-form-item label="合同名称" prop="contractId">
        <el-input v-model="formData.contractId" placeholder="请输入合同名称" />
      </el-form-item>
      <!--<el-form-item label="审批状态" prop="checkStatus">
        <el-select v-model="formData.checkStatus" placeholder="请选择审批状态">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.CRM_RECEIVABLE_CHECK_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>-->
      <!--<el-form-item label="工作流编号" prop="processInstanceId">
        <el-input v-model="formData.processInstanceId" placeholder="请输入工作流编号" />
      </el-form-item>-->
      <el-form-item label="回款日期" prop="returnTime">
        <el-date-picker
          v-model="formData.returnTime"
          type="date"
          value-format="x"
          placeholder="选择回款日期"
        />
      </el-form-item>
      <el-form-item label="回款方式" prop="returnType">
        <el-select v-model="formData.returnType" placeholder="请选择回款方式">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.CRM_RETURN_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="回款金额" prop="price">
        <el-input-number v-model="formData.price" placeholder="请输入回款金额" />
      </el-form-item>
      <el-form-item label="负责人" prop="ownerUserId">
        <el-select v-model="formData.ownerUserId" clearable placeholder="请输入负责人">
          <el-option
            v-for="item in userList"
            :key="item.id"
            :label="item.nickname"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="批次" prop="batchId">
        <el-input-number v-model="formData.batchId" placeholder="请输入批次" />
      </el-form-item>
      <el-form-item label="显示排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" controls-position="right" />
      </el-form-item>
      <!--<el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择状态">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>-->
      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" :rows="3" v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import * as ReceivableApi from '@/api/crm/receivable'
import * as UserApi from '@/api/system/user'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const userList = ref<UserApi.UserVO[]>([]) // 用户列表
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  no: undefined,
  planId: undefined,
  customerId: undefined,
  contractId: undefined,
  checkStatus: undefined,
  processInstanceId: undefined,
  returnTime: undefined,
  returnType: undefined,
  price: undefined,
  ownerUserId: undefined,
  batchId: undefined,
  sort: undefined,
  dataScope: undefined,
  dataScopeDeptIds: undefined,
  status: undefined,
  remark: undefined
})
// const formRules = reactive({
//   status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
// })
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
      formData.value = await ReceivableApi.getReceivable(id)
    } finally {
      formLoading.value = false
    }
  }
  // 获得用户列表
  userList.value = await UserApi.getSimpleUserList()
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
    const data = formData.value as unknown as ReceivableApi.ReceivableVO
    if (formType.value === 'create') {
      await ReceivableApi.createReceivable(data)
      message.success(t('common.createSuccess'))
    } else {
      await ReceivableApi.updateReceivable(data)
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
    no: undefined,
    planId: undefined,
    customerId: undefined,
    contractId: undefined,
    checkStatus: undefined,
    processInstanceId: undefined,
    returnTime: undefined,
    returnType: undefined,
    price: undefined,
    ownerUserId: undefined,
    batchId: undefined,
    sort: undefined,
    dataScope: undefined,
    dataScopeDeptIds: undefined,
    status: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
