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
          <el-form-item label="退料单编号" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入退料单编号"
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
          <el-form-item label="退料单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入退料单名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="退料类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择退料类型"
              :disabled="isHeaderReadonly"
              class="!w-full"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
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
        <el-col :span="8">
          <el-form-item label="退料日期" prop="returnDate">
            <el-date-picker
              v-model="formData.returnDate"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择退料日期"
              :disabled="isHeaderReadonly"
              class="!w-full"
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
    <!-- 非新建模式展示行项目信息（退料物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <ReturnIssueLineList :issue-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesWmReturnIssueStatusEnum.PREPARE"
        @click="handleSubmit"
        type="warning"
        :disabled="formLoading"
      >
        提 交
      </el-button>
      <el-button v-if="isStock" @click="handleStock" type="primary" :disabled="formLoading">
        入库上架
      </el-button>
      <el-button v-if="isFinish" @click="handleFinish" type="success" :disabled="formLoading">
        执行退料
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { WmReturnIssueApi, WmReturnIssueVO } from '@/api/mes/wm/returnissue'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import { MesAutoCodeRuleCode, MesWmReturnIssueStatusEnum } from '@/views/mes/utils/constants'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import ReturnIssueLineList from './ReturnIssueLineList.vue'

defineOptions({ name: 'ReturnIssueForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / stock / finish / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isStock = computed(() => formType.value === 'stock') // 是否为入库上架模式
const isFinish = computed(() => formType.value === 'finish') // 是否为执行退料模式
const isHeaderReadonly = computed(() =>
  ['stock', 'detail', 'finish'].includes(formType.value)
) // 表头是否只读
const dialogTitle = computed(() => {
  const titles = {
    create: '新增生产退料单',
    update: '编辑生产退料单',
    stock: '入库上架',
    finish: '执行退料',
    detail: '生产退料单详情'
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
  type: undefined,
  returnDate: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '退料单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '退料单名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '退料类型不能为空', trigger: 'change' }],
  workOrderId: [{ required: true, message: '生产工单不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成退料单编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.WM_RETURN_ISSUE_CODE
  )
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
      formData.value = await WmReturnIssueApi.getReturnIssue(id)
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
    const data = formData.value as unknown as WmReturnIssueVO
    if (formType.value === 'create') {
      const res = await WmReturnIssueApi.createReturnIssue(data)
      message.success('新增成功')
      // 创建成功后，更新表单数据和状态为编辑模式
      formData.value.id = res
      formData.value.status = MesWmReturnIssueStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await WmReturnIssueApi.updateReturnIssue(data)
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
    await message.confirm('确认提交该退料单？【提交后将不能修改】')
    formLoading.value = true
    // 1. 表单有修改时，先保存
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as unknown as WmReturnIssueVO
      await WmReturnIssueApi.updateReturnIssue(data)
    }
    // 2. 提交退料单
    await WmReturnIssueApi.submitReturnIssue(formData.value.id!)
    message.success('提交成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 入库上架 */
const handleStock = async () => {
  try {
    formLoading.value = true
    await WmReturnIssueApi.stockReturnIssue(formData.value.id!)
    message.success('入库上架成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 执行退料 */
const handleFinish = async () => {
  try {
    await message.confirm('确认完成该退料单并执行入库吗？')
    formLoading.value = true
    await WmReturnIssueApi.finishReturnIssue(formData.value.id!)
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
    type: undefined,
    returnDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
