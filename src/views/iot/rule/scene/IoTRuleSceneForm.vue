<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="70%">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="场景名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入场景名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
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
        </el-col>
        <el-col :span="24">
          <el-form-item label="场景描述" prop="description">
            <el-input v-model="formData.description" type="textarea" placeholder="请输入场景描述" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-divider content-position="left">触发器配置</el-divider>
          <device-listener v-model="formData.triggers" />
        </el-col>
        <el-col :span="24">
          <el-divider content-position="left">执行动作配置</el-divider>
          <el-form-item label="执行器数组" prop="actionConfigs">
            <el-input v-model="formData.actions" placeholder="请输入执行器数组" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { RuleSceneApi, RuleSceneVO } from '@/api/iot/rule/scene'
import DeviceListener from './components/DeviceListener.vue'

/** IoT 规则场景（场景联动） 表单 */
defineOptions({ name: 'RuleSceneForm' })

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
  triggers: undefined,
  actions: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '场景名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '场景状态不能为空', trigger: 'blur' }],
  triggers: [{ required: true, message: '触发器数组不能为空', trigger: 'blur' }],
  actions: [{ required: true, message: '执行器数组不能为空', trigger: 'blur' }]
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
      formData.value = await RuleSceneApi.getRuleScene(id)
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
    const data = formData.value as unknown as RuleSceneVO
    if (formType.value === 'create') {
      await RuleSceneApi.createRuleScene(data)
      message.success(t('common.createSuccess'))
    } else {
      await RuleSceneApi.updateRuleScene(data)
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
    triggers: undefined,
    actions: undefined
  }
  formRef.value?.resetFields()
}
</script>
