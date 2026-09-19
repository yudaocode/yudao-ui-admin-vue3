<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="480px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="目录名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入目录名称" maxlength="255" />
      </el-form-item>
      <el-form-item label="显示排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" class="!w-full" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import * as NoteCategoryApi from '@/api/oa/note/category'

defineOptions({ name: 'OaNoteCategoryForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<NoteCategoryApi.OaNoteCategoryVO>({
  id: undefined,
  name: '',
  sort: 0
}) // 目录表单数据
const formRules = reactive<FormRules>({
  name: [{ required: true, message: '目录名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }]
}) // 目录表单校验规则

const formRef = ref<FormInstance>() // 表单 Ref

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置目录数据
  if (id !== undefined) {
    formLoading.value = true
    try {
      formData.value = await NoteCategoryApi.getNoteCategory(id)
    } catch (error) {
      dialogVisible.value = false
      throw error
    } finally {
      formLoading.value = false
    }
  }
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value || formLoading.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await NoteCategoryApi.createNoteCategory(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await NoteCategoryApi.updateNoteCategory(formData.value)
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
function resetForm() {
  formData.value = {
    id: undefined,
    name: '',
    sort: 0
  }
  formRef.value?.resetFields()
}
</script>
