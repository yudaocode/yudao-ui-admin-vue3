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
          <el-form-item label="领料单编号" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入领料单编号"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode" :disabled="isHeaderReadonly"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="领料单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入领料单名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="需求时间" prop="requiredTime">
            <el-date-picker
              v-model="formData.requiredTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择需求时间"
              :disabled="isHeaderReadonly"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产工单" prop="workOrderId">
            <ProWorkOrderSelect v-model="formData.workOrderId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工作站" prop="workstationId">
            <MdWorkstationSelect v-model="formData.workstationId" :disabled="isHeaderReadonly" />
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
    <!-- 非新建模式展示行项目信息（领料物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <ProductIssueLineList :issue-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesWmProductIssueStatusEnum.PREPARE"
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
        完 成
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmProductIssueApi, WmProductIssueVO } from '@/api/mes/wm/productissue'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import { MesAutoCodeRuleCode, MesWmProductIssueStatusEnum } from '@/views/mes/utils/constants'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import ProductIssueLineList from './ProductIssueLineList.vue'

defineOptions({ name: 'ProductIssueForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / stock / finish / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isStock = computed(() => formType.value === 'stock') // 是否为拣货模式
const isFinish = computed(() => formType.value === 'finish') // 是否为完成出库模式
const isDetail = computed(() => ['detail', 'finish'].includes(formType.value)) // 是否为详情模式（表单禁用）
const isHeaderReadonly = computed(() =>
  ['stock', 'detail', 'finish'].includes(formType.value)
) // 表头是否只读
const dialogTitle = computed(() => {
  const titles = {
    create: '新增领料出库单',
    update: '编辑领料出库单',
    stock: '执行拣货',
    finish: '完成领料出库',
    detail: '领料出库单详情'
  }
  return titles[formType.value] || formType.value
})
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  status: undefined as number | undefined,
  workOrderId: undefined,
  workstationId: undefined,
  requiredTime: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '领料单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '领料单名称不能为空', trigger: 'blur' }],
  workOrderId: [{ required: true, message: '生产工单不能为空', trigger: 'change' }],
  requiredTime: [{ required: true, message: '需求时间不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成领料单编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.WM_PRODUCT_ISSUE_CODE
  )
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/拣货/完成/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmProductIssueApi.getProductIssue(id)
    } finally {
      formLoading.value = false
    }
  }
  // 保存原始数据快照
  originalFormData.value = JSON.stringify(formData.value)
}

/** 保存表单（create/update 模式的保存按钮） */
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmProductIssueVO
    if (formType.value === 'create') {
      const res = await WmProductIssueApi.createProductIssue(data)
      message.success('新增成功')
      // 创建成功后，更新表单数据和状态为编辑模式
      formData.value.id = res
      formData.value.status = MesWmProductIssueStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await WmProductIssueApi.updateProductIssue(data)
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
    await message.confirm('确认提交该领料出库单？【提交后将不能修改】')
    formLoading.value = true
    // 1. 表单有修改时，先保存
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as unknown as WmProductIssueVO
      await WmProductIssueApi.updateProductIssue(data)
    }
    // 2. 提交领料单
    await WmProductIssueApi.submitProductIssue(formData.value.id!)
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
    formLoading.value = true
    // 校验领料数量与拣货数量是否一致
    const quantityMatch = await WmProductIssueApi.checkProductIssueQuantity(formData.value.id!)
    if (!quantityMatch) {
      await message.confirm('领料数量与拣货数量不一致，确认执行拣货？')
    }
    await WmProductIssueApi.stockProductIssue(formData.value.id!)
    message.success('拣货成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 完成领料出库 */
const handleFinish = async () => {
  try {
    await message.confirm('确认完成该领料单并执行出库吗？')
    formLoading.value = true
    await WmProductIssueApi.finishProductIssue(formData.value.id!)
    message.success('完成成功')
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
    workOrderId: undefined,
    workstationId: undefined,
    requiredTime: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
