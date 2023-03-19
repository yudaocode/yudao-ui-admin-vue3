<template>
  <Dialog :title="modelTitle" v-model="modelVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
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
          multiple
          filterable
          allow-create
          placeholder="请选择文章标签"
          style="width: 380px"
        >
          <el-option v-for="tag in tags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="modelVisible = false">取 消</el-button>
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as SensitiveWordApi from '@/api/system/sensitiveWord'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const tags = ref([])
const formData = ref({
  id: undefined,
  name: '',
  status: true,
  description: '',
  tags: []
})
const formRules = reactive({
  name: [{ required: true, message: '敏感词不能为空', trigger: 'blur' }],
  tags: [{ required: true, message: '标签不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const openModal = async (type: string, id?: number) => {
  modelVisible.value = true
  modelTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await SensitiveWordApi.getSensitiveWordApi(id)
      console.log(formData.value)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗

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
      await SensitiveWordApi.createSensitiveWordApi(data)
      message.success(t('common.createSuccess'))
    } else {
      await SensitiveWordApi.updateSensitiveWordApi(data)
      message.success(t('common.updateSuccess'))
    }
    modelVisible.value = false
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
    status: true,
    description: '',
    tags: []
  }
  formRef.value?.resetFields()
}
</script>
