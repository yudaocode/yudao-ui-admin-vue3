<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="560px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="90px"
      v-loading="formLoading"
    >
      <el-form-item label="模型名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入模型名称" maxlength="50" />
      </el-form-item>
      <el-form-item label="模型标识" prop="model">
        <el-input
          v-model="formData.model"
          placeholder="请输入模型标识，如 deepseek-chat"
          maxlength="100"
        />
      </el-form-item>
      <el-form-item label="模型类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择模型类型" class="!w-full">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI1_MODEL_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
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
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { ModelApi, Model } from '@/api/ai1/model'
import { Ai1ModelTypeEnum } from '@/views/ai1/utils/constants'

/** AI1 模型表单 */
defineOptions({ name: 'Ai1ModelForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const providerId = ref<number>() // 模型供应商编号
const formData = ref({
  id: undefined as number | undefined,
  name: undefined as string | undefined,
  model: undefined as string | undefined,
  type: Ai1ModelTypeEnum.CHAT as number,
  status: CommonStatusEnum.ENABLE as number
})
const formRules = reactive({
  name: [{ required: true, message: '模型名称不能为空', trigger: 'blur' }],
  model: [{ required: true, message: '模型标识不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '模型类型不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, provider: number, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  providerId.value = provider
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ModelApi.getModel(id)
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
    const data = { ...formData.value, providerId: providerId.value } as unknown as Model
    if (formType.value === 'create') {
      await ModelApi.createModel(data)
      message.success(t('common.createSuccess'))
    } else {
      await ModelApi.updateModel(data)
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
    model: undefined,
    type: Ai1ModelTypeEnum.CHAT,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>
