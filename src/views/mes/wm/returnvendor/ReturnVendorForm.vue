<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="退货单编号" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入退货单编号"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode" :disabled="isHeaderReadonly"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="退货单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入退货单名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="采购订单号" prop="purchaseOrderCode">
            <el-input
              v-model="formData.purchaseOrderCode"
              placeholder="请输入采购订单号"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="供应商" prop="vendorId">
            <MdVendorSelect v-model="formData.vendorId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="退货日期" prop="returnDate">
            <el-date-picker
              v-model="formData.returnDate"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择退货日期"
              :disabled="isHeaderReadonly"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="退货原因" prop="returnReason">
            <el-input
              v-model="formData.returnReason"
              type="textarea"
              placeholder="请输入退货原因"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="运单号" prop="transportCode">
            <el-input
              v-model="formData.transportCode"
              placeholder="请输入运单号"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系电话" prop="transportTelephone">
            <el-input
              v-model="formData.transportTelephone"
              placeholder="请输入联系电话"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              placeholder="请输入备注"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 非新建模式展示行项目信息（退货物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <ReturnVendorLineList :return-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesWmReturnVendorStatusEnum.PREPARE"
        @click="handleSubmit"
        type="warning"
        :disabled="formLoading"
      >
        提 交
      </el-button>
      <el-button v-if="isStock" @click="handleStock" type="primary" :disabled="formLoading">
        执行拣货
      </el-button>
      <el-button v-if="isFinish" @click="handleFinish" type="success" :disabled="formLoading">
        完成退货
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmReturnVendorApi, WmReturnVendorVO } from '@/api/mes/wm/returnvendor'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import ReturnVendorLineList from './ReturnVendorLineList.vue'
import { MesAutoCodeRuleCode, MesWmReturnVendorStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'ReturnVendorForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / stock / finish / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isStock = computed(() => formType.value === 'stock') // 是否为拣货模式
const isFinish = computed(() => formType.value === 'finish') // 是否为完成退货模式
const isDetail = computed(() => ['detail', 'finish'].includes(formType.value)) // 是否为详情模式
const isHeaderReadonly = computed(() => ['stock', 'detail', 'finish'].includes(formType.value)) // 是否只读
const dialogTitle = computed(() => {
  const titles = {
    create: '新增供应商退货单',
    update: '编辑供应商退货单',
    stock: '执行拣货',
    finish: '完成退货',
    detail: '供应商退货单详情'
  }
  return titles[formType.value] || formType.value
})
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  status: undefined as number | undefined,
  purchaseOrderCode: undefined,
  vendorId: undefined,
  returnDate: undefined,
  returnReason: undefined,
  transportCode: undefined,
  transportTelephone: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '退货单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '退货单名称不能为空', trigger: 'blur' }],
  vendorId: [{ required: true, message: '供应商不能为空', trigger: 'change' }],
  returnDate: [{ required: true, message: '退货日期不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成退货单编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.WM_RETURN_VENDOR_CODE
  )
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/拣货/完成/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmReturnVendorApi.getReturnVendor(id)
    } finally {
      formLoading.value = false
    }
  }
  // 保存原始数据快照
  originalFormData.value = JSON.stringify(formData.value)
}

/** 提交表单（create/update 模式） */
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmReturnVendorVO
    if (formType.value === 'create') {
      const res = await WmReturnVendorApi.createReturnVendor(data)
      message.success('新增成功')
      // 创建成功后，更新表单数据和状态为编辑模式
      formData.value.id = res
      formData.value.status = MesWmReturnVendorStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await WmReturnVendorApi.updateReturnVendor(data)
      message.success('修改成功')
    }
    // 更新快照
    originalFormData.value = JSON.stringify(formData.value)
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 提交操作：表单修改过则先保存，再提交 */
const handleSubmit = async () => {
  // 校验表单
  await formRef.value.validate()
  try {
    await message.confirm('确认提交该退货单？【提交后将不能修改】')
    formLoading.value = true
    // 1. 表单有修改时，先保存
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as unknown as WmReturnVendorVO
      await WmReturnVendorApi.updateReturnVendor(data)
    }
    // 2. 提交退货单
    await WmReturnVendorApi.submitReturnVendor(formData.value.id!)
    message.success('提交成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 执行拣货 */
const handleStock = async () => {
  try {
    formLoading.value = true
    // 校验退货数量与拣货数量是否一致
    const quantityMatch = await WmReturnVendorApi.checkReturnVendorQuantity(formData.value.id!)
    if (!quantityMatch) {
      await message.confirm('退货数量与拣货数量不一致，确认执行拣货？')
    }
    await WmReturnVendorApi.stockReturnVendor(formData.value.id!)
    message.success('拣货成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 完成退货 */
const handleFinish = async () => {
  try {
    await message.confirm('确认完成该退货单并执行退货？')
    formLoading.value = true
    await WmReturnVendorApi.finishReturnVendor(formData.value.id!)
    message.success('完成成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    status: undefined,
    purchaseOrderCode: undefined,
    vendorId: undefined,
    returnDate: undefined,
    returnReason: undefined,
    transportCode: undefined,
    transportTelephone: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
