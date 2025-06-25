<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="870">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="规则名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入规则名称" />
      </el-form-item>
      <el-form-item label="规则描述" prop="description">
        <el-input v-model="formData.description" height="150px" type="textarea" />
      </el-form-item>
      <el-form-item label="规则状态" prop="status">
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
      <el-form-item label="数据目的" prop="sinkIds">
        <el-select
          v-model="formData.sinkIds"
          placeholder="请选择数据目的"
          multiple
          clearable
          class="w-1/1"
        >
          <el-option
            v-for="sink in dataSinkList"
            :key="sink.id"
            :label="sink.name"
            :value="sink.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="数据源" prop="sourceConfigs">
        <SourceConfigForm ref="sourceConfigRef" />
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
import { DataSinkApi } from '@/api/iot/rule/data/sink'
import { CommonStatusEnum } from '@/utils/constants'
import SourceConfigForm from './components/SourceConfigForm.vue'

/** IoT 数据流转规则的表单 */
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
  status: CommonStatusEnum.ENABLE,
  sourceConfigs: [],
  sinkIds: []
})
const formRules = reactive({
  name: [{ required: true, message: '规则名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '规则状态不能为空', trigger: 'blur' }],
  sourceConfigs: [{ required: true, message: '数据源配置数组不能为空', trigger: 'blur' }],
  sinkIds: [{ required: true, message: '数据目的编号数组不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const dataSinkList = ref<any[]>([]) // 数据目的列表
const sourceConfigRef = ref() // 数据源配置组件引用

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
      const data = await DataRuleApi.getDataRule(id)
      formData.value = data
      // 设置数据源配置
      nextTick(() => {
        sourceConfigRef.value?.setData(data.sourceConfigs || [])
      })
    } finally {
      formLoading.value = false
    }
  }

  // 加载数据目的列表
  dataSinkList.value = await DataSinkApi.getDataSinkSimpleList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验数据源配置
  await sourceConfigRef.value?.validate()
  formData.value.sourceConfigs = sourceConfigRef.value?.getData() || []
  // 校验表单
  await formRef.value.validate()

  // 提交请求
  formLoading.value = true
  try {
    const data = { ...formData.value } as unknown as DataRule
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
const resetForm = async () => {
  formData.value = {
    id: undefined,
    name: undefined,
    description: undefined,
    status: CommonStatusEnum.ENABLE,
    sourceConfigs: [],
    sinkIds: []
  }
  formRef.value?.resetFields()
  // 重置数据源配置
  await nextTick()
  sourceConfigRef.value?.setData([])
}
</script>
