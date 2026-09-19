<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="820px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="90px"
    >
      <!-- 公告基本信息 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="公告类型" prop="type">
            <el-select v-model="formData.type" class="w-full" placeholder="请选择公告类型">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_ANNOUNCEMENT_TYPE)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="formData.priority" class="w-full" placeholder="请选择优先级">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_PRIORITY)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="置顶" prop="top">
            <el-switch v-model="formData.top" />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 公告内容 -->
      <el-form-item label="公告标题" prop="title">
        <el-input
          v-model="formData.title"
          maxlength="255"
          show-word-limit
          placeholder="请输入公告标题"
        />
      </el-form-item>
      <el-form-item label="相关链接" prop="url">
        <el-input v-model="formData.url" maxlength="512" placeholder="请输入相关链接（可选）" />
      </el-form-item>
      <el-form-item label="公告内容" prop="content">
        <Editor v-model="formData.content" height="300px" />
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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import type { FormInstance, FormRules } from 'element-plus'
import * as AnnouncementApi from '@/api/oa/announcement'
import { OA_PRIORITY, OA_ANNOUNCEMENT_TYPE } from '../../utils/constants'

defineOptions({ name: 'OaAnnouncementForm' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗是否显示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('create') // 表单的类型：create - 新增；update - 修改
const formData = ref<AnnouncementApi.OaAnnouncementVO>({
  type: OA_ANNOUNCEMENT_TYPE.ANNOUNCEMENT,
  priority: OA_PRIORITY.NORMAL,
  title: '',
  content: '',
  url: '',
  top: false
}) // 表单数据
const formRules = reactive<FormRules>({
  type: [{ required: true, message: '公告类型不能为空', trigger: 'change' }],
  priority: [{ required: true, message: '优先级不能为空', trigger: 'change' }],
  title: [
    { required: true, message: '公告标题不能为空', trigger: 'blur' },
    { max: 255, message: '公告标题不能超过 255 个字符', trigger: 'blur' }
  ],
  url: [{ max: 512, message: '相关链接不能超过 512 个字符', trigger: 'blur' }]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单 Ref

const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()

  // 修改时，加载公告详情
  if (id) {
    formLoading.value = true
    try {
      formData.value = await AnnouncementApi.getAnnouncement(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await AnnouncementApi.createAnnouncement(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await AnnouncementApi.updateAnnouncement(formData.value)
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
    type: OA_ANNOUNCEMENT_TYPE.ANNOUNCEMENT,
    priority: OA_PRIORITY.NORMAL,
    title: '',
    content: '',
    url: '',
    top: false
  }
  formRef.value?.resetFields()
}
</script>
