<template>
  <Dialog v-model="dialogVisible" title="检测敏感词">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="文本" prop="text">
        <el-input v-model="formData.text" placeholder="请输入测试文本" type="textarea" />
      </el-form-item>
      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="formData.tags"
          allow-create
          filterable
          multiple
          placeholder="请选择标签"
          style="width: 380px"
        >
          <el-option v-for="tag in tagList" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">检 测</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as SensitiveWordApi from '@/api/system/sensitiveWord'

defineOptions({ name: 'SystemSensitiveWordTestForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  text: '',
  tags: []
})
const formRules = reactive({
  text: [{ required: true, message: '测试文本不能为空', trigger: 'blur' }],
  tags: [{ required: true, message: '标签不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const tagList = ref([]) // 标签数组

/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true
  resetForm()
  // 获得 Tag 标签列表
  tagList.value = await SensitiveWordApi.getSensitiveWordTagList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const form = formData.value as unknown as SensitiveWordApi.SensitiveWordTestReqVO
    const data = await SensitiveWordApi.validateText(form)
    if (data.length === 0) {
      message.success('不包含敏感词！')
      return
    }
    message.warning('包含敏感词：' + data.join(', '))
    dialogVisible.value = false
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    text: '',
    tags: []
  }
  formRef.value?.resetFields()
}
</script>
