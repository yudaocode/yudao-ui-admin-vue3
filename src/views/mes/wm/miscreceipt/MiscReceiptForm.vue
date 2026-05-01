<!-- DONE @AI：每行三个：（已实现，每行使用 el-col :span="8" 布局三个字段） -->
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
          <el-form-item label="入库单编号" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入入库单编号"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode" :disabled="isHeaderReadonly"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入入库单名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <!-- DONE @AI：业务类型（已使用"杂项类型"标签） -->
          <el-form-item label="杂项类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择杂项类型"
              class="!w-1/1"
              :disabled="isHeaderReadonly"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_MISC_RECEIPT_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="来源单据类型" prop="sourceDocType">
            <el-input
              v-model="formData.sourceDocType"
              placeholder="请输入来源单据类型"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="来源单据编码" prop="sourceDocCode">
            <el-input
              v-model="formData.sourceDocCode"
              placeholder="请输入来源单据编码"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库日期" prop="receiptDate">
            <el-date-picker
              v-model="formData.receiptDate"
              type="date"
              value-format="x"
              placeholder="请选择入库日期"
              class="!w-1/1"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
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
    <!-- 非新建模式展示行项目信息（入库物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <MiscReceiptLineList :receipt-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesWmMiscReceiptStatusEnum.PREPARE"
        @click="handleSubmit"
        type="warning"
        :disabled="formLoading"
      >
        提 交
      </el-button>
      <el-button v-if="isFinish" @click="handleFinish" type="success" :disabled="formLoading">
        执行入库
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { WmMiscReceiptApi, WmMiscReceiptVO } from '@/api/mes/wm/miscreceipt'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import MiscReceiptLineList from './MiscReceiptLineList.vue'
import { MesAutoCodeRuleCode, MesWmMiscReceiptStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MiscReceiptForm' })
const emit = defineEmits(['success'])

const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formType = ref<string>('create') // create / update / finish / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value))
const isFinish = computed(() => formType.value === 'finish')
const isDetail = computed(() => ['detail', 'finish'].includes(formType.value))
const isHeaderReadonly = computed(() => ['detail', 'finish'].includes(formType.value))
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增杂项入库单',
    update: '编辑杂项入库单',
    finish: '执行入库',
    detail: '杂项入库单详情'
  }
  return titles[formType.value] || formType.value
})
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  status: undefined as number | undefined,
  sourceDocType: undefined,
  sourceDocId: undefined,
  sourceDocCode: undefined,
  receiptDate: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '入库单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '入库单名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '杂项类型不能为空', trigger: 'change' }],
  receiptDate: [{ required: true, message: '入库日期不能为空', trigger: 'blur' }]
})
const formRef = ref()
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成入库单编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.WM_MISC_RECEIPT_CODE
  )
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmMiscReceiptApi.getMiscReceipt(id)
    } finally {
      formLoading.value = false
    }
  }
  // 保存原始数据快照
  originalFormData.value = JSON.stringify(formData.value)
}
defineExpose({ open })

/** 保存表单（create/update 模式） */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmMiscReceiptVO
    if (formType.value === 'create') {
      const res = await WmMiscReceiptApi.createMiscReceipt(data)
      message.success('新增成功')
      formData.value.id = res
      formData.value.status = MesWmMiscReceiptStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await WmMiscReceiptApi.updateMiscReceipt(data)
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
    await message.confirm('确认提交该杂项入库单？【提交后将不能修改】')
    formLoading.value = true
    // 1. 表单有修改时，先保存
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as unknown as WmMiscReceiptVO
      await WmMiscReceiptApi.updateMiscReceipt(data)
    }
    // 2. 提交入库单
    await WmMiscReceiptApi.submitMiscReceipt(formData.value.id!)
    message.success('提交成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 执行入库 */
const handleFinish = async () => {
  try {
    await message.confirm('确认执行入库？执行后将更新库存台账。')
    formLoading.value = true
    await WmMiscReceiptApi.finishMiscReceipt(formData.value.id!)
    message.success('入库成功')
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
    type: undefined,
    status: undefined,
    sourceDocType: undefined,
    sourceDocId: undefined,
    sourceDocCode: undefined,
    receiptDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
