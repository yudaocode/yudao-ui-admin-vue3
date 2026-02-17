<!-- TODO @AI：是不是不用这个？？？ -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="排班计划" prop="planId">
        <el-input-number
          v-model="formData.planId"
          placeholder="请输入排班计划编号"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="显示顺序" prop="sort">
        <el-input-number
          v-model="formData.sort"
          :min="1"
          controls-position="right"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="班次名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入班次名称" />
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-input v-model="formData.startTime" placeholder="请输入开始时间（如 08:00）" />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-input v-model="formData.endTime" placeholder="请输入结束时间（如 17:00）" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { CalShiftApi, CalShiftVO } from '@/api/mes/cal/shift'

defineOptions({ name: 'CalShiftForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  planId: undefined,
  sort: 1,
  name: undefined,
  startTime: undefined,
  endTime: undefined,
  remark: undefined
})
const formRules = reactive({
  planId: [{ required: true, message: '排班计划不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '显示顺序不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '班次名称不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'blur' }],
  endTime: [{ required: true, message: '结束时间不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await CalShiftApi.getShift(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as CalShiftVO
    if (formType.value === 'create') {
      await CalShiftApi.createShift(data)
      message.success(t('common.createSuccess'))
    } else {
      await CalShiftApi.updateShift(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    planId: undefined,
    sort: 1,
    name: undefined,
    startTime: undefined,
    endTime: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
