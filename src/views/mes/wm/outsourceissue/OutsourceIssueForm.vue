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
          <el-form-item label="发料单编号" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入发料单编号"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode" :disabled="isHeaderReadonly"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="发料单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入发料单名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="发料日期" prop="issueDate">
            <el-date-picker
              v-model="formData.issueDate"
              type="date"
              value-format="x"
              placeholder="请选择发料日期"
              class="!w-1/1"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="外协工单" prop="workOrderId">
            <ProWorkOrderSelect
              v-model="formData.workOrderId"
              :type="MesProWorkOrderTypeEnum.OUTSOURCE"
              :status="MesProWorkOrderStatusEnum.CONFIRMED"
              :disabled="isHeaderReadonly"
              @change="handleWorkOrderChange"
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
    <!-- 非新建模式展示行项目信息（发料物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <OutsourceIssueLineList :issue-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesWmOutsourceIssueStatusEnum.PREPARE"
        @click="handleSubmit"
        type="warning"
        :disabled="formLoading"
      >
        提 交
      </el-button>
      <el-button v-if="isStock" @click="handleStock" type="primary" :disabled="formLoading">
        执行拣货
      </el-button>
      <el-button v-if="isFinish" @click="handleFinish" type="success" :disabled="formLoading">
        执行领出
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmOutsourceIssueApi, WmOutsourceIssueVO } from '@/api/mes/wm/outsourceissue'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import OutsourceIssueLineList from './OutsourceIssueLineList.vue'
import { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import {
  MesAutoCodeRuleCode,
  MesProWorkOrderStatusEnum,
  MesWmOutsourceIssueStatusEnum,
  MesProWorkOrderTypeEnum
} from '@/views/mes/utils/constants'

defineOptions({ name: 'OutsourceIssueForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / stock / finish / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isStock = computed(() => formType.value === 'stock') // 是否为拣货模式
const isFinish = computed(() => formType.value === 'finish') // 是否为执行领出模式
const isDetail = computed(() => ['detail', 'finish'].includes(formType.value)) // 是否为详情模式
const isHeaderReadonly = computed(() => ['stock', 'detail', 'finish'].includes(formType.value)) // 是否只读
const dialogTitle = computed(() => {
  const titles = {
    create: '新增外协发料单',
    update: '编辑外协发料单',
    stock: '执行拣货',
    finish: '执行领出',
    detail: '外协发料单详情'
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
  issueDate: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '发料单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '发料单名称不能为空', trigger: 'blur' }],
  workOrderId: [{ required: true, message: '请选择工单', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成发料单编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.WM_OUTSOURCE_ISSUE_CODE
  )
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
  // 修改/拣货/执行领出/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmOutsourceIssueApi.getOutsourceIssue(id)
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
    const data = formData.value as unknown as WmOutsourceIssueVO
    if (formType.value === 'create') {
      const res = await WmOutsourceIssueApi.createOutsourceIssue(data)
      message.success('新增成功')
      // 创建成功后，更新表单数据和状态为编辑模式
      formData.value.id = res
      formData.value.status = MesWmOutsourceIssueStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await WmOutsourceIssueApi.updateOutsourceIssue(data)
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
    await message.confirm('确认提交该外协发料单？【提交后将不能修改】')
    formLoading.value = true
    // 1. 表单有修改时，先保存
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as unknown as WmOutsourceIssueVO
      await WmOutsourceIssueApi.updateOutsourceIssue(data)
    }
    // 2. 提交发料单
    await WmOutsourceIssueApi.submitOutsourceIssue(formData.value.id!)
    message.success('提交成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 执行拣货 */
const handleStock = async () => {
  try {
    // 校验发料数量与拣货数量是否一致
    const quantityMatch = await WmOutsourceIssueApi.checkOutsourceIssueQuantity(formData.value.id!)
    if (!quantityMatch) {
      await message.confirm('发料数量与拣货数量不一致，确认执行拣货？')
    }
    await message.confirm('确认执行拣货？')
    formLoading.value = true
    await WmOutsourceIssueApi.stockOutsourceIssue(formData.value.id!)
    message.success('拣货成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 执行领出 */
const handleFinish = async () => {
  try {
    await message.confirm('确认执行领出？执行后将扣减库存，且无法撤销。')
    formLoading.value = true
    await WmOutsourceIssueApi.finishOutsourceIssue(formData.value.id!)
    message.success('领出成功')
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
    issueDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
