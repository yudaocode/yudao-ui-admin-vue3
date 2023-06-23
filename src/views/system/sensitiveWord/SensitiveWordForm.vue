<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="敏感词" prop="name">
        <el-input v-model="formData.name" placeholder="请输入敏感词" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
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
      <el-form-item label="备注" prop="description">
        <el-input v-model="formData.description" placeholder="请输入内容" />
      </el-form-item>
      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="formData.tags"
          allow-create
          filterable
          multiple
          placeholder="请选择文章标签"
          style="width: 380px"
        >
          <el-option v-for="tag in tagList" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as SensitiveWordApi from '@/api/system/sensitiveWord'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'SystemSensitiveWordForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: '',
  status: CommonStatusEnum.ENABLE,
  description: '',
  tags: []
})
const formRules = reactive({
  name: [{ required: true, message: '敏感词不能为空', trigger: 'blur' }],
  tags: [{ required: true, message: '标签不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const tagList = ref([]) // 标签数组

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
      formData.value = await SensitiveWordApi.getSensitiveWord(id)
    } finally {
      formLoading.value = false
    }
  }
  // 获得 Tag 标签列表
  tagList.value = await SensitiveWordApi.getSensitiveWordTagList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as SensitiveWordApi.SensitiveWordVO
    if (formType.value === 'create') {
      await SensitiveWordApi.createSensitiveWord(data)
      message.success(t('common.createSuccess'))
    } else {
      await SensitiveWordApi.updateSensitiveWord(data)
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
    name: '',
    status: CommonStatusEnum.ENABLE,
    description: '',
    tags: []
  }
  formRef.value?.resetFields()
}
</script>
