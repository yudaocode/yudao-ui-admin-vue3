<!-- TODO @AI：参考别的模块，合并到 List.vue 里； -->
<!-- TODO @AI：参考 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/pro/route -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="项目" prop="subjectId">
        <el-select
          v-model="formData.subjectId"
          filterable
          remote
          reserve-keyword
          placeholder="请输入项目名称搜索"
          :remote-method="getSubjectOptions"
        >
          <el-option
            v-for="item in subjectOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="保养结果" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_MAINTEN_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="异常描述" prop="result">
        <el-input v-model="formData.result" type="textarea" placeholder="请输入异常描述" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitForm" :disabled="formLoading">确 定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DvMaintenRecordLineApi } from '@/api/mes/dv/maintenrecord/maintenRecordLine'
import { DvSubjectApi } from '@/api/mes/dv/subject'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'MaintenRecordLineForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  recordId: undefined,
  subjectId: undefined,
  status: 1,
  result: '',
  remark: ''
})
const formRules = reactive({
  subjectId: [{ required: true, message: '项目不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '保养结果不能为空', trigger: 'blur' }]
})
const formRef = ref()

const subjectOptions = ref<any[]>([])

/** 打开弹窗 */
const open = async (type: string, id?: number, recordId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.recordId = recordId

  if (id) {
    formLoading.value = true
    try {
      formData.value = await DvMaintenRecordLineApi.getMaintenRecordLine(id)
      // 加载项目选项以显示名称
      if (formData.value.subjectId) {
        const subject = await DvSubjectApi.getSubject(formData.value.subjectId)
        if (subject) subjectOptions.value = [subject]
      }
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
    const data = formData.value as any
    if (formType.value === 'create') {
      await DvMaintenRecordLineApi.createMaintenRecordLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await DvMaintenRecordLineApi.updateMaintenRecordLine(data)
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
    recordId: undefined,
    subjectId: undefined,
    status: 1,
    result: '',
    remark: ''
  }
  formRef.value?.resetFields()
}

/** 获取项目选项 */
const getSubjectOptions = async (query: string) => {
  try {
    const data = await DvSubjectApi.getSubjectPage({ name: query, pageNo: 1, pageSize: 20 })
    subjectOptions.value = data.list
  } catch {}
}
</script>
