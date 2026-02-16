<!-- MES 假期设置表单 -->
<template>
  <Dialog title="假期设置" v-model="dialogVisible" width="400px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="日期" prop="day">
        <el-input :model-value="dayDisplay" readonly />
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_HOLIDAY_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { CalHolidayApi } from '@/api/mes/cal/holiday'
import { formatDate } from '@/utils/formatTime'
import { HolidayType } from '@/views/mes/utils/constants'

defineOptions({ name: 'HolidayForm' })

const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const dayDisplay = ref('') // 日期展示文本（yyyy-MM-dd）
const formData = ref({
  day: undefined as number | undefined, // 提交给后端的时间戳
  type: HolidayType.WORKDAY as number, // 默认工作日
  remark: '' as string
})
const formRules = reactive({
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (day: string) => {
  dialogVisible.value = true
  resetForm()
  dayDisplay.value = day
  formData.value.day = new Date(day + ' 00:00:00').getTime()
  formLoading.value = true
  // 修改时，设置数据
  try {
    const data = await CalHolidayApi.getHolidayByDay(formatDate(formData.value.day as any))
    if (data) {
      formData.value.type = data.type ?? HolidayType.WORKDAY
      formData.value.remark = data.remark ?? ''
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    await CalHolidayApi.saveHoliday(formData.value as any)
    message.success('设置成功')
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
    day: undefined,
    type: HolidayType.WORKDAY,
    remark: ''
  }
  dayDisplay.value = ''
  formRef.value?.resetFields()
}
</script>
