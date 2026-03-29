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
        <el-col :span="8">
          <el-form-item label="到货通知单" prop="noticeId">
            <WmArrivalNoticeSelect
              v-model="formData.noticeId"
              :status="MesWmArrivalNoticeStatusEnum.PENDING_RECEIPT"
              :disabled="isHeaderReadonly"
              @change="handleNoticeChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="供应商" prop="vendorId">
            <MdVendorSelect v-model="formData.vendorId" :disabled="isHeaderReadonly" />
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
      <ItemReceiptLineList
        :receipt-id="formData.id"
        :notice-id="formData.noticeId"
        :form-type="formType"
      />
    </template>
    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="formType === 'update' && formData.status === MesWmItemReceiptStatusEnum.PREPARE"
        @click="handleSubmit"
        type="warning"
        :disabled="formLoading"
      >
        提 交
      </el-button>
      <el-button v-if="isStock" @click="handleStock" type="primary" :disabled="formLoading">
        执行上架
      </el-button>
      <el-button
        v-if="formData.status === MesWmItemReceiptStatusEnum.APPROVED"
        @click="handleFinish"
        type="success"
        :disabled="formLoading"
      >
        执行入库
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmItemReceiptApi, WmItemReceiptVO } from '@/api/mes/wm/itemreceipt'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import WmArrivalNoticeSelect from '@/views/mes/wm/arrivalnotice/components/WmArrivalNoticeSelect.vue'
import ItemReceiptLineList from './ItemReceiptLineList.vue'
import {
  MesAutoCodeRuleCode,
  MesWmArrivalNoticeStatusEnum,
  MesWmItemReceiptStatusEnum
} from '@/views/mes/utils/constants'

defineOptions({ name: 'ItemReceiptForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / stock / detail
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  status: undefined as number | undefined,
  vendorId: undefined,
  noticeId: undefined,
  iqcId: undefined,
  receiptDate: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '入库单编号不能为空', trigger: 'blur' }],
  receiptDate: [{ required: true, message: '入库日期不能为空', trigger: 'change' }],
  vendorId: [{ required: true, message: '供应商不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isStock = computed(() => formType.value === 'stock') // 是否为上架模式
const isDetail = computed(() => formType.value === 'detail') // 是否为详情模式
const isHeaderReadonly = computed(() => ['stock', 'detail'].includes(formType.value)) // 是否只读
const dialogTitle = computed(() => {
  const titles = {
    create: '新增采购入库单',
    update: '编辑采购入库单',
    stock: '执行上架',
    detail: '采购入库单详情'
  }
  return titles[formType.value] || formType.value
})
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成入库单编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.WM_ITEM_RECEIPT_CODE
  )
}

/** 到货通知单变化时，自动填充供应商 */
const handleNoticeChange = (notice: any) => {
  if (notice) {
    formData.value.vendorId = notice.vendorId
  }
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
      formData.value = await WmItemReceiptApi.getItemReceipt(id)
    } finally {
      formLoading.value = false
    }
  }
  // 保存原始数据快照
  originalFormData.value = JSON.stringify(formData.value)
}
defineExpose({ open })

/** 提交表单（create/update 模式） */
const emit = defineEmits(['success'])
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmItemReceiptVO
    if (formType.value === 'create') {
      const res = await WmItemReceiptApi.createItemReceipt(data)
      message.success('新增成功')
      formData.value.id = res
      formData.value.status = MesWmItemReceiptStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await WmItemReceiptApi.updateItemReceipt(data)
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
    await message.confirm('确认提交该采购入库单？【提交后将不能修改】')
    formLoading.value = true
    // 1. 表单有修改时，先保存
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as unknown as WmItemReceiptVO
      await WmItemReceiptApi.updateItemReceipt(data)
    }
    // 2. 提交入库单
    await WmItemReceiptApi.submitItemReceipt(formData.value.id!)
    message.success('提交成功')
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
    await WmItemReceiptApi.stockItemReceipt(formData.value.id!)
    message.success('上架成功')
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
    await WmItemReceiptApi.finishItemReceipt(formData.value.id!)
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
    status: undefined,
    vendorId: undefined,
    noticeId: undefined,
    iqcId: undefined,
    receiptDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
