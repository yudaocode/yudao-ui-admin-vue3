<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="配置名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入配置名称" />
      </el-form-item>
      <el-form-item label="配置描述" prop="description">
        <Editor v-model="formData.description" height="150px" />
      </el-form-item>
      <el-form-item label="告警级别" prop="level">
        <el-input v-model="formData.level" placeholder="请输入告警级别" />
      </el-form-item>
      <el-form-item label="配置状态" prop="status">
        <el-select v-model="formData.status">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关联的场景联动规则编号数组" prop="sceneRuleIds">
        <el-input v-model="formData.sceneRuleIds" placeholder="请输入关联的场景联动规则编号数组" />
      </el-form-item>
      <el-form-item label="接收的用户编号数组" prop="receiveUserIds">
        <el-input v-model="formData.receiveUserIds" placeholder="请输入接收的用户编号数组" />
      </el-form-item>
      <el-form-item label="接收的类型数组" prop="receiveTypes">
        <el-input v-model="formData.receiveTypes" placeholder="请输入接收的类型数组" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { AlertConfigApi, AlertConfig } from '@/api/iot/alert/config'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

/** IoT 告警配置 表单 */
defineOptions({ name: 'AlertConfigForm' })

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
  level: undefined,
  status: undefined,
  sceneRuleIds: undefined,
  receiveUserIds: undefined,
  receiveTypes: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '配置名称不能为空', trigger: 'blur' }],
  level: [{ required: true, message: '告警级别不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '配置状态不能为空', trigger: 'blur' }]
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
      formData.value = await AlertConfigApi.getAlertConfig(id)
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
    const data = formData.value as unknown as AlertConfig
    if (formType.value === 'create') {
      await AlertConfigApi.createAlertConfig(data)
      message.success(t('common.createSuccess'))
    } else {
      await AlertConfigApi.updateAlertConfig(data)
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
    level: undefined,
    status: undefined,
    sceneRuleIds: undefined,
    receiveUserIds: undefined,
    receiveTypes: undefined
  }
  formRef.value?.resetFields()
}
</script>
