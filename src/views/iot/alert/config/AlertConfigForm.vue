<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      v-loading="formLoading"
    >
      <el-form-item label="配置名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入配置名称" />
      </el-form-item>
      <el-form-item label="配置描述" prop="description">
        <el-input v-model="formData.description" placeholder="请输入配置描述" />
      </el-form-item>
      <el-form-item label="告警级别" prop="level">
        <el-select v-model="formData.level" placeholder="请选择告警级别">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_ALERT_LEVEL)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
      <el-form-item label="关联场景联动规则" prop="sceneRuleIds">
        <el-select
          v-model="formData.sceneRuleIds"
          multiple
          placeholder="请选择关联的场景联动规则"
          class="w-full"
        >
          <el-option
            v-for="scene in sceneRuleOptions"
            :key="scene.id"
            :label="scene.name"
            :value="scene.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="接收的用户" prop="receiveUserIds">
        <el-select
          v-model="formData.receiveUserIds"
          multiple
          placeholder="请选择接收的用户"
          class="w-full"
        >
          <el-option
            v-for="user in userOptions"
            :key="user.id"
            :label="user.nickname"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="接收类型" prop="receiveTypes">
        <el-select
          v-model="formData.receiveTypes"
          multiple
          placeholder="请选择接收类型"
          class="w-full"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_ALERT_RECEIVE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
import { CommonStatusEnum } from '@/utils/constants'
import { RuleSceneApi } from '@/api/iot/rule/scene'
import * as UserApi from '@/api/system/user'

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
  status: CommonStatusEnum.ENABLE,
  sceneRuleIds: [],
  receiveUserIds: [],
  receiveTypes: []
})
const formRules = reactive({
  name: [{ required: true, message: '配置名称不能为空', trigger: 'blur' }],
  level: [{ required: true, message: '告警级别不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '配置状态不能为空', trigger: 'blur' }],
  sceneRuleIds: [{ required: true, message: '关联场景联动规则不能为空', trigger: 'blur' }],
  receiveUserIds: [{ required: true, message: '接收用户不能为空', trigger: 'blur' }],
  receiveTypes: [{ required: true, message: '接收类型不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

// 选项数据
const sceneRuleOptions = ref<any[]>([])
const userOptions = ref<UserApi.UserVO[]>([])

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

  // 加载选项数据
  await loadOptions()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 加载选项数据 */
const loadOptions = async () => {
  try {
    // 加载场景联动规则选项
    sceneRuleOptions.value = await RuleSceneApi.getSimpleRuleSceneList()
    // 加载用户选项
    userOptions.value = await UserApi.getSimpleUserList()
  } catch (error) {
    console.error('加载选项数据失败:', error)
  }
}

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
    status: CommonStatusEnum.ENABLE,
    sceneRuleIds: [],
    receiveUserIds: [],
    receiveTypes: []
  }
  formRef.value?.resetFields()
}
</script>
