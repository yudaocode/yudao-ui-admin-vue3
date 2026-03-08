<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1100px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
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
                <el-button @click="generateCode" :disabled="formType !== 'create'">生成</el-button>
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
      <el-button v-if="isUpdate" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button v-if="isStock" @click="handleStock" type="primary" :disabled="formLoading">
        执行上架
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { WmTransferApi, WmTransferVO } from '@/api/mes/wm/transfer'
import TransferLineList from './TransferLineList.vue'

defineOptions({ name: 'TransferForm' })

const emit = defineEmits(['success'])
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / stock / detail
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
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
  transferDate: [{ required: true, message: '转移日期不能为空', trigger: 'change' }],
})

const isUpdate = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isStock = computed(() => formType.value === 'stock') // 是否为上架模式
const isHeaderReadonly = computed(() => ['stock', 'detail'].includes(formType.value)) // 是否只读
const isOuterType = computed(() => !!formData.value.type && Number(formData.value.type) === 2) // 是否外部转移
const showDeliveryFields = computed(() => isOuterType.value && !!formData.value.deliveryFlag) // 是否显示配送信息
const dialogTitle = computed(() => {
  const titles = {
    create: '新增转移单',
    update: '编辑转移单',
    stock: '执行上架',
    detail: '转移单详情'
  }
  return titles[formType.value] || formType.value
})

/** 生成转移单编号 */
const generateCode = () => {
  formData.value.code = 'TR' + generateRandomStr(10)
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
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

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/上架/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmTransferApi.getTransfer(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单（create/update 模式） */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const { confirmFlag: _confirmFlag, status: _status, ...data } = formData.value
    if (!isOuterType.value) {
      data.deliveryFlag = false
      data.recipientName = undefined
      data.recipientTelephone = undefined
      data.destinationAddress = undefined
      data.carrier = undefined
      data.shippingNumber = undefined
    } else if (!showDeliveryFields.value) {
      data.recipientName = undefined
      data.recipientTelephone = undefined
      data.destinationAddress = undefined
      data.carrier = undefined
      data.shippingNumber = undefined
    }
    if (formType.value === 'create') {
      const id = await WmTransferApi.createTransfer(data as unknown as WmTransferVO)
      message.success('新增成功')
      formData.value.id = id
      formType.value = 'update'
    } else {
      await WmTransferApi.updateTransfer(data as unknown as WmTransferVO)
      message.success('修改成功')
    }
    emit('success')
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
</script>
