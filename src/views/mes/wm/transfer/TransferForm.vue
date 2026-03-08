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
            <!-- DONE @AI：编辑时允许调整转移单类型；配送相关字段按类型和是否配送联动展示 -->
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
        <!-- DONE @AI：前端仅选择日期，后端继续按 LocalDateTime 接收 -->
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
        <!-- TODO @AI：目前看，是否确认，前端不传递！；所以 save 接口也处理掉 -->
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

    <!-- TODO @AI：需要跟进下； -->
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

// DONE @AI：参考 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/system/user/UserForm.vue 的注释风格；

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

// DONE @AI：仅在外部转移且选择配送时校验收货信息
// TODO @AI：这里不用填写！
const validateRecipientFields = (_rule, _value, callback) => {
  if (!showDeliveryFields.value) {
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
const showDeliveryFields = computed(() => isOuterType.value && !!formData.value.deliveryFlag)
const dialogTitle = computed(() => {
  const titles = {
    create: '新增转移单',
    update: '编辑转移单',
    stock: '维护调拨明细',
    detail: '转移单详情'
  }
  return titles[formType.value] || formType.value
})

// DONE @AI：暂时保留前端随机编码生成
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
    confirmFlag: false,
    transferDate: undefined,
    status: undefined,
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
    const { confirmFlag: _confirmFlag, status: _status, ...data } = formData.value
    // TODO @AI：看看这里，能不能计划下；
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
</script>
