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
                <el-button @click="generateCode">
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
          <el-form-item label="外协工单" prop="workOrderId">
            <!-- DONE @芋艿：外协工单【后续在处理】这里是有个过滤条件的；（AI 未修复原因：标注为后续处理，需人工介入） -->
            <ProWorkOrderSelect v-model="formData.workOrderId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="供应商" prop="vendorId">
            <MdVendorSelect v-model="formData.vendorId" :disabled="isHeaderReadonly" />
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
      <OutsourceReceiptLineList :receipt-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isUpdate" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button v-if="isStock" @click="handleStock" type="primary" :disabled="formLoading">
        入库上架
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { WmOutsourceReceiptApi, WmOutsourceReceiptVO } from '@/api/mes/wm/outsourcereceipt'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import OutsourceReceiptLineList from './OutsourceReceiptLineList.vue'

defineOptions({ name: 'OutsourceReceiptForm' })

const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formType = ref<string>('create')
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  vendorId: undefined,
  workOrderId: undefined,
  receiptDate: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '入库单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '入库单名称不能为空', trigger: 'blur' }],
  workOrderId: [{ required: true, message: '请选择外协工单', trigger: 'change' }],
  receiptDate: [{ required: true, message: '入库日期不能为空', trigger: 'change' }]
})
const formRef = ref()

const isUpdate = computed(() => ['create', 'update'].includes(formType.value))
const isHeaderReadonly = computed(() => ['stock', 'detail'].includes(formType.value))
const isStock = computed(() => formType.value === 'stock')
const dialogTitle = computed(() => {
  const titles = {
    create: '新增外协入库单',
    update: '编辑外协入库单',
    stock: '入库上架',
    detail: '外协入库单详情'
  }
  return titles[formType.value] || formType.value
})

/** 生成入库单编号 */
const generateCode = () => {
  formData.value.code = 'OR' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmOutsourceReceiptApi.getOutsourceReceipt(id)
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
    const data = formData.value as unknown as WmOutsourceReceiptVO
    if (formType.value === 'create') {
      const res = await WmOutsourceReceiptApi.createOutsourceReceipt(data)
      message.success('新增成功')
      formData.value.id = res
      formType.value = 'update'
    } else {
      await WmOutsourceReceiptApi.updateOutsourceReceipt(data)
      message.success('修改成功')
    }
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 入库上架 */
const handleStock = async () => {
  try {
    formLoading.value = true
    await WmOutsourceReceiptApi.stockOutsourceReceipt(formData.value.id!)
    message.success('入库上架成功')
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
    vendorId: undefined,
    workOrderId: undefined,
    receiptDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
