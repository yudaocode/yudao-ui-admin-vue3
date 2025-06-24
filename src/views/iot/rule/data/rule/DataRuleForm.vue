<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="场景名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入场景名称" />
      </el-form-item>
      <el-form-item label="场景描述" prop="description">
        <Editor v-model="formData.description" height="150px" />
      </el-form-item>
      <el-form-item label="场景状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="数据源配置数组" prop="sourceConfigs">
        <el-input v-model="formData.sourceConfigs" placeholder="请输入数据源配置数组" />
      </el-form-item>
      <el-form-item label="数据目的编号数组" prop="sinkIds">
        <el-input v-model="formData.sinkIds" placeholder="请输入数据目的编号数组" />
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
import { DataRuleApi, DataRule } from '@/api/iot/rule/data/rule'

/** IoT 数据流转规则 表单 */
defineOptions({ name: 'DataRuleForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  description: undefined,
  status: undefined,
  sourceConfigs: undefined,
  sinkIds: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '场景名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '场景状态不能为空', trigger: 'blur' }],
  sourceConfigs: [{ required: true, message: '数据源配置数组不能为空', trigger: 'blur' }],
  sinkIds: [{ required: true, message: '数据目的编号数组不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

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
      formData.value = await DataRuleApi.getDataRule(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as DataRule
    if (formType.value === 'create') {
      await DataRuleApi.createDataRule(data)
      message.success(t('common.createSuccess'))
    } else {
      await DataRuleApi.updateDataRule(data)
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
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: undefined,
    description: undefined,
    status: undefined,
    sourceConfigs: undefined,
    sinkIds: undefined
  }
  formRef.value?.resetFields()
}
</script>
