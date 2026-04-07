<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="维修单编码" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入维修单编码"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode" :disabled="isHeaderReadonly"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="维修单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入维修单名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="设备" prop="machineryId">
            <DvMachinerySelect v-model="formData.machineryId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="报修日期" prop="requireDate">
            <el-date-picker
              v-model="formData.requireDate"
              type="datetime"
              value-format="x"
              placeholder="选择报修日期"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="showFinishFields">
          <el-form-item label="维修完成日期" prop="finishDate">
            <el-date-picker
              v-model="formData.finishDate"
              type="datetime"
              value-format="x"
              placeholder="选择完成日期"
              :disabled="!isConfirm"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="showConfirmFields">
          <el-form-item label="维修人" prop="acceptedUserId">
            <UserSelectV2 v-model="formData.acceptedUserId" placeholder="请选择维修人" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8" v-if="showDetailFields">
          <el-form-item label="维修结果" prop="result">
            <el-select v-model="formData.result" placeholder="请选择维修结果" clearable disabled>
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_REPAIR_RESULT)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="showDetailFields">
          <el-form-item label="验收日期" prop="confirmDate">
            <el-date-picker
              v-model="formData.confirmDate"
              type="datetime"
              value-format="x"
              placeholder="选择验收日期"
              disabled
            />
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="showDetailFields">
          <el-form-item label="验收人" prop="confirmUserId">
            <UserSelectV2 v-model="formData.confirmUserId" placeholder="请选择验收人" disabled />
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
    <!-- 非新建模式展示维修项目明细 -->
    <template v-if="formData.id">
      <el-divider content-position="center">维修项目明细</el-divider>
      <RepairLineList :repair-id="formData.id" :disabled="isHeaderReadonly" />
    </template>
    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesDvRepairStatusEnum.PREPARE"
        @click="handleSubmit"
        type="warning"
        :disabled="formLoading"
      >
        提 交
      </el-button>
      <el-button v-if="isConfirm" @click="handleConfirm" type="primary" :disabled="formLoading">
        完成维修
      </el-button>
      <el-button
        v-if="isFinish"
        @click="handleFinish(MesDvRepairResultEnum.PASS)"
        type="success"
        :disabled="formLoading"
      >
        验 收 通 过
      </el-button>
      <el-button
        v-if="isFinish"
        @click="handleFinish(MesDvRepairResultEnum.FAIL)"
        type="warning"
        :disabled="formLoading"
      >
        不 通 过
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DvRepairApi } from '@/api/mes/dv/repair'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import DvMachinerySelect from '@/views/mes/dv/machinery/components/DvMachinerySelect.vue'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import RepairLineList from './RepairLineList.vue'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import {
  MesAutoCodeRuleCode,
  MesDvRepairStatusEnum,
  MesDvRepairResultEnum
} from '@/views/mes/utils/constants'

defineOptions({ name: 'RepairForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单类型：create / update / confirm / finish / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isConfirm = computed(() => formType.value === 'confirm') // 是否为完成维修模式
const isFinish = computed(() => formType.value === 'finish') // 是否为验收模式
const isDetail = computed(() => formType.value === 'detail') // 是否为详情模式（仅 detail 全局只读）
const isHeaderReadonly = computed(() => ['confirm', 'finish', 'detail'].includes(formType.value)) // 是否只读
const showFinishFields = computed(() => {
  const status = formData.value.status
  if (status == null) {
    return false
  }
  return status >= MesDvRepairStatusEnum.CONFIRMED
}) // 维修中(1)及之后显示
const showConfirmFields = computed(() => {
  const status = formData.value.status
  if (status == null) {
    return false
  }
  return status >= MesDvRepairStatusEnum.APPROVING
}) // 待验收(2)及之后显示
const showDetailFields = computed(() => {
  const status = formData.value.status
  if (status == null) {
    return false
  }
  return status >= MesDvRepairStatusEnum.FINISHED
}) // 已确认(4)及之后显示
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增维修工单',
    update: '编辑维修工单',
    confirm: '完成维修',
    finish: '验收',
    detail: '维修工单详情'
  }
  return titles[formType.value] || formType.value
})
const formData = ref({
  id: undefined as number | undefined,
  code: '',
  name: '',
  machineryId: undefined,
  requireDate: undefined,
  finishDate: undefined,
  confirmDate: undefined,
  result: undefined,
  acceptedUserId: undefined,
  confirmUserId: undefined,
  status: undefined as number | undefined,
  remark: ''
})
const formRules = reactive({
  code: [{ required: true, message: '维修单编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '维修单名称不能为空', trigger: 'blur' }],
  machineryId: [{ required: true, message: '设备不能为空', trigger: 'blur' }],
  requireDate: [{ required: true, message: '报修日期不能为空', trigger: 'blur' }],
  finishDate: [{ required: true, message: '维修完成日期不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成维修单编码 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(MesAutoCodeRuleCode.DV_REPAIR_CODE)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/完成维修/验收/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await DvRepairApi.getRepair(id)
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
    const data = formData.value as any
    if (formType.value === 'create') {
      const res = await DvRepairApi.createRepair(data)
      message.success('新增成功')
      // 创建成功后，更新表单数据和状态为编辑模式
      formData.value.id = res
      formData.value.status = MesDvRepairStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await DvRepairApi.updateRepair(data)
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

/** 提交操作：表单修改过则先保存，再提交（草稿→维修中） */
const handleSubmit = async () => {
  // 校验表单
  await formRef.value.validate()
  try {
    await message.confirm('确认提交该维修工单？【提交后将不能修改】')
    formLoading.value = true
    // 1. 表单有修改时，先保存
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as any
      await DvRepairApi.updateRepair(data)
    }
    // 2. 提交维修工单
    await DvRepairApi.submitRepair(formData.value.id!)
    message.success('提交成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 确认维修完成（维修中→待验收） */
const handleConfirm = async () => {
  await formRef.value.validate()
  try {
    await message.confirm('确认完成维修？完成后将进入待验收状态')
    formLoading.value = true
    await DvRepairApi.confirmRepair({
      id: formData.value.id!,
      finishDate: formData.value.finishDate
    })
    message.success('操作成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 完成验收（待验收→已确认） */
const handleFinish = async (result: number) => {
  const label = result === MesDvRepairResultEnum.PASS ? '通过' : '不通过'
  try {
    await message.confirm(`确认验收${label}该维修工单？`)
    formLoading.value = true
    await DvRepairApi.finishRepair(formData.value.id!, result)
    message.success(`验收${label}`)
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
    code: '',
    name: '',
    machineryId: undefined,
    requireDate: undefined,
    finishDate: undefined,
    confirmDate: undefined,
    result: undefined,
    acceptedUserId: undefined,
    confirmUserId: undefined,
    status: undefined,
    remark: ''
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
