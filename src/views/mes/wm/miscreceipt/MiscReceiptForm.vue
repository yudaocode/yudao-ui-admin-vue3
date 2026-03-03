<!-- DONE @AI：每行三个：（已实现，每行使用 el-col :span="8" 布局三个字段） -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
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
                <el-button @click="generateCode" :disabled="formType !== 'create'">
                  生成
                </el-button>
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
          <el-form-item label="来源单据编码" prop="sourceDocCode">
            <el-input
              v-model="formData.sourceDocCode"
              placeholder="请输入来源单据编码"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
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
import { WmMiscReceiptApi, WmMiscReceiptVO } from '@/api/mes/wm/miscreceipt'
import MiscReceiptLineList from './MiscReceiptLineList.vue'

defineOptions({ name: 'MiscReceiptForm' })

const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formType = ref<string>('create') // create / update / detail
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  sourceDocId: undefined,
  sourceDocCode: undefined,
  sourceDocType: undefined,
  receiptDate: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '入库单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '入库单名称不能为空', trigger: 'blur' }]
})
const formRef = ref()

const isUpdate = computed(() => ['create', 'update'].includes(formType.value))
const isHeaderReadonly = computed(() => formType.value === 'detail')
const dialogTitle = computed(() => {
  const titles = {
    create: '新增杂项入库单',
    update: '编辑杂项入库单',
    detail: '杂项入库单详情'
  }
  return titles[formType.value] || formType.value
})

/** 生成入库单编号 */
const generateCode = () => {
  formData.value.code = 'MR' + generateRandomStr(10)
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
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmMiscReceiptVO
    if (formType.value === 'create') {
      const res = await WmMiscReceiptApi.createMiscReceipt(data)
      message.success('新增成功')
      formData.value.id = res
      formType.value = 'update'
    } else {
      await WmMiscReceiptApi.updateMiscReceipt(data)
      message.success('修改成功')
    }
    emit('success')
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
    sourceDocId: undefined,
    sourceDocCode: undefined,
    sourceDocType: undefined,
    receiptDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
