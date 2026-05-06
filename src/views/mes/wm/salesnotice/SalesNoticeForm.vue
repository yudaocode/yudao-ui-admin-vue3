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
          <el-form-item label="通知单编号" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入通知单编号"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode" :disabled="isHeaderReadonly"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="通知单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入通知单名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="销售订单编号" prop="salesOrderCode">
            <el-input
              v-model="formData.salesOrderCode"
              placeholder="请输入销售订单编号"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="客户" prop="clientId">
            <MdClientSelect v-model="formData.clientId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="发货日期" prop="salesDate">
            <el-date-picker
              v-model="formData.salesDate"
              type="date"
              value-format="x"
              placeholder="请选择发货日期"
              class="!w-1/1"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
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
          <el-form-item label="联系方式" prop="recipientTelephone">
            <el-input
              v-model="formData.recipientTelephone"
              placeholder="请输入联系方式"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="收货地址" prop="recipientAddress">
            <el-input
              v-model="formData.recipientAddress"
              placeholder="请输入收货地址"
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
    <!-- 非新建模式展示物料信息 -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <SalesNoticeLineList :notice-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesWmSalesNoticeStatusEnum.PREPARE"
        @click="handleSubmit"
        type="warning"
        :disabled="formLoading"
      >
        提 交
      </el-button>
      <el-button v-if="isFinish" @click="handleFinish" type="success" :disabled="formLoading">
        执行出库
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmSalesNoticeApi, WmSalesNoticeVO } from '@/api/mes/wm/salesnotice'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import SalesNoticeLineList from './SalesNoticeLineList.vue'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import { MesAutoCodeRuleCode, MesWmSalesNoticeStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'SalesNoticeForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / finish / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isFinish = computed(() => formType.value === 'finish') // 是否为执行出库模式
const isDetail = computed(() => ['detail', 'finish'].includes(formType.value)) // 是否为详情模式
const isHeaderReadonly = computed(() => ['detail', 'finish'].includes(formType.value)) // 是否只读
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增发货通知单',
    update: '编辑发货通知单',
    finish: '执行出库',
    detail: '发货通知单详情'
  }
  return titles[formType.value] || formType.value
})
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  salesOrderCode: undefined,
  clientId: undefined,
  salesDate: undefined,
  status: undefined as number | undefined,
  recipientName: undefined,
  recipientTelephone: undefined,
  recipientAddress: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '通知单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '通知单名称不能为空', trigger: 'blur' }],
  clientId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  salesDate: [{ required: true, message: '请选择发货日期', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成通知单编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.WM_SALES_NOTICE_CODE
  )
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmSalesNoticeApi.getSalesNotice(id)
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
    const data = formData.value as unknown as WmSalesNoticeVO
    if (formType.value === 'create') {
      const res = await WmSalesNoticeApi.createSalesNotice(data)
      message.success('新增成功')
      // 创建成功后，更新表单数据和状态为编辑模式
      formData.value.id = res
      formData.value.status = MesWmSalesNoticeStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await WmSalesNoticeApi.updateSalesNotice(data)
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
    await message.confirm('确认提交该发货通知单？【提交后将不能修改】')
    formLoading.value = true
    // 1. 表单有修改时，先保存
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as unknown as WmSalesNoticeVO
      await WmSalesNoticeApi.updateSalesNotice(data)
    }
    // 2. 提交发货通知单
    await WmSalesNoticeApi.submitSalesNotice(formData.value.id!)
    message.success('提交成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 执行出库操作（暂未实现） */
const handleFinish = () => {
  message.info('执行出库功能暂时不支持，敬请期待！')
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    salesOrderCode: undefined,
    clientId: undefined,
    salesDate: undefined,
    status: undefined,
    recipientName: undefined,
    recipientTelephone: undefined,
    recipientAddress: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
