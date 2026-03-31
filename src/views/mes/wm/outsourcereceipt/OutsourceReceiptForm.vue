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
          <el-form-item label="外协工单" prop="workOrderId">
            <ProWorkOrderSelect
              v-model="formData.workOrderId"
              :type="MesProWorkOrderTypeEnum.OUTSOURCE"
              :disabled="isHeaderReadonly"
              @change="handleWorkOrderChange"
            />
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
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesWmOutsourceReceiptStatusEnum.PREPARE"
        @click="handleSubmit"
        type="warning"
        :disabled="formLoading"
      >
        提 交
      </el-button>
      <el-button v-if="isStock" @click="handleStock" type="primary" :disabled="formLoading">
        执行上架
      </el-button>
      <el-button v-if="isFinish" @click="handleFinish" type="success" :disabled="formLoading">
        完成入库
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { WmOutsourceReceiptApi, WmOutsourceReceiptVO } from '@/api/mes/wm/outsourcereceipt'
import { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import OutsourceReceiptLineList from './OutsourceReceiptLineList.vue'
import {
  MesProWorkOrderTypeEnum,
  MesWmOutsourceReceiptStatusEnum
} from '@/views/mes/utils/constants'

defineOptions({ name: 'OutsourceReceiptForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / stock / finish / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isStock = computed(() => formType.value === 'stock') // 是否为上架模式
const isFinish = computed(() => formType.value === 'finish') // 是否为完成入库模式
const isDetail = computed(() => ['detail', 'finish'].includes(formType.value)) // 是否为详情模式
const isHeaderReadonly = computed(() => ['stock', 'detail', 'finish'].includes(formType.value)) // 是否只读
const dialogTitle = computed(() => {
  const titles = {
    create: '新增外协入库单',
    update: '编辑外协入库单',
    stock: '执行上架',
    finish: '完成入库',
    detail: '外协入库单详情'
  }
  return titles[formType.value] || formType.value
})
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  status: undefined as number | undefined,
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
const formRef = ref() // 表单 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成入库单编号 */
const generateCode = () => {
  formData.value.code = 'OR' + generateRandomStr(10)
}

/** 工单选中回调 —— 自动回填供应商 */
const handleWorkOrderChange = (workOrder: ProWorkOrderVO | undefined) => {
  formData.value.vendorId = workOrder?.vendorId ?? undefined
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/上架/完成/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmOutsourceReceiptApi.getOutsourceReceipt(id)
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
    const data = formData.value as unknown as WmOutsourceReceiptVO
    if (formType.value === 'create') {
      const res = await WmOutsourceReceiptApi.createOutsourceReceipt(data)
      message.success('新增成功')
      // 创建成功后，更新表单数据和状态为编辑模式
      formData.value.id = res
      formData.value.status = MesWmOutsourceReceiptStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await WmOutsourceReceiptApi.updateOutsourceReceipt(data)
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
    await message.confirm('确认提交该外协入库单？【提交后将不能修改】')
    formLoading.value = true
    // 1. 表单有修改时，先保存
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as unknown as WmOutsourceReceiptVO
      await WmOutsourceReceiptApi.updateOutsourceReceipt(data)
    }
    // 2. 提交入库单
    await WmOutsourceReceiptApi.submitOutsourceReceipt(formData.value.id!)
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
    await WmOutsourceReceiptApi.stockOutsourceReceipt(formData.value.id!)
    message.success('上架成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 完成入库 */
const handleFinish = async () => {
  try {
    await message.confirm('确认完成入库？完成后将更新库存台账。')
    formLoading.value = true
    await WmOutsourceReceiptApi.finishOutsourceReceipt(formData.value.id!)
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
    workOrderId: undefined,
    receiptDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
