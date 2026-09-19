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
      <el-form-item label="车辆" prop="vehicleId">
        <OaVehicleSelect
          v-model="formData.vehicleId"
          :selected-vehicle="{ id: formData.vehicleId, no: formData.vehicleNo }"
          @change="handleVehicleSelected"
        />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="预计出车时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择出车时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="预计回车时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择回车时间"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="出车地点" prop="startLocation">
            <el-input
              v-model="formData.startLocation"
              placeholder="请输入出车地点"
              maxlength="255"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="预计回车地点" prop="endLocation">
            <el-input v-model="formData.endLocation" placeholder="请输入回车地点" maxlength="255" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="随行人" prop="passenger">
        <el-input v-model="formData.passenger" placeholder="请输入随行人" maxlength="500" />
      </el-form-item>
      <el-form-item label="用车事由" prop="reason">
        <el-input
          v-model="formData.reason"
          type="textarea"
          :rows="3"
          placeholder="请输入用车事由"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="2"
          placeholder="请输入备注"
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
import * as VehicleApplyApi from '@/api/oa/vehicle/apply'
import type { VehicleVO } from '@/api/oa/vehicle'
import OaVehicleSelect from '@/views/oa/vehicle/components/OaVehicleSelect.vue'

defineOptions({ name: 'OaVehicleApplyForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中：修改时加载数据、提交时禁用按钮
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<VehicleApplyApi.VehicleApplyVO>({ fileUrls: [] }) // 表单数据
const formRules = reactive<FormRules>({
  vehicleId: [{ required: true, message: '车辆不能为空', trigger: 'change' }],
  startTime: [{ required: true, message: '预计出车时间不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '预计回车时间不能为空', trigger: 'change' }],
  startLocation: [{ required: true, message: '出车地点不能为空', trigger: 'blur' }],
  endLocation: [{ required: true, message: '预计回车地点不能为空', trigger: 'blur' }],
  reason: [{ required: true, message: '用车事由不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单引用

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formLoading.value = true
  try {
    // 修改时加载原单据及附件
    if (id) {
      formData.value = await VehicleApplyApi.getVehicleApply(id)
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 回填选中的车牌号 */
function handleVehicleSelected(vehicle?: VehicleVO) {
  formData.value.vehicleNo = vehicle?.no
}

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 提交表单 */
async function submitForm() {
  // 1.1 校验表单
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 1.2 校验预计回车时间晚于出车时间
  if (formData.value.startTime! >= formData.value.endTime!) {
    message.warning('预计回车时间必须晚于预计出车时间')
    return
  }
  // 2. 保存草稿，提交审批由列表单独操作
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await VehicleApplyApi.createVehicleApply(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await VehicleApplyApi.updateVehicleApply(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
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
    vehicleId: undefined,
    vehicleNo: undefined,
    startTime: undefined,
    endTime: undefined,
    startLocation: '',
    endLocation: '',
    passenger: '',
    reason: '',
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
