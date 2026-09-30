<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="90px"
    >
      <!-- 基础信息 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="笔记类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择笔记类型" class="w-full">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_NOTE_TYPE)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="formData.priority" placeholder="请选择优先级" class="w-full">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_PRIORITY).filter(
                  (item) => item.value <= OA_PRIORITY.IMPORTANT
                )"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="笔记目录" prop="categoryId">
            <OaNoteCategorySelect v-model="formData.categoryId" class="w-full" />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 笔记内容 -->
      <el-form-item label="笔记标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入笔记标题"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="笔记内容" prop="content">
        <Editor ref="editorRef" v-model="formData.content" height="280px" />
      </el-form-item>
      <el-form-item label="附件">
        <UploadFile v-model="formData.fileUrls" />
      </el-form-item>
    </el-form>
    <!-- 表单操作 -->
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import OaNoteCategorySelect from './components/OaNoteCategorySelect.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import type { FormInstance, FormRules } from 'element-plus'
import * as NoteApi from '@/api/oa/note'
import { OA_NOTE_TYPE, OA_PRIORITY } from '../utils/constants'

defineOptions({ name: 'OaNoteForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('create') // 表单的类型：create - 新增；update - 修改
const formData = ref<NoteApi.OaNoteVO>(createDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  type: [{ required: true, message: '笔记类型不能为空', trigger: 'change' }],
  priority: [{ required: true, message: '优先级不能为空', trigger: 'change' }],
  title: [{ required: true, message: '笔记标题不能为空', trigger: 'blur' }],
  content: [{ required: true, validator: validateContent, trigger: 'blur' }]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单 Ref
const editorRef = ref() // 编辑器 Ref

/** 校验笔记正文，空段落标签不算有效内容 */
async function validateContent() {
  const editor = await editorRef.value?.getEditorRef()
  if (!formData.value.content?.trim() || editor?.isEmpty()) {
    throw new Error('笔记内容不能为空')
  }
  if ((editor?.getText() || '').trim().length < 10) {
    throw new Error('笔记内容不能少于 10 个字')
  }
}

/** 打开弹窗 */
async function open(type: string, id?: number, categoryId?: number) {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增笔记' : '修改笔记'
  formType.value = type
  resetForm()
  if (type === 'create') {
    formData.value.categoryId = categoryId
  }
  formLoading.value = true
  try {
    // 修改时，加载笔记详情
    if (id) {
      formData.value = await NoteApi.getNote(id)
    }
  } finally {
    formLoading.value = false
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
      await NoteApi.createNote(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await NoteApi.updateNote(formData.value)
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
  formData.value = createDefaultFormData()
  formRef.value?.resetFields()
}

/** 创建笔记默认表单数据 */
function createDefaultFormData(): NoteApi.OaNoteVO {
  return {
    type: OA_NOTE_TYPE.MINE,
    priority: OA_PRIORITY.NORMAL,
    title: '',
    content: '',
    fileUrls: []
  }
}
</script>
