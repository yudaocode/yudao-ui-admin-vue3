<template>
  <Dialog v-model="dialogVisible" title="修改考勤记录">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="员工">
        <el-input :model-value="formData.userName" disabled />
      </el-form-item>
      <el-form-item label="考勤类型">
        <el-input
          :model-value="getDictLabel(DICT_TYPE.OA_ATTENDANCE_TYPE, formData.type)"
          disabled
        />
      </el-form-item>
      <el-form-item label="考勤时间">
        <el-input :model-value="formatDate(formData.attendanceTime)" disabled />
      </el-form-item>
      <el-form-item label="考勤状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择考勤状态" class="!w-1/1">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import { OA_ATTENDANCE_STATUS, OA_ATTENDANCE_TYPE } from '@/views/oa/utils/constants'
import * as AttendanceApi from '@/api/oa/attendance'
import type { FormRules } from 'element-plus'

defineOptions({ name: 'OaAttendanceForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref<AttendanceApi.OaAttendanceVO>({
  id: 0,
  userId: 0,
  type: OA_ATTENDANCE_TYPE.CLOCK_IN,
  status: OA_ATTENDANCE_STATUS.NORMAL,
  attendanceTime: '',
  createTime: ''
})
const formRules = reactive<FormRules>({
  status: [{ required: true, message: '考勤状态不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 根据考勤类型过滤可选状态 */
const statusOptions = computed(() => {
  const allowedStatusValues: number[] =
    formData.value.type === OA_ATTENDANCE_TYPE.CLOCK_IN
      ? [OA_ATTENDANCE_STATUS.NORMAL, OA_ATTENDANCE_STATUS.LATE]
      : [OA_ATTENDANCE_STATUS.NORMAL, OA_ATTENDANCE_STATUS.EARLY]
  return getIntDictOptions(DICT_TYPE.OA_ATTENDANCE_STATUS).filter((item) =>
    allowedStatusValues.includes(item.value)
  )
})

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  resetForm()
  // 修改时，设置数据
  formLoading.value = true
  try {
    formData.value = await AttendanceApi.getAttendance(id)
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    await AttendanceApi.updateAttendance(formData.value)
    message.success('修改成功')
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: 0,
    userId: 0,
    type: OA_ATTENDANCE_TYPE.CLOCK_IN,
    status: OA_ATTENDANCE_STATUS.NORMAL,
    attendanceTime: '',
    createTime: ''
  }
  formRef.value?.resetFields()
}
</script>
