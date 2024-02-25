<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="回款编号" prop="no">
            <el-input v-model="formData.no" placeholder="请输入回款编号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户名称" prop="customerId">
            <el-select v-model="formData.customerId" class="w-1/1" placeholder="请选择客户">
              <el-option
                v-for="item in customerList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合同名称" prop="contractId">
            <el-select
              v-model="formData.contractId"
              :disabled="!formData.customerId"
              class="!w-100%"
              placeholder="请选择合同"
            >
              <el-option
                v-for="data in contractList"
                :key="data.id"
                :label="data.name"
                :value="data.id!"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="回款期数" prop="planId">
            <el-select
              v-model="formData.planId"
              :disabled="!formData.contractId"
              class="!w-100%"
              placeholder="请选择回款期数"
            >
              <el-option
                v-for="data in receivablePlanList"
                :key="data.id"
                :label="data.period + '期'"
                :value="data.id!"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
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
        </el-col>
        <el-col :span="12">
          <el-form-item label="回款方式" prop="returnType">
            <el-select v-model="formData.returnType" placeholder="请选择回款方式">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="回款金额" prop="price">
            <el-input-number
              v-model="formData.price"
              class="!w-100%"
              controls-position="right"
              placeholder="请输入回款金额"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="回款日期" prop="returnTime">
            <el-date-picker
              v-model="formData.returnTime"
              placeholder="选择回款日期"
              type="date"
              value-format="x"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              :rows="3"
              placeholder="请输入备注"
              type="textarea"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as ReceivablePlanApi from '@/api/crm/receivable/plan'
import * as ReceivableApi from '@/api/crm/receivable'
import * as UserApi from '@/api/system/user'
import * as CustomerApi from '@/api/crm/customer'
import * as ContractApi from '@/api/crm/contract'
import { useUserStore } from '@/store/modules/user'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const userList = ref<UserApi.UserVO[]>([]) // 用户列表
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<ReceivableApi.ReceivableVO>({} as ReceivableApi.ReceivableVO)
const formRules = reactive({
  no: [{ required: true, message: '回款编号不能为空', trigger: 'blur' }],
  customerId: [{ required: true, message: '客户不能为空', trigger: 'blur' }],
  contractId: [{ required: true, message: '合同不能为空', trigger: 'blur' }],
  auditStatus: [{ required: true, message: '审批状态不能为空', trigger: 'blur' }],
  returnTime: [{ required: true, message: '回款日期不能为空', trigger: 'blur' }],
  price: [{ required: true, message: '回款金额不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const customerList = ref<CustomerApi.CustomerVO[]>([]) // 客户列表
const contractList = ref<ContractApi.ContractVO[]>([]) // 合同列表
const receivablePlanList = ref<ReceivablePlanApi.ReceivablePlanVO[]>([]) // 回款计划列表
/** 打开弹窗 */
const open = async (type: string, id?: number, planData?: ReceivablePlanApi.ReceivablePlanVO) => {
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
  // 获得客户列表
  customerList.value = await CustomerApi.getCustomerSimpleList()
  // 默认新建时选中自己
  if (formType.value === 'create') {
    formData.value.ownerUserId = useUserStore().getUser.id
  }
  // 从回款计划创建回款
  if (planData) {
    formData.value.customerId = planData.customerId
    formData.value.contractId = planData.contractId
    formData.value.planId = planData.id
  }
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
  formData.value = {} as ReceivableApi.ReceivableVO
  formRef.value?.resetFields()
}

const getContractList = async (customerId: number) => {
  contractList.value = await ContractApi.getContractSimpleList(customerId)
}
const getReceivablePlanList = async (contractId: number) => {
  receivablePlanList.value = await ReceivablePlanApi.getReceivablePlanListByContractId(
    formData.value.customerId,
    contractId
  )
}
watch(
  () => formData.value.customerId,
  (newVal) => {
    if (!newVal) {
      return
    }
    getContractList(newVal)
  },
  {
    immediate: true
  }
)
watch(
  () => formData.value.contractId,
  (newVal) => {
    if (!newVal) {
      return
    }
    getReceivablePlanList(newVal)
  },
  {
    immediate: true
  }
)
watch(
  () => formData.value.planId,
  (newVal) => {
    if (!newVal) {
      return
    }
    const receivablePlan = receivablePlanList.value.find((item) => item.id === newVal)
    if (!receivablePlan) {
      return
    }
    // 只有没有金额的时候才设置
    if (!formData.value.price || formData.value.price === 0) {
      formData.value.price = receivablePlan.price
    }
  }
)
</script>
