<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1100px">
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
          <el-form-item label="转移单编号" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入转移单编号"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode" :disabled="isHeaderReadonly">生成</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="转移单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入转移单名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="转移单类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择转移单类型"
              class="!w-full"
              :disabled="isHeaderReadonly"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_TRANSFER_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="转移日期" prop="transferDate">
            <el-date-picker
              v-model="formData.transferDate"
              type="date"
              value-format="YYYY-MM-DD 00:00:00"
              placeholder="请选择转移日期"
              class="!w-full"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="isOuterType" :span="8">
          <el-form-item label="是否配送" prop="deliveryFlag">
            <el-switch v-model="formData.deliveryFlag" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col v-if="isOuterType" :span="8">
          <el-form-item label="是否确认" prop="confirmFlag">
            <el-switch :model-value="formData.confirmFlag" disabled />
          </el-form-item>
        </el-col>
        <el-col v-if="showDeliveryFields" :span="8">
          <el-form-item label="收货人" prop="recipientName">
            <el-input
              v-model="formData.recipientName"
              placeholder="请输入收货人"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="showDeliveryFields" :span="8">
          <el-form-item label="联系电话" prop="recipientTelephone">
            <el-input
              v-model="formData.recipientTelephone"
              placeholder="请输入联系电话"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="showDeliveryFields" :span="8">
          <el-form-item label="承运商" prop="carrier">
            <el-input
              v-model="formData.carrier"
              placeholder="请输入承运商"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="showDeliveryFields" :span="8">
          <el-form-item label="运输单号" prop="shippingNumber">
            <el-input
              v-model="formData.shippingNumber"
              placeholder="请输入运输单号"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="showDeliveryFields" :span="16">
          <el-form-item label="目的地" prop="destinationAddress">
            <el-input
              v-model="formData.destinationAddress"
              placeholder="请输入目的地"
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

    <!-- 非新建模式展示行项目信息（调拨物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <TransferLineList :transfer-id="formData.id" :form-type="formType" />
    </template>

    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesWmTransferStatusEnum.PREPARE"
        @click="handleSubmit"
        type="warning"
        :disabled="formLoading"
      >
        提 交
      </el-button>
      <el-button v-if="isConfirm" @click="handleConfirm" type="success" :disabled="formLoading">
        到货确认
      </el-button>
      <el-button v-if="isStock" @click="handleStock" type="primary" :disabled="formLoading">
        执行上架
      </el-button>
      <el-button v-if="isFinish" @click="handleFinish" type="success" :disabled="formLoading">
        执行转移
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { WmTransferApi, WmTransferVO } from '@/api/mes/wm/transfer'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import { MesAutoCodeRuleCode, MesWmTransferStatusEnum } from '@/views/mes/utils/constants'
import TransferLineList from './TransferLineList.vue'

defineOptions({ name: 'TransferForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / confirm / stock / finish / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isConfirm = computed(() => formType.value === 'confirm') // 是否为到货确认模式
const isStock = computed(() => formType.value === 'stock') // 是否为上架模式
const isFinish = computed(() => formType.value === 'finish') // 是否为执行转移模式
const isDetail = computed(() => ['detail', 'confirm', 'finish'].includes(formType.value)) // 是否为详情模式
const isHeaderReadonly = computed(
  () => ['stock', 'confirm', 'finish', 'detail'].includes(formType.value) // 表头是否只读
)
const isOuterType = computed(() => !!formData.value.type && Number(formData.value.type) === 2)
const showDeliveryFields = computed(() => isOuterType.value && !!formData.value.deliveryFlag)
const dialogTitle = computed(() => {
  const titles = {
    create: '新增转移单',
    update: '编辑转移单',
    confirm: '到货确认',
    stock: '执行上架',
    finish: '执行转移',
    detail: '转移单详情'
  }
  return titles[formType.value] || formType.value
})
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  status: undefined as number | undefined,
  type: undefined as number | undefined,
  deliveryFlag: false,
  recipientName: undefined,
  recipientTelephone: undefined,
  destinationAddress: undefined,
  carrier: undefined,
  shippingNumber: undefined,
  confirmFlag: false,
  transferDate: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '转移单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '转移单名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '转移单类型不能为空', trigger: 'change' }],
  transferDate: [{ required: true, message: '转移日期不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成转移单编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(MesAutoCodeRuleCode.TRANSFER_CODE)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/确认/上架/完成/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmTransferApi.getTransfer(id)
    } finally {
      formLoading.value = false
    }
  }
  // 保存原始数据快照
  originalFormData.value = JSON.stringify(formData.value)
}

/** 提交表单（create/update 模式，保存） */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmTransferVO
    if (formType.value === 'create') {
      const id = await WmTransferApi.createTransfer(data)
      message.success('新增成功')
      formData.value.id = id
      formData.value.status = MesWmTransferStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await WmTransferApi.updateTransfer(data)
      message.success('修改成功')
    }
    // 更新快照
    originalFormData.value = JSON.stringify(formData.value)
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 提交操作：表单修改过则先保存，再提交 */
const handleSubmit = async () => {
  await formRef.value.validate()
  try {
    await message.confirm('确认提交该转移单？【提交后将不能修改】')
    formLoading.value = true
    // 1. 表单有修改时，先保存
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as unknown as WmTransferVO
      await WmTransferApi.updateTransfer(data)
    }
    // 2. 提交转移单
    await WmTransferApi.submitTransfer(formData.value.id!)
    message.success('提交成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 到货确认 */
const handleConfirm = async () => {
  try {
    await message.confirm('确认到货后，将进入待上架状态，是否继续？')
    formLoading.value = true
    await WmTransferApi.confirmTransfer(formData.value.id!)
    message.success('确认成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 执行上架 */
const handleStock = async () => {
  try {
    await message.confirm('确认执行上架？')
    formLoading.value = true
    await WmTransferApi.stockTransfer(formData.value.id!)
    message.success('上架成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 执行转移 */
const handleFinish = async () => {
  try {
    await message.confirm('确认执行调拨？执行后将更新库存。')
    formLoading.value = true
    await WmTransferApi.finishTransfer(formData.value.id!)
    message.success('执行成功')
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
    type: undefined,
    deliveryFlag: false,
    recipientName: undefined,
    recipientTelephone: undefined,
    destinationAddress: undefined,
    carrier: undefined,
    shippingNumber: undefined,
    confirmFlag: false,
    transferDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
