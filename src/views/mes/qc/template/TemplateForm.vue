<!-- MES 质检方案表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <!-- TODO @AI：1 行三个，参考别的模块 -->
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <!-- TODO @AI：生成按钮 -->
      <el-form-item label="方案编号" prop="code">
        <el-input v-model="formData.code" placeholder="请输入方案编号" />
      </el-form-item>
      <el-form-item label="方案名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入方案名称" />
      </el-form-item>
      <el-form-item label="检测种类" prop="typesArr">
        <!-- TODO @AI：select 多选把？或者直接让它占一整行； -->
        <el-checkbox-group v-model="formData.typesArr">
          <el-checkbox
            v-for="dict in getStrDictOptions(DICT_TYPE.MES_QC_TYPE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <!-- TODO @AI：boolean；字典 -->
      <el-form-item label="是否启用" prop="enableFlag">
        <el-radio-group v-model="formData.enableFlag">
          <el-radio label="Y">启用</el-radio>
          <el-radio label="N">停用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
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
import { QcTemplateApi, QcTemplateVO } from '@/api/mes/qc/template'

defineOptions({ name: 'TemplateForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  typesArr: [] as string[], // 前端用数组绑定，提交时 join(',')
  enableFlag: 'Y',
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '方案编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '方案名称不能为空', trigger: 'blur' }],
  typesArr: [{ required: true, message: '检测种类不能为空', trigger: 'change', type: 'array', min: 1 }],
  enableFlag: [{ required: true, message: '是否启用不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const data = await QcTemplateApi.getTemplate(id)
      // TODO @AI：后端直接返回数组，前端就不用 split 了；
      formData.value = {
        ...data,
        typesArr: data.types ? data.types.split(',') : []
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
    // TODO @AI：不用这么 join，后端可以接受数组的；
    const data = {
      ...formData.value,
      types: formData.value.typesArr.join(',')
    } as unknown as QcTemplateVO
    if (formType.value === 'create') {
      await QcTemplateApi.createTemplate(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcTemplateApi.updateTemplate(data)
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
    code: undefined,
    name: undefined,
    typesArr: [],
    enableFlag: 'Y',
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
