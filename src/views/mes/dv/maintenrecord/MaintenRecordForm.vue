<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="设备" prop="machineryId">
            <DvMachinerySelect v-model="formData.machineryId" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="保养计划" prop="planId">
            <DvCheckPlanSelect
              v-model="formData.planId"
              :type="MesDvSubjectTypeEnum.MAINTENANCE"
              :status="MesDvCheckPlanStatusEnum.ENABLED"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="保养人" prop="userId">
            <UserSelectV2 v-model="formData.userId" placeholder="请选择保养人" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="保养时间" prop="maintenTime">
            <el-date-picker
              v-model="formData.maintenTime"
              type="datetime"
              value-format="x"
              placeholder="选择保养时间"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template v-if="formData.id">
      <el-divider content-position="center">保养项目</el-divider>
      <MaintenRecordLineList :record-id="formData.id" :disabled="isDetail" />
    </template>
    <template #footer>
      <el-button v-if="isEditable" :disabled="formLoading" type="primary" @click="submitForm">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.status === MesDvMaintenRecordStatusEnum.PREPARE"
        :disabled="formLoading"
        type="warning"
        @click="handleSubmit"
      >
        提 交
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DvMaintenRecordApi } from '@/api/mes/dv/maintenrecord'
import DvMachinerySelect from '@/views/mes/dv/machinery/components/DvMachinerySelect.vue'
import DvCheckPlanSelect from '@/views/mes/dv/checkplan/components/DvCheckPlanSelect.vue'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import MaintenRecordLineList from './MaintenRecordLineList.vue'
import { useUserStore } from '@/store/modules/user'
import {
  MesDvMaintenRecordStatusEnum,
  MesDvSubjectTypeEnum,
  MesDvCheckPlanStatusEnum
} from '@/views/mes/utils/constants'

defineOptions({ name: 'MaintenRecordForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const userStore = useUserStore()

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isDetail = computed(() => formType.value === 'detail') // 是否为详情模式
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增保养记录',
    update: '编辑保养记录',
    detail: '保养记录详情'
  }
  return titles[formType.value] || formType.value
})
const formData = ref({
  id: undefined as number | undefined,
  planId: undefined,
  machineryId: undefined,
  maintenTime: undefined,
  userId: undefined,
  status: undefined as number | undefined,
  remark: ''
})
const formRules = reactive({
  machineryId: [{ required: true, message: '设备不能为空', trigger: 'blur' }],
  maintenTime: [{ required: true, message: '保养时间不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/详情时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await DvMaintenRecordApi.getMaintenRecord(id)
    } finally {
      formLoading.value = false
    }
  }
  // 新增时，自动填充当前登录用户
  if (type === 'create') {
    formData.value.userId = userStore.getUser.id
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
      const res = await DvMaintenRecordApi.createMaintenRecord(data)
      message.success(t('common.createSuccess'))
      // 创建成功后，更新表单数据和状态为编辑模式
      formData.value.id = res
      formData.value.status = MesDvMaintenRecordStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await DvMaintenRecordApi.updateMaintenRecord(data)
      message.success(t('common.updateSuccess'))
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
    await message.confirm('确认提交该保养记录？【提交后将不能修改】')
    formLoading.value = true
    // 1. 表单有修改时，先保存
    if (JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as any
      await DvMaintenRecordApi.updateMaintenRecord(data)
    }
    // 2. 提交保养记录
    await DvMaintenRecordApi.submitMaintenRecord(formData.value.id!)
    message.success('提交成功')
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
    planId: undefined,
    machineryId: undefined,
    maintenTime: undefined,
    userId: undefined,
    status: undefined,
    remark: ''
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
