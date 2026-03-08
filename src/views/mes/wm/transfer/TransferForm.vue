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
            <!-- TODO @AI：可以更新 type 类型（编辑的时候）； -->
            <!-- TODO @AI：
              当外部转移时，才展示：是否配送；
              在选择是配送时，才有收货人、联系方式、承运航、运输单号、目的地字段；
            -->
            <el-select
              v-model="formData.type"
              placeholder="请选择转移单类型"
              class="!w-full"
              :disabled="formType !== 'create' || isHeaderReadonly"
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
        <!-- TODO @AI：只选择日期。当然后端还是使用 LocalDateTime 接收； -->
        <el-col :span="8">
          <el-form-item label="转移日期" prop="transferDate">
            <el-date-picker
              v-model="formData.transferDate"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择转移日期"
              class="!w-full"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="是否配送" prop="deliveryFlag">
            <el-switch v-model="formData.deliveryFlag" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="是否确认" prop="confirmFlag">
            <el-switch v-model="formData.confirmFlag" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="收货人" prop="recipientName">
            <el-input
              v-model="formData.recipientName"
              placeholder="请输入收货人"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系电话" prop="recipientTelephone">
            <el-input
              v-model="formData.recipientTelephone"
              placeholder="请输入联系电话"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="承运商" prop="carrier">
            <el-input
              v-model="formData.carrier"
              placeholder="请输入承运商"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="运输单号" prop="shippingNumber">
            <el-input
              v-model="formData.shippingNumber"
              placeholder="请输入运输单号"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="16">
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

    <template v-if="formData.id">
      <el-alert
        v-if="formType === 'stock'"
        type="info"
        :closable="false"
        class="mb-12px"
        title="当前阶段仅维护调拨明细；明细维护完成后，请回到列表页执行后续状态操作。"
      />
      <el-divider content-position="center">调拨物料</el-divider>
      <TransferLineList :transfer-id="formData.id" :form-type="formType" />
    </template>

    <template #footer>
      <el-button v-if="isUpdate" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
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

// TODO @AI：参考 system user form.vue 的注释风格；

defineOptions({ name: 'TransferForm' })

const emit = defineEmits(['success'])
const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formType = ref<string>('create')
const formRef = ref()
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
  status: undefined,
  remark: undefined
})

// TODO @AI：非必填；不用校验；
const validateRecipientFields = (_rule, _value, callback) => {
  if (!isOuterType.value) {
    callback()
    return
  }
  if (!formData.value.recipientName) {
    callback(new Error('外部调拨时收货人不能为空'))
    return
  }
  if (!formData.value.recipientTelephone) {
    callback(new Error('外部调拨时联系电话不能为空'))
    return
  }
  if (!formData.value.destinationAddress) {
    callback(new Error('外部调拨时目的地不能为空'))
    return
  }
  callback()
}

// TODO @AI：必填仅 code、name、type、transferDate、是否配送；
const formRules = reactive({
  code: [{ required: true, message: '转移单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '转移单名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '转移单类型不能为空', trigger: 'change' }],
  transferDate: [{ required: true, message: '转移日期不能为空', trigger: 'change' }],
  recipientName: [{ validator: validateRecipientFields, trigger: 'blur' }],
  recipientTelephone: [{ validator: validateRecipientFields, trigger: 'blur' }],
  destinationAddress: [{ validator: validateRecipientFields, trigger: 'blur' }]
})

const isUpdate = computed(() => ['create', 'update'].includes(formType.value))
const isHeaderReadonly = computed(() => ['stock', 'detail'].includes(formType.value))
const isOuterType = computed(() => !!formData.value.type && Number(formData.value.type) === 2)
const dialogTitle = computed(() => {
  const titles = {
    create: '新增转移单',
    update: '编辑转移单',
    stock: '维护调拨明细',
    detail: '转移单详情'
  }
  return titles[formType.value] || formType.value
})

// TODO @AI：接入到 code 生成；【可以后面再搞】
const generateCode = () => {
  formData.value.code = 'TR' + generateRandomStr(10)
}

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
    confirmFlag: false, // TODO @AI：前端不传递 confirmFlag；后端的 SaveVO 也调整下；
    transferDate: undefined,
    status: undefined, // TODO @AI：前端不传递 status；后端的 SaveVO 也调整下；
    remark: undefined
  }
  formRef.value?.resetFields()
}

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
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

const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmTransferVO
    if (formType.value === 'create') {
      const id = await WmTransferApi.createTransfer(data)
      message.success('新增成功')
      formData.value.id = id
      formType.value = 'update'
    } else {
      await WmTransferApi.updateTransfer(data)
      message.success('修改成功')
    }
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
