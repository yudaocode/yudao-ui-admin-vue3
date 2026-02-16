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
      <el-form-item label="日期" prop="theDay">
        <el-input v-model="formData.theDayDisplay" readonly />
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio
            v-for="dict in getStrDictOptions(DICT_TYPE.MES_CAL_HOLIDAY_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { CalHolidayApi } from '@/api/mes/cal/holiday'

defineOptions({ name: 'HolidayForm' })

const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formData = ref({
  theDay: '' as string, // 实际提交的日期值，格式 yyyy-MM-dd 00:00:00
  theDayDisplay: '' as string, // 展示用
  type: 'HOLIDAY' as string
})
const formRules = reactive({
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = (day: string) => {
  dialogVisible.value = true
  resetForm()
  formData.value.theDayDisplay = day
  // 后端 theDay 为 datetime，传入 yyyy-MM-dd 00:00:00 格式
  // TODO @芋艿：可能还要考虑下，到底怎么处理好；
  formData.value.theDay = day + ' 00:00:00'
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    await CalHolidayApi.createHoliday(formData.value as any)
    message.success('设置成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    theDay: '',
    theDayDisplay: '',
    type: 'HOLIDAY'
  }
  formRef.value?.resetFields()
}
</script>
