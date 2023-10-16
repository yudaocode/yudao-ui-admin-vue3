<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="合同名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入合同名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户" prop="customerId">
            <el-input v-model="formData.customerId" placeholder="请选择对应客户" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="商机名称" prop="businessId">
        <el-input v-model="formData.businessId" placeholder="请选择对应商机" />
      </el-form-item>
      <el-form-item label="工作流" prop="processInstanceId">
        <el-input v-model="formData.processInstanceId" placeholder="请选择工作流" />
      </el-form-item>
      <el-form-item label="下单日期" prop="orderDate">
        <el-date-picker
          v-model="formData.orderDate"
          type="date"
          value-format="x"
          placeholder="选择下单日期"
        />
      </el-form-item>
      <el-form-item label="负责人" prop="ownerUserId">
        <el-input v-model="formData.ownerUserId" placeholder="请选择负责人" />
      </el-form-item>
      <el-form-item label="合同编号" prop="no">
        <el-input v-model="formData.no" placeholder="请输入合同编号" />
      </el-form-item>

      <el-row>
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="date"
              value-format="x"
              placeholder="选择开始时间"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="date"
              value-format="x"
              placeholder="选择结束时间"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="8">
          <el-form-item label="合同金额" prop="price">
            <el-input v-model="formData.price" placeholder="请输入合同金额" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="整单折扣" prop="discountPercent">
            <el-input v-model="formData.discountPercent" placeholder="请输入整单折扣" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="产品总金额" prop="productPrice">
            <el-input v-model="formData.productPrice" placeholder="请输入产品总金额" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="只读权限的用户" prop="roUserIds">
        <el-input v-model="formData.roUserIds" placeholder="请输入只读权限的用户" />
      </el-form-item>
      <el-form-item label="读写权限的用户" prop="rwUserIds">
        <el-input v-model="formData.rwUserIds" placeholder="请输入读写权限的用户" />
      </el-form-item>

      <el-row>
        <el-col :span="12">
          <el-form-item label="联系人编号" prop="contactId">
            <el-input v-model="formData.contactId" placeholder="请输入联系人编号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="公司签约人" prop="signUserId">
            <el-input v-model="formData.signUserId" placeholder="请输入公司签约人" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="最后跟进时间" prop="contactLastTime">
        <el-date-picker
          v-model="formData.contactLastTime"
          type="date"
          value-format="x"
          placeholder="选择最后跟进时间"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as ContractApi from '@/api/crm/contract'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  customerId: undefined,
  businessId: undefined,
  processInstanceId: undefined,
  orderDate: undefined,
  ownerUserId: undefined,
  no: undefined,
  startTime: undefined,
  endTime: undefined,
  price: undefined,
  discountPercent: undefined,
  productPrice: undefined,
  roUserIds: undefined,
  rwUserIds: undefined,
  contactId: undefined,
  signUserId: undefined,
  contactLastTime: undefined,
  remark: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '合同名称不能为空', trigger: 'blur' }]
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
      formData.value = await ContractApi.getContract(id)
    } finally {
      formLoading.value = false
    }
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
    const data = formData.value as unknown as ContractApi.ContractVO
    if (formType.value === 'create') {
      await ContractApi.createContract(data)
      message.success(t('common.createSuccess'))
    } else {
      await ContractApi.updateContract(data)
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
    name: undefined,
    customerId: undefined,
    businessId: undefined,
    processInstanceId: undefined,
    orderDate: undefined,
    ownerUserId: undefined,
    no: undefined,
    startTime: undefined,
    endTime: undefined,
    price: undefined,
    discountPercent: undefined,
    productPrice: undefined,
    roUserIds: undefined,
    rwUserIds: undefined,
    contactId: undefined,
    signUserId: undefined,
    contactLastTime: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
