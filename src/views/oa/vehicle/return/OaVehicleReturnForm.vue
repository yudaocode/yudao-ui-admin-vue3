<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="150px"
    >
      <el-form-item label="申请单号">
        <el-input v-model="formData.no" placeholder="保存后自动生成" disabled />
      </el-form-item>
      <el-form-item label="用车申请" prop="applyId">
        <OaVehicleApplySelect
          v-model="formData.applyId"
          :status="BpmProcessInstanceStatus.APPROVE"
          :return-status="OA_VEHICLE_RETURN_STATUS.PENDING_RETURN"
          class="!w-full"
          @change="handleApplyChange"
        />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="实际出车时间" prop="actualStartTime">
            <el-date-picker
              v-model="formData.actualStartTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择实际出车时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="实际出车地点" prop="startLocation">
            <el-input
              v-model="formData.startLocation"
              placeholder="请输入实际出车地点"
              maxlength="255"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="用车事由" prop="reason">
        <el-input
          v-model="formData.reason"
          type="textarea"
          placeholder="请输入用车事由"
          maxlength="500"
        />
      </el-form-item>
      <el-form-item label="随行人" prop="passenger">
        <el-input v-model="formData.passenger" placeholder="请输入随行人" maxlength="500" />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="实际回车时间" prop="actualReturnTime">
            <el-date-picker
              v-model="formData.actualReturnTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择实际回车时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="实际回车地点" prop="returnLocation">
            <el-input
              v-model="formData.returnLocation"
              placeholder="请输入实际回车地点"
              maxlength="255"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="还车说明" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="2"
          placeholder="请输入还车说明"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="附件" prop="fileUrls">
        <UploadFile v-model="formData.fileUrls" :limit="5" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { FormRules } from 'element-plus'
import * as VehicleReturnApi from '@/api/oa/vehicle/return'
import * as VehicleApplyApi from '@/api/oa/vehicle/apply'
import { formatDate } from '@/utils/formatTime'
import OaVehicleApplySelect from '../apply/components/OaVehicleApplySelect.vue'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import { OA_VEHICLE_RETURN_STATUS } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaVehicleReturnForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中：修改时加载数据、提交时禁用按钮
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<VehicleReturnApi.VehicleReturnVO>({
  id: undefined,
  no: '',
  applyId: undefined,
  actualStartTime: undefined,
  startLocation: '',
  reason: '',
  passenger: '',
  actualReturnTime: undefined,
  returnLocation: '',
  remark: '',
  fileUrls: []
})
const formRules = reactive<FormRules>({
  applyId: [{ required: true, message: '用车申请不能为空', trigger: 'change' }],
  actualStartTime: [{ required: true, message: '实际出车时间不能为空', trigger: 'change' }],
  startLocation: [{ required: true, message: '实际出车地点不能为空', trigger: 'blur' }],
  reason: [{ required: true, message: '用车事由不能为空', trigger: 'blur' }],
  actualReturnTime: [{ required: true, message: '实际回车时间不能为空', trigger: 'change' }],
  returnLocation: [{ required: true, message: '实际回车地点不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
async function open(type: string, id?: number, applyId?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await VehicleReturnApi.getVehicleReturn(id)
    } finally {
      formLoading.value = false
    }
  } else if (applyId) {
    // 从用车申请发起还车时，回填关联申请
    formData.value.applyId = applyId
    handleApplyChange(await VehicleApplyApi.getVehicleApply(applyId))
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 切换申请时带入计划值，还车人可按实际行程修改 */
function handleApplyChange(apply?: VehicleApplyApi.VehicleApplyVO) {
  formData.value.actualStartTime = apply?.startTime ? formatDate(apply.startTime) : undefined
  formData.value.startLocation = apply?.startLocation || ''
  formData.value.reason = apply?.reason || ''
  formData.value.passenger = apply?.passenger || ''
}

/** 提交表单 */
async function submitForm() {
  // 校验表单
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await VehicleReturnApi.createVehicleReturn(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await VehicleReturnApi.updateVehicleReturn(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = {
    fileUrls: [],
    id: undefined,
    no: '',
    applyId: undefined,
    actualStartTime: undefined,
    startLocation: '',
    reason: '',
    passenger: '',
    actualReturnTime: undefined,
    returnLocation: '',
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
